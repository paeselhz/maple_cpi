import { json } from '@sveltejs/kit';
import { db, queryBonds, queryRates } from '$lib/server/queries';
import type { RequestHandler } from './$types';

/** GET /api/rates?from=&to= → money-market rates + benchmark bond yields. */
export const GET: RequestHandler = async ({ url, platform, setHeaders }) => {
  const d1 = db(platform);
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;

  const [rates, bonds] = await Promise.all([queryRates(d1, from, to), queryBonds(d1, from, to)]);

  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return json({ rates, bonds });
};
