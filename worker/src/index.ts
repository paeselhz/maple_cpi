/**
 * Maple CPI ingest Worker.
 *
 * - scheduled(): monthly cron. Idempotent + cheap — checks the latest WDS CPI
 *   reference period against meta.cpi_latest_ref_date and skips the heavy CPI
 *   upsert when unchanged. Rates + bond yields (daily) always refresh a recent
 *   window. Each source is wrapped so one failure doesn't sink the run.
 * - fetch(): guarded /__ingest?token=… route to trigger ingestion while
 *   developing. Requires the INGEST_TOKEN secret; returns 404 otherwise.
 */

import {
  CPI_HISTORY_FLOOR,
  RATE_SERIES,
  RATES_HISTORY_FLOOR,
  type BocRateRow,
  type CpiRow,
} from '@maple-cpi/shared';
import vectorsData from '../../seed/vectors.json';
import { fetchLatestNPeriods } from './sources/statcan.js';
import { fetchBondYields } from './sources/boc.js';
import { fetchBasketWeights } from './sources/basket.js';
import {
  getMeta,
  setMeta,
  upsertBonds,
  upsertCpi,
  upsertRates,
  upsertWeights,
  type D1Database,
} from './db.js';

interface VectorRec {
  geo: string;
  group: string;
  coordinate: string;
  vectorId: number;
}
const VECTORS = vectorsData as { cpi: VectorRec[]; rates: VectorRec[] };

export interface Env {
  DB: D1Database;
  INGEST_TOKEN?: string;
}

interface IngestResult {
  cpi: number;
  rates: number;
  bonds: number;
  weights: number;
  skippedCpi: boolean;
  errors: string[];
}

/** Latest N monthly periods to pull on a refresh (covers revisions + YoY base). */
const REFRESH_N = 14;

async function ingest(env: Env): Promise<IngestResult> {
  const result: IngestResult = { cpi: 0, rates: 0, bonds: 0, weights: 0, skippedCpi: false, errors: [] };
  const db = env.DB;

  // ---- CPI (idempotent short-circuit) ----
  try {
    const cpiVectors = VECTORS.cpi;
    const series = await fetchLatestNPeriods(cpiVectors.map((v) => v.vectorId), REFRESH_N);
    const byVector = new Map(cpiVectors.map((v) => [v.vectorId, v]));

    // latest ref period across all series
    let latest = '';
    for (const s of series) for (const p of s.points) if (p.refPer > latest) latest = p.refPer;

    const known = await getMeta(db, 'cpi_latest_ref_date');
    if (latest && known === latest) {
      result.skippedCpi = true;
    } else {
      const rows: CpiRow[] = [];
      for (const s of series) {
        const rec = byVector.get(s.vectorId);
        if (!rec) continue;
        for (const p of s.points) {
          if (p.value === null || p.refPer < CPI_HISTORY_FLOOR) continue;
          rows.push({ ref_date: p.refPer, geo: rec.geo, product_group: rec.group, value: p.value });
        }
      }
      result.cpi = await upsertCpi(db, rows);
      if (latest) await setMeta(db, 'cpi_latest_ref_date', latest);
    }
  } catch (e) {
    result.errors.push(`cpi: ${(e as Error).message}`);
  }

  // ---- Rates (pivot latest N) ----
  try {
    const rateVectors = VECTORS.rates;
    const series = await fetchLatestNPeriods(rateVectors.map((v) => v.vectorId), REFRESH_N);
    const colByVector = new Map(rateVectors.map((v) => [v.vectorId, RATE_SERIES[v.group]]));
    const byDate = new Map<string, BocRateRow>();
    for (const s of series) {
      const col = colByVector.get(s.vectorId);
      if (!col) continue;
      for (const p of s.points) {
        if (p.refPer < RATES_HISTORY_FLOOR) continue;
        const row = byDate.get(p.refPer) ?? { ref_date: p.refPer, overnight_target: null, bank_rate: null, corra: null };
        row[col] = p.value;
        byDate.set(p.refPer, row);
      }
    }
    result.rates = await upsertRates(db, [...byDate.values()]);
  } catch (e) {
    result.errors.push(`rates: ${(e as Error).message}`);
  }

  // ---- Bond yields (recent window only) ----
  try {
    const bonds = await fetchBondYields();
    const cutoff = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
    result.bonds = await upsertBonds(db, bonds.filter((b) => b.ref_date >= cutoff));
  } catch (e) {
    result.errors.push(`bonds: ${(e as Error).message}`);
  }

  // ---- Basket weights (cheap, changes rarely; keep current) ----
  try {
    const weights = await fetchBasketWeights();
    result.weights = await upsertWeights(db, weights);
  } catch (e) {
    result.errors.push(`weights: ${(e as Error).message}`);
  }

  await setMeta(db, 'last_ingest', new Date().toISOString());
  if (result.errors.length) await setMeta(db, 'last_ingest_errors', result.errors.join(' | '));
  return result;
}

export default {
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void> {
    ctx.waitUntil(
      ingest(env).then((r) => console.log('ingest complete', JSON.stringify(r))),
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/__ingest') {
      const token = url.searchParams.get('token');
      if (!env.INGEST_TOKEN || token !== env.INGEST_TOKEN) {
        return new Response('Not found', { status: 404 });
      }
      const result = await ingest(env);
      return Response.json(result);
    }
    if (url.pathname === '/health') return new Response('ok');
    return new Response('Not found', { status: 404 });
  },
};
