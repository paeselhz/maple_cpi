/**
 * seed/backfill.ts — one-off historical backfill (2001→present) from StatCan WDS
 * + Bank of Canada Valet. Fetches everything and emits ready-to-load SQL files in
 * seed/out/, plus prints row counts (Phase 3 smoke test).
 *
 * Run: `npm run seed:backfill`. Then load into D1:
 *   wrangler d1 execute maple-cpi --remote --file seed/out/cpi.sql
 *   wrangler d1 execute maple-cpi --remote --file seed/out/boc_rates.sql
 *   wrangler d1 execute maple-cpi --remote --file seed/out/bond_yields.sql
 *   wrangler d1 execute maple-cpi --remote --file seed/out/basket_weights.sql
 *
 * This is NOT in the cron path — history is loaded once.
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CPI_HISTORY_FLOOR,
  RATES_HISTORY_FLOOR,
  RATE_SERIES,
  VALET_BOND_YIELDS_JSON,
  WDS,
  type VectorRecord,
} from '../packages/shared/src/index.js';
import { fetchBulkVectorRange, type VectorSeries } from '../worker/src/sources/statcan.js';
import { fetchBondYields } from '../worker/src/sources/boc.js';
import { fetchBasketWeights } from '../worker/src/sources/basket.js';
import { sqlEscape } from './sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');

interface VectorsFile {
  cpi: VectorRecord[];
  rates: VectorRecord[];
}

function loadVectors(): VectorsFile {
  return JSON.parse(readFileSync(join(__dirname, 'vectors.json'), 'utf8')) as VectorsFile;
}

const nowIso = () => new Date().toISOString().slice(0, 16);

/** Emit a batched INSERT … ON CONFLICT statement set. */
function insertSql(table: string, columns: string[], rows: (string | number | null)[][], conflictCols: string[]): string {
  if (rows.length === 0) return `-- no rows for ${table}\n`;
  const updates = columns.filter((c) => !conflictCols.includes(c)).map((c) => `${c}=excluded.${c}`).join(', ');
  const lines: string[] = [];
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const values = rows
      .slice(i, i + CHUNK)
      .map((r) => `(${r.map(sqlEscape).join(',')})`)
      .join(',\n');
    lines.push(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values}\nON CONFLICT(${conflictCols.join(', ')}) DO UPDATE SET ${updates};`,
    );
  }
  return lines.join('\n') + '\n';
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const vectors = loadVectors();
  const end = nowIso();

  // ---- CPI ----
  console.log(`Fetching CPI history (${vectors.cpi.length} vectors) from ${CPI_HISTORY_FLOOR}…`);
  const cpiSeries = await fetchBulkVectorRange(
    vectors.cpi.map((v) => v.vectorId),
    `${CPI_HISTORY_FLOOR}T00:00`,
    end,
  );
  const cpiByVector = new Map(vectors.cpi.map((v) => [v.vectorId, v]));
  const cpiRows: (string | number | null)[][] = [];
  for (const s of cpiSeries) {
    const rec = cpiByVector.get(s.vectorId);
    if (!rec) continue;
    for (const p of s.points) {
      if (p.value === null) continue;
      // WDS start param filters by RELEASE date, not reference period — floor here.
      if (p.refPer < CPI_HISTORY_FLOOR) continue;
      cpiRows.push([p.refPer, rec.geo, rec.group, p.value]);
    }
  }
  writeFileSync(join(OUT, 'cpi.sql'), insertSql('cpi', ['ref_date', 'geo', 'product_group', 'value'], cpiRows, ['ref_date', 'geo', 'product_group']));
  const cpiDates = cpiRows.map((r) => r[0] as string).sort();
  console.log(`  cpi: ${cpiRows.length} rows, ${cpiDates[0]} → ${cpiDates[cpiDates.length - 1]}`);

  // ---- Rates (pivot 3 series → one row per date) ----
  console.log(`Fetching money-market rates (${vectors.rates.length} vectors) from ${RATES_HISTORY_FLOOR}…`);
  const rateSeries = await fetchBulkVectorRange(
    vectors.rates.map((v) => v.vectorId),
    `${RATES_HISTORY_FLOOR}T00:00`,
    end,
  );
  const rateCol = new Map(vectors.rates.map((v) => [v.vectorId, RATE_SERIES[v.group]]));
  const rateByDate = new Map<string, { overnight_target: number | null; bank_rate: number | null; corra: number | null }>();
  for (const s of rateSeries) {
    const col = rateCol.get(s.vectorId);
    if (!col) continue;
    for (const p of s.points) {
      if (p.refPer < RATES_HISTORY_FLOOR) continue;
      const row = rateByDate.get(p.refPer) ?? { overnight_target: null, bank_rate: null, corra: null };
      row[col] = p.value;
      rateByDate.set(p.refPer, row);
    }
  }
  const rateRows = [...rateByDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([d, r]) => [d, r.overnight_target, r.bank_rate, r.corra] as (string | number | null)[]);
  writeFileSync(join(OUT, 'boc_rates.sql'), insertSql('boc_rates', ['ref_date', 'overnight_target', 'bank_rate', 'corra'], rateRows, ['ref_date']));
  console.log(`  boc_rates: ${rateRows.length} rows`);

  // ---- Bond yields (Valet) ----
  console.log('Fetching GoC bond yields (Valet)…');
  const bonds = await fetchBondYields();
  const bondRows = bonds.map((b) => [b.ref_date, b.yr2, b.yr5, b.yr10] as (string | number | null)[]);
  writeFileSync(join(OUT, 'bond_yields.sql'), insertSql('bond_yields', ['ref_date', 'yr2', 'yr5', 'yr10'], bondRows, ['ref_date']));
  console.log(`  bond_yields: ${bondRows.length} rows`);

  // ---- Basket weights (table 18100007) ----
  console.log('Fetching basket weights (table 18100007)…');
  const weights = await fetchBasketWeights();
  const weightRows = weights.map((w) => [w.ref_date, w.geo, w.product_group, w.weight, w.start_month, w.end_month] as (string | number | null)[]);
  writeFileSync(
    join(OUT, 'basket_weights.sql'),
    insertSql('basket_weights', ['ref_date', 'geo', 'product_group', 'weight', 'start_month', 'end_month'], weightRows, ['ref_date', 'geo', 'product_group']),
  );
  console.log(`  basket_weights: ${weightRows.length} rows`);

  // meta seed
  const latest = cpiDates[cpiDates.length - 1] ?? '';
  writeFileSync(
    join(OUT, 'meta.sql'),
    insertSql('meta', ['key', 'value'], [
      ['cpi_latest_ref_date', latest],
      ['last_ingest', new Date().toISOString()],
      ['backfilled_at', new Date().toISOString()],
    ], ['key']),
  );

  console.log('\n✓ Backfill SQL written to seed/out/. Load into D1 with the wrangler commands in the file header.');
}

main().catch((err) => {
  console.error('\n✗ backfill failed:', err.stack ?? err.message);
  process.exit(1);
});

export type { VectorSeries };
