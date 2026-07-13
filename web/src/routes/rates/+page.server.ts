import { calculateMomYoy } from '@maple-cpi/shared';
import { db, queryBonds, queryCpi, queryRates } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

/** Rates in context: pair the BoC policy rate with headline CPI (DESIGN §5). */
export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const d1 = db(platform);
  const [rates, bonds, cpi] = await Promise.all([
    queryRates(d1),
    queryBonds(d1),
    queryCpi(d1, { geo: 'Canada', group: 'All-items' }),
  ]);
  const cpiYoy = calculateMomYoy(cpi).map((p) => ({ ref_date: p.ref_date, yoy: p.yoy }));
  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return { rates, bonds, cpiYoy };
};
