import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';

/** Current query params, read once for initializing component state from a shared link. */
export function initParams(): URLSearchParams {
  return get(page).url.searchParams;
}

/** Parse a `1`/`0` (or `true`/`false`) query value into a boolean, falling back to `def`. */
export function boolParam(sp: URLSearchParams, key: string, def: boolean): boolean {
  const v = sp.get(key);
  if (v == null) return def;
  return v === '1' || v === 'true';
}

/** Parse a numeric query value, falling back to `def` when absent or unparseable. */
export function numParam(sp: URLSearchParams, key: string, def: number): number {
  const v = sp.get(key);
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/**
 * Write selections to the URL query string without navigating or re-running
 * load. Values equal to their default are omitted so shared links stay short
 * and canonical. Safe to call from an $effect — it no-ops during SSR.
 */
export function syncQuery(entries: Record<string, { value: unknown; default: unknown }>): void {
  if (!browser) return;
  const url = new URL(get(page).url);
  const sp = url.searchParams;
  for (const [key, { value, default: def }] of Object.entries(entries)) {
    if (value === def || value == null || value === '') {
      sp.delete(key);
    } else {
      sp.set(key, value === true ? '1' : value === false ? '0' : String(value));
    }
  }
  const qs = sp.toString();
  const next = url.pathname + (qs ? `?${qs}` : '');
  if (next !== location.pathname + location.search) replaceState(next, {});
}
