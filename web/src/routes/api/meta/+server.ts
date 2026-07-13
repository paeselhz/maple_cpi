import { json } from '@sveltejs/kit';
import { db, queryAvailableGeosGroups, queryMeta } from '$lib/server/queries';
import type { RequestHandler } from './$types';

/** GET /api/meta → latest ref dates, last ingest, available geos/groups (drives dropdowns). */
export const GET: RequestHandler = async ({ platform, setHeaders }) => {
  const d1 = db(platform);
  const [meta, avail] = await Promise.all([queryMeta(d1), queryAvailableGeosGroups(d1)]);
  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return json({ meta, ...avail });
};
