import type {
  BasketWeightRow,
  BocRateRow,
  BondYieldRow,
  CpiRow,
  D1Database,
} from '@maple-cpi/shared';
import { error } from '@sveltejs/kit';

export function db(platform: App.Platform | undefined): D1Database {
  const d = platform?.env?.DB;
  if (!d) throw error(503, 'Database binding unavailable');
  return d;
}

export async function queryCpi(
  d1: D1Database,
  opts: { geo?: string; group?: string; geos?: string[]; groups?: string[]; from?: string; to?: string },
): Promise<CpiRow[]> {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (opts.geo) {
    where.push('geo = ?');
    binds.push(opts.geo);
  }
  if (opts.geos?.length) {
    where.push(`geo IN (${opts.geos.map(() => '?').join(',')})`);
    binds.push(...opts.geos);
  }
  if (opts.group) {
    where.push('product_group = ?');
    binds.push(opts.group);
  }
  if (opts.groups?.length) {
    where.push(`product_group IN (${opts.groups.map(() => '?').join(',')})`);
    binds.push(...opts.groups);
  }
  if (opts.from) {
    where.push('ref_date >= ?');
    binds.push(opts.from);
  }
  if (opts.to) {
    where.push('ref_date <= ?');
    binds.push(opts.to);
  }
  const sql = `SELECT ref_date, geo, product_group, value FROM cpi
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY geo, product_group, ref_date`;
  const { results } = await d1.prepare(sql).bind(...binds).all<CpiRow>();
  return results;
}

export async function queryWeights(d1: D1Database, geo?: string): Promise<BasketWeightRow[]> {
  const sql = geo
    ? `SELECT ref_date, geo, product_group, weight, start_month, end_month FROM basket_weights WHERE geo = ?`
    : `SELECT ref_date, geo, product_group, weight, start_month, end_month FROM basket_weights`;
  const stmt = geo ? d1.prepare(sql).bind(geo) : d1.prepare(sql);
  const { results } = await stmt.all<BasketWeightRow>();
  return results;
}

export async function queryRates(d1: D1Database, from?: string, to?: string): Promise<BocRateRow[]> {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (from) {
    where.push('ref_date >= ?');
    binds.push(from);
  }
  if (to) {
    where.push('ref_date <= ?');
    binds.push(to);
  }
  const sql = `SELECT ref_date, overnight_target, bank_rate, corra FROM boc_rates
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ref_date`;
  const { results } = await d1.prepare(sql).bind(...binds).all<BocRateRow>();
  return results;
}

export async function queryBonds(d1: D1Database, from?: string, to?: string): Promise<BondYieldRow[]> {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (from) {
    where.push('ref_date >= ?');
    binds.push(from);
  }
  if (to) {
    where.push('ref_date <= ?');
    binds.push(to);
  }
  const sql = `SELECT ref_date, yr2, yr5, yr10 FROM bond_yields
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ref_date`;
  const { results } = await d1.prepare(sql).bind(...binds).all<BondYieldRow>();
  return results;
}

export async function queryMeta(d1: D1Database): Promise<Record<string, string>> {
  const { results } = await d1.prepare('SELECT key, value FROM meta').all<{ key: string; value: string }>();
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}

export async function queryAvailableGeosGroups(
  d1: D1Database,
): Promise<{ geos: string[]; groups: string[]; minDate: string; maxDate: string }> {
  const geos = (await d1.prepare('SELECT DISTINCT geo FROM cpi ORDER BY geo').all<{ geo: string }>()).results.map((r) => r.geo);
  const groups = (await d1.prepare('SELECT DISTINCT product_group FROM cpi').all<{ product_group: string }>()).results.map((r) => r.product_group);
  const range = await d1.prepare('SELECT MIN(ref_date) mn, MAX(ref_date) mx FROM cpi').first<{ mn: string; mx: string }>();
  return { geos, groups, minDate: range?.mn ?? '', maxDate: range?.mx ?? '' };
}
