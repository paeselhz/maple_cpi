import { json } from '@sveltejs/kit';
import { calculateMomYoy } from '@maple-cpi/shared';
import { db, queryCpi } from '$lib/server/queries';
import type { RequestHandler } from './$types';

/**
 * GET /api/cpi?geo=Canada&group=All-items&from=YYYY-MM-DD&to=YYYY-MM-DD&ema=6
 * Returns the index level + computed mom/yoy (+ema when ema>0) for one series.
 * Multiple geos: repeat ?geo= or pass geos=comma,separated (returns per-series).
 */
export const GET: RequestHandler = async ({ url, platform, setHeaders }) => {
  const d1 = db(platform);
  const geos = url.searchParams.getAll('geo').concat((url.searchParams.get('geos') ?? '').split(',').filter(Boolean));
  const group = url.searchParams.get('group') ?? 'All-items';
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;
  const ema = Number(url.searchParams.get('ema') ?? '0') || 0;

  const geoList = geos.length ? geos : ['Canada'];

  // Pull an extra 13 months before `from` so yoy/mom at the window start are defined.
  const fromPad = from ? shiftMonths(from, -13) : undefined;

  const series = await Promise.all(
    geoList.map(async (geo) => {
      const rows = await queryCpi(d1, { geo, group, from: fromPad, to });
      let points = calculateMomYoy(rows, ema);
      if (from) points = points.filter((p) => p.ref_date >= from);
      return { geo, group, points };
    }),
  );

  setHeaders({ 'cache-control': 'public, max-age=3600' });
  return json({ series });
};

function shiftMonths(date: string, months: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
