/**
 * seed/resolve-vectors.ts — resolve StatCan WDS vector IDs for the CPI + rate
 * series, VERIFY against known-good anchors, and write seed/vectors.json.
 *
 * Run once (offline): `npm run seed:vectors`. The monthly cron reads the committed
 * output; it never re-resolves. Re-run only if StatCan restructures table 18100004.
 *
 * Procedure (WDS_VECTOR_MAP.md):
 *   1. getCubeMetadata → geo/product member IDs (assert Canada → 2)
 *   2. build 99 CPI coordinates (11 geos × 9 groups)
 *   3. getSeriesInfoFromCubePidCoord → vectorId per coordinate
 *   4. assert 3 anchors (Canada/BC/Saskatchewan All-items) — HARD FAIL
 *   5. resolve the 3 rate vectors from table 10100139
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GEOGRAPHIES,
  PRODUCT_GROUPS,
  RATE_SERIES,
  WDS,
  type VectorRecord,
} from '../packages/shared/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Confirmed vector anchors (verified live against WDS, July 2026). NOTE: the
 * doc's Saskatchewan anchor (v41694489) is stale folklore — the same source that
 * mis-stated the geography member IDs. Saskatchewan (member 20) resolves to
 * v41692191, which correctly sorts BETWEEN Canada and BC. We therefore verify
 * primarily by the WDS-returned SeriesTitleEn (self-describing, can't go stale)
 * and keep only the two vector anchors that reproduce live.
 */
const VECTOR_ANCHORS: Record<string, number> = {
  'Canada|All-items': 41690973,
  'British Columbia|All-items': 41692462,
};

interface Member {
  memberId: number;
  memberNameEn: string;
}
interface Dimension {
  dimensionPositionId: number;
  dimensionNameEn: string;
  member: Member[];
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${WDS.BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function getCubeMetadata(productId: number): Promise<Dimension[]> {
  const json = await post<Array<{ status: string; object: { dimension: Dimension[] } }>>(
    'getCubeMetadata',
    [{ productId }],
  );
  const first = json[0];
  if (first?.status !== 'SUCCESS') throw new Error(`getCubeMetadata ${productId}: ${first?.status}`);
  return first.object.dimension;
}

interface Resolved {
  vectorId: number;
  titleEn: string;
}

/** Resolve coordinates → { vectorId, titleEn }, batched (endpoint accepts an array). */
async function resolveCoords(
  productId: number,
  coords: { key: string; coordinate: string }[],
): Promise<Map<string, Resolved>> {
  const out = new Map<string, Resolved>();
  const CHUNK = 50;
  for (let i = 0; i < coords.length; i += CHUNK) {
    const batch = coords.slice(i, i + CHUNK);
    const json = await post<
      Array<{
        status: string;
        object: { coordinate: string; vectorId: number; SeriesTitleEn: string };
      }>
    >(
      'getSeriesInfoFromCubePidCoord',
      batch.map((c) => ({ productId, coordinate: c.coordinate })),
    );
    // Response order is NOT guaranteed to match request order — map by returned coordinate.
    const byCoord = new Map<string, Resolved>();
    for (const r of json) {
      if (r?.status !== 'SUCCESS') throw new Error(`getSeriesInfoFromCubePidCoord: ${r?.status}`);
      byCoord.set(r.object.coordinate, { vectorId: r.object.vectorId, titleEn: r.object.SeriesTitleEn });
    }
    for (const c of batch) {
      const v = byCoord.get(c.coordinate);
      if (v === undefined) throw new Error(`No vector returned for coordinate ${c.coordinate}`);
      out.set(c.key, v);
    }
    if (i + CHUNK < coords.length) await new Promise((r) => setTimeout(r, 500)); // be polite
  }
  return out;
}

function memberMap(dim: Dimension): Map<string, number> {
  const m = new Map<string, number>();
  for (const mem of dim.member) m.set(mem.memberNameEn, mem.memberId);
  return m;
}

async function resolveCpi(): Promise<VectorRecord[]> {
  const dims = await getCubeMetadata(WDS.PID_CPI);
  // Dimension order per WDS_VECTOR_MAP: 0 = Geography, 1 = Products and product groups
  const geoDim = dims[0];
  const prodDim = dims[1];
  const geoIds = memberMap(geoDim);
  const prodIds = memberMap(prodDim);

  // Assert: Canada → 2
  if (geoIds.get('Canada') !== 2) {
    throw new Error(`ABORT: Canada memberId is ${geoIds.get('Canada')}, expected 2. StatCan reordered members.`);
  }

  const coords: { key: string; coordinate: string; geo: string; group: string }[] = [];
  for (const geo of GEOGRAPHIES) {
    const gid = geoIds.get(geo);
    if (gid === undefined) throw new Error(`Geography not found in metadata: ${geo}`);
    for (const group of PRODUCT_GROUPS) {
      const pid = prodIds.get(group);
      if (pid === undefined) throw new Error(`Product group not found in metadata: ${group}`);
      const coordinate = `${gid}.${pid}.0.0.0.0.0.0.0.0`;
      coords.push({ key: `${geo}|${group}`, coordinate, geo, group });
    }
  }

  const resolved = await resolveCoords(WDS.PID_CPI, coords);

  // Primary gate: every series' WDS title must equal `${geo};${group}` (split on
  // first ';' so group names containing commas are handled). Self-describing —
  // proves each coordinate maps to the intended geo+group.
  for (const c of coords) {
    const r = resolved.get(c.key)!;
    const sep = r.titleEn.indexOf(';');
    const geoTitle = r.titleEn.slice(0, sep);
    const groupTitle = r.titleEn.slice(sep + 1);
    if (geoTitle !== c.geo || groupTitle !== c.group) {
      throw new Error(
        `ABORT: coordinate ${c.coordinate} title "${r.titleEn}" ≠ "${c.geo};${c.group}". Map is suspect.`,
      );
    }
  }
  console.log(`✓ All ${coords.length} CPI series verified by title.`);

  // Secondary gate: the two confirmed vector anchors must reproduce.
  for (const [key, expected] of Object.entries(VECTOR_ANCHORS)) {
    const got = resolved.get(key)?.vectorId;
    if (got !== expected) {
      throw new Error(`ABORT: vector anchor ${key} resolved to v${got}, expected v${expected}.`);
    }
  }
  console.log('✓ Confirmed vector anchors (Canada, British Columbia) reproduce.');

  return coords.map((c) => ({
    geo: c.geo,
    group: c.group,
    coordinate: c.coordinate,
    vectorId: resolved.get(c.key)!.vectorId,
  }));
}

async function resolveRates(): Promise<VectorRecord[]> {
  const dims = await getCubeMetadata(WDS.PID_RATES);
  // Find the dimension containing our rate series names.
  const wanted = new Set(Object.keys(RATE_SERIES));
  let targetDim: Dimension | undefined;
  for (const d of dims) {
    if (d.member.some((m) => wanted.has(m.memberNameEn))) {
      targetDim = d;
      break;
    }
  }
  if (!targetDim) throw new Error('Rate series dimension not found in table 10100139 metadata.');

  const names = memberMap(targetDim);
  // Rates cube layout: assume the rate-series dimension is the varying one; other
  // dims default to their first member (memberId of position 1). We build the
  // coordinate by placing the series member in its dimensionPositionId slot.
  const nDims = dims.length;

  const records: VectorRecord[] = [];
  const coords: { key: string; coordinate: string }[] = [];
  for (const name of Object.keys(RATE_SERIES)) {
    const mid = names.get(name);
    if (mid === undefined) throw new Error(`Rate series not found: ${name}`);
    const slots = new Array(10).fill(0);
    // fill each dimension's default (first member) then override the target dim
    for (const d of dims) {
      slots[d.dimensionPositionId - 1] = d.member[0]?.memberId ?? 0;
    }
    slots[targetDim.dimensionPositionId - 1] = mid;
    // trailing slots beyond nDims stay 0
    const coordinate = slots.join('.');
    coords.push({ key: name, coordinate });
  }

  const resolved = await resolveCoords(WDS.PID_RATES, coords);
  for (const name of Object.keys(RATE_SERIES)) {
    const r = resolved.get(name)!;
    // Sanity: the returned title should mention the series name.
    if (!r.titleEn.includes(name)) {
      throw new Error(`ABORT: rate "${name}" resolved to title "${r.titleEn}" — mismatch.`);
    }
    records.push({
      geo: 'Canada',
      group: name,
      coordinate: coords.find((c) => c.key === name)!.coordinate,
      vectorId: r.vectorId,
    });
  }
  console.log(`✓ Resolved ${records.length} rate vectors:`, records.map((r) => `${r.group}=v${r.vectorId}`).join(', '));
  return records;
}

async function main() {
  console.log('Resolving CPI vectors (11 geos × 9 groups = 99)…');
  const cpi = await resolveCpi();
  console.log(`✓ Resolved ${cpi.length} CPI vectors.`);

  console.log('Resolving rate vectors (table 10100139)…');
  const rates = await resolveRates();

  const output = { generatedAt: new Date().toISOString(), cpi, rates };
  const outPath = join(__dirname, 'vectors.json');
  mkdirSync(__dirname, { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${outPath} (${cpi.length} CPI + ${rates.length} rate vectors).`);
}

main().catch((err) => {
  console.error('\n✗ resolve-vectors failed:', err.message);
  process.exit(1);
});
