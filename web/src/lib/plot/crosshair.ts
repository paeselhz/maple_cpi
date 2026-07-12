import * as Plot from '@observablehq/plot';
import { plotColors } from './theme';

interface LongRow {
  ref_date: string;
  value: number;
  series: string;
}

/**
 * Shared/synced tooltip for multi-series time charts: a vertical rule at the
 * pointer's x plus one tip listing every series' value at that date (Observable
 * Plot has no built-in shared tooltip — this is the manual wiring DESIGN §6 calls
 * for). Pivots long rows to wide internally.
 */
export function crosshairMarks(
  rows: LongRow[],
  opts: { format?: (v: number) => string; header?: (iso: string) => string } = {},
): Plot.Markish[] {
  const fmt = opts.format ?? ((v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`);
  const header = opts.header ?? ((d) => d);
  const c = plotColors();

  const byDate = new Map<string, Record<string, number>>();
  const order: string[] = [];
  for (const r of rows) {
    if (!byDate.has(r.ref_date)) byDate.set(r.ref_date, {});
    byDate.get(r.ref_date)![r.series] = r.value;
    if (!order.includes(r.series)) order.push(r.series);
  }

  const wide = [...byDate.entries()].map(([ref_date, vals]) => {
    const finite = Object.values(vals).filter((v) => Number.isFinite(v));
    return { ref_date, ...vals, _anchor: finite.length ? Math.max(...finite) : 0 } as Record<string, unknown>;
  });

  const title = (d: Record<string, unknown>) =>
    header(d.ref_date as string) +
    '\n' +
    order
      .filter((s) => typeof d[s] === 'number')
      .map((s) => `${s}: ${fmt(d[s] as number)}`)
      .join('\n');

  return [
    Plot.ruleX(wide, Plot.pointerX({ x: (d) => new Date(d.ref_date as string), stroke: c.muted, strokeOpacity: 0.4 })),
    Plot.tip(
      wide,
      Plot.pointerX({
        x: (d) => new Date(d.ref_date as string),
        y: (d) => d._anchor as number,
        title,
        fontSize: 12,
        lineHeight: 1.3,
      }),
    ),
  ];
}
