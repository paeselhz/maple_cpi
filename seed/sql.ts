/** Escape a scalar for inline SQL VALUES (seed files only — the Worker uses bound params). */
export function sqlEscape(v: string | number | null): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  return `'${v.replace(/'/g, "''")}'`;
}
