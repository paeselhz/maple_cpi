import { GROUP_SHORT_LABELS, type ProductGroup } from '@maple-cpi/shared';

/** ISO date `years` before `maxDate` (0 = all history → return undefined/floor). */
export function windowStart(maxDate: string, years: number): string | undefined {
  if (!years) return undefined;
  const d = new Date(maxDate + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export function shortGroup(g: string): string {
  return GROUP_SHORT_LABELS[g as ProductGroup] ?? g;
}

export function parseDate(iso: string): Date {
  return new Date(iso + 'T00:00:00Z');
}
