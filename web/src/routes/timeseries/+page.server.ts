import { calculateMomYoy } from '@maple-cpi/shared';
import { db, queryAvailableGeosGroups, queryCpi } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

/** Answer-first: open on Canada / All-items with data already on screen. Also
 *  precompute each province's latest YoY to colour the map without a round-trip. */
export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const d1 = db(platform);
  const avail = await queryAvailableGeosGroups(d1);

  const canada = await queryCpi(d1, { geo: 'Canada', group: 'All-items' });
  const initialSeries = calculateMomYoy(canada);

  // latest YoY per geo for the map
  const allGeoAllItems = await queryCpi(d1, { group: 'All-items' });
  const byGeo = new Map<string, typeof allGeoAllItems>();
  for (const r of allGeoAllItems) {
    if (!byGeo.has(r.geo)) byGeo.set(r.geo, []);
    byGeo.get(r.geo)!.push(r);
  }
  const mapValues: Record<string, number | null> = {};
  for (const [geo, rows] of byGeo) {
    mapValues[geo] = calculateMomYoy(rows).at(-1)?.yoy ?? null;
  }

  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return { avail, initialSeries, mapValues };
};
