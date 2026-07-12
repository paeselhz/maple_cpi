import { calculateMomYoy, groupContributions, MAJOR_GROUPS } from '@maple-cpi/shared';
import { db, queryCpi, queryMeta, queryRates, queryWeights } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

/** Home = the answer. Compute Canada headline + top contributors + a rate line server-side. */
export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const d1 = db(platform);

  const [allItems, majorRows, weights, rates, meta] = await Promise.all([
    queryCpi(d1, { geo: 'Canada', group: 'All-items' }),
    queryCpi(d1, { geo: 'Canada', groups: [...MAJOR_GROUPS] }),
    queryWeights(d1, 'Canada'),
    queryRates(d1),
    queryMeta(d1),
  ]);

  const headline = calculateMomYoy(allItems);
  const latest = headline.at(-1) ?? null;
  const spark = headline.slice(-60); // last 5y for the hero sparkline

  // Latest-month contributions, ranked by magnitude.
  const contribs = groupContributions(majorRows, weights, 'yoy');
  const latestDate = contribs.at(-1)?.ref_date;
  const latestContribs = contribs
    .filter((c) => c.ref_date === latestDate)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const rateSpark = rates.slice(-500);
  const latestRate = rates.at(-1) ?? null;

  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return {
    latest,
    spark,
    latestContribs,
    latestDate: latestDate ?? '',
    rateSpark,
    latestRate,
    lastIngest: meta.last_ingest ?? '',
  };
};
