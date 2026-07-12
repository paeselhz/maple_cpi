/** Locale-aware formatters (en-CA now; PARKINGLOT i18n insurance — swap locale later). */
const LOCALE = 'en-CA';

const pct = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct2 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function formatPct(v: number | null | undefined, d = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '–';
  const s = (d === 2 ? pct2 : pct).format(v);
  return `${v > 0 ? '+' : ''}${s}%`;
}

export function formatPctPlain(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '–';
  return `${pct.format(v)}%`;
}

export function formatMonth(iso: string): string {
  return monthYear.format(new Date(iso + 'T00:00:00Z'));
}
export function formatMonthShort(iso: string): string {
  return monthShort.format(new Date(iso + 'T00:00:00Z'));
}
export function formatDay(iso: string): string {
  return dayFmt.format(new Date(iso + 'T00:00:00Z'));
}

/** Percentage-point contribution with an up/down glyph and a true minus sign.
    e.g. 0.9 → "↑ +0.9pp", -0.2 → "↓ −0.2pp". Direction shown by glyph, not color. */
export function formatPP(v: number | null | undefined, d = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '–';
  const glyph = v > 0.05 ? '↑ ' : v < -0.05 ? '↓ ' : '';
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${glyph}${sign}${Math.abs(v).toFixed(d)}pp`;
}

/** Direction glyph + accessible label — never rely on color alone. */
export function direction(v: number | null | undefined): { glyph: string; label: string } {
  if (v === null || v === undefined || Number.isNaN(v)) return { glyph: '', label: '' };
  if (v > 0.05) return { glyph: '▲', label: 'up' };
  if (v < -0.05) return { glyph: '▼', label: 'down' };
  return { glyph: '▬', label: 'flat' };
}
