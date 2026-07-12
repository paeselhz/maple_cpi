/** Read a CSS custom property off :root (so Plot matches the active theme). */
function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function plotColors() {
  return {
    ink: cssVar('--ink', '#1c1a19'),
    muted: cssVar('--muted', '#8a817c'),
    border: cssVar('--border', '#e7ded7'),
    accent: cssVar('--accent', '#e4572e'),
    series: [
      cssVar('--series-1', '#e4572e'),
      cssVar('--series-2', '#4f2824'),
      cssVar('--series-3', '#0a8754'),
      cssVar('--series-4', '#2e6fa3'),
      cssVar('--series-5', '#c58a1a'),
    ],
  };
}

/** Base Plot options shared by every chart for a consistent look. */
export function basePlotOptions(width: number) {
  const c = plotColors();
  return {
    width,
    style: { background: 'transparent', color: c.ink, fontFamily: 'inherit', fontSize: '12px', overflow: 'visible' },
    marginLeft: 44,
    marginRight: 16,
    marginBottom: 34,
  };
}
