import { MAJOR_GROUPS } from '@maple-cpi/shared';
import { db, queryCpi, queryWeights } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

/** The basket: contributions (view) + simulation (edit) as ONE surface (DESIGN §5).
 *  Ship Canada major-group history + weights; the page computes both client-side
 *  with the shared transforms so toggling groups is instant. */
export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const d1 = db(platform);
  const [cpi, weights] = await Promise.all([
    queryCpi(d1, { geo: 'Canada', groups: [...MAJOR_GROUPS, 'All-items'] }),
    queryWeights(d1, 'Canada'),
  ]);
  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return { cpi, weights };
};
