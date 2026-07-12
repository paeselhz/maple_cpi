/**
 * D1 upsert helpers. All writes use bound parameters + prepared statements
 * (never string interpolation) and DB.batch() for bulk idempotent upserts.
 */

import type { BasketWeightRow, BocRateRow, BondYieldRow, CpiRow } from '@maple-cpi/shared';

// Minimal D1 typings (avoid a hard dep on @cloudflare/workers-types at runtime).
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(col?: string): Promise<T | null>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

/** Split into chunks so a single batch doesn't exceed D1 limits. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const BATCH = 100;

export async function upsertCpi(db: D1Database, rows: CpiRow[]): Promise<number> {
  const sql = `INSERT INTO cpi (ref_date, geo, product_group, value) VALUES (?, ?, ?, ?)
    ON CONFLICT(ref_date, geo, product_group) DO UPDATE SET value = excluded.value`;
  let n = 0;
  for (const group of chunk(rows, BATCH)) {
    await db.batch(group.map((r) => db.prepare(sql).bind(r.ref_date, r.geo, r.product_group, r.value)));
    n += group.length;
  }
  return n;
}

export async function upsertRates(db: D1Database, rows: BocRateRow[]): Promise<number> {
  const sql = `INSERT INTO boc_rates (ref_date, overnight_target, bank_rate, corra) VALUES (?, ?, ?, ?)
    ON CONFLICT(ref_date) DO UPDATE SET
      overnight_target = excluded.overnight_target,
      bank_rate = excluded.bank_rate,
      corra = excluded.corra`;
  let n = 0;
  for (const group of chunk(rows, BATCH)) {
    await db.batch(group.map((r) => db.prepare(sql).bind(r.ref_date, r.overnight_target, r.bank_rate, r.corra)));
    n += group.length;
  }
  return n;
}

export async function upsertBonds(db: D1Database, rows: BondYieldRow[]): Promise<number> {
  const sql = `INSERT INTO bond_yields (ref_date, yr2, yr5, yr10) VALUES (?, ?, ?, ?)
    ON CONFLICT(ref_date) DO UPDATE SET yr2 = excluded.yr2, yr5 = excluded.yr5, yr10 = excluded.yr10`;
  let n = 0;
  for (const group of chunk(rows, BATCH)) {
    await db.batch(group.map((r) => db.prepare(sql).bind(r.ref_date, r.yr2, r.yr5, r.yr10)));
    n += group.length;
  }
  return n;
}

export async function upsertWeights(db: D1Database, rows: BasketWeightRow[]): Promise<number> {
  const sql = `INSERT INTO basket_weights (ref_date, geo, product_group, weight, start_month, end_month)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(ref_date, geo, product_group) DO UPDATE SET
      weight = excluded.weight, start_month = excluded.start_month, end_month = excluded.end_month`;
  let n = 0;
  for (const group of chunk(rows, BATCH)) {
    await db.batch(group.map((r) => db.prepare(sql).bind(r.ref_date, r.geo, r.product_group, r.weight, r.start_month, r.end_month)));
    n += group.length;
  }
  return n;
}

export async function setMeta(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
    .bind(key, value)
    .run();
}

export async function getMeta(db: D1Database, key: string): Promise<string | null> {
  return db.prepare(`SELECT value FROM meta WHERE key = ?`).bind(key).first<string>('value');
}
