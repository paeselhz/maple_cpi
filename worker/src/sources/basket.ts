/**
 * CPI basket weights (StatCan table 18100007), shared by the Worker + seed.
 *
 * We take the "Weight at basket reference period prices" price period and the
 * "Distribution to selected geographies" distribution (each geography's own
 * basket, summing to 100 within itself) — matching the original R app's
 * basket_weights.rds filter. Vintages are mapped to CPI-effective validity
 * windows via WEIGHT_WINDOWS.
 */

import {
  GEOGRAPHIES,
  PRODUCT_GROUPS,
  WDS,
  WDS_PID_WEIGHTS,
  WEIGHT_WINDOWS,
  type BasketWeightRow,
} from '@maple-cpi/shared';

const PRICE_PERIOD_REFERENCE = 'Weight at basket reference period prices';
const DISTRIBUTION_SELECTED = 'Distribution to selected geographies';

interface Member {
  memberId: number;
  memberNameEn: string;
}
interface Dimension {
  dimensionPositionId: number;
  dimensionNameEn: string;
  member: Member[];
}

async function wdsPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${WDS.BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`WDS ${path} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

function findMemberId(dim: Dimension, name: string): number {
  const m = dim.member.find((x) => x.memberNameEn === name);
  if (!m) throw new Error(`18100007: member "${name}" not found in dimension "${dim.dimensionNameEn}"`);
  return m.memberId;
}

export async function fetchBasketWeights(): Promise<BasketWeightRow[]> {
  // 1. metadata → member IDs
  const meta = await wdsPost<Array<{ status: string; object: { dimension: Dimension[] } }>>(
    'getCubeMetadata',
    [{ productId: WDS_PID_WEIGHTS }],
  );
  if (meta[0]?.status !== 'SUCCESS') throw new Error('18100007 metadata fetch failed');
  const dims = meta[0].object.dimension;
  const geoDim = dims[0];
  const prodDim = dims[1];
  const priceDim = dims[2];
  const distDim = dims[3];

  const pricePeriodId = findMemberId(priceDim, PRICE_PERIOD_REFERENCE);
  const distributionId = findMemberId(distDim, DISTRIBUTION_SELECTED);

  // 2. build 99 coordinates (geo × group), resolve → vectorId
  interface Coord {
    geo: string;
    group: string;
    coordinate: string;
  }
  const coords: Coord[] = [];
  for (const geo of GEOGRAPHIES) {
    const gid = findMemberId(geoDim, geo);
    for (const group of PRODUCT_GROUPS) {
      const pid = findMemberId(prodDim, group);
      coords.push({ geo, group, coordinate: `${gid}.${pid}.${pricePeriodId}.${distributionId}.0.0.0.0.0.0` });
    }
  }

  const vectorByKey = new Map<string, number>();
  const CHUNK = 50;
  for (let i = 0; i < coords.length; i += CHUNK) {
    const batch = coords.slice(i, i + CHUNK);
    const json = await wdsPost<Array<{ status: string; object: { coordinate: string; vectorId: number } }>>(
      'getSeriesInfoFromCubePidCoord',
      batch.map((c) => ({ productId: WDS_PID_WEIGHTS, coordinate: c.coordinate })),
    );
    const byCoord = new Map<string, number>();
    for (const r of json) {
      if (r?.status === 'SUCCESS') byCoord.set(r.object.coordinate, r.object.vectorId);
    }
    for (const c of batch) {
      const v = byCoord.get(c.coordinate);
      if (v !== undefined) vectorByKey.set(`${c.geo}|${c.group}`, v);
    }
    if (i + CHUNK < coords.length) await new Promise((r) => setTimeout(r, 300));
  }

  // 3. bulk-fetch all vintages per vector
  const allVectorIds = [...vectorByKey.values()];
  const keyByVector = new Map<number, { geo: string; group: string }>();
  for (const c of coords) {
    const v = vectorByKey.get(`${c.geo}|${c.group}`);
    if (v !== undefined) keyByVector.set(v, { geo: c.geo, group: c.group });
  }

  const rows: BasketWeightRow[] = [];
  const BULK = 20;
  for (let i = 0; i < allVectorIds.length; i += BULK) {
    const chunk = allVectorIds.slice(i, i + BULK);
    const json = await wdsPost<
      Array<{ status: string; object: { vectorId: number; vectorDataPoint: Array<{ refPer: string; value: number | string | null }> } }>
    >('getBulkVectorDataByRange', {
      vectorIds: chunk.map((v) => String(v)),
      startDataPointReleaseDate: '1990-01-01T00:00',
      endDataPointReleaseDate: '2099-12-31T23:59',
    });
    for (const env of json) {
      if (env.status !== 'SUCCESS') continue;
      const key = keyByVector.get(env.object.vectorId);
      if (!key) continue;
      for (const p of env.object.vectorDataPoint ?? []) {
        const year = Number(p.refPer.slice(0, 4));
        const window = WEIGHT_WINDOWS[year];
        if (!window) continue; // vintage outside our mapped windows (e.g. 1986/1992)
        const value = p.value === null || p.value === '' ? null : Number(p.value);
        if (value === null || !Number.isFinite(value)) continue;
        rows.push({
          ref_date: String(year),
          geo: key.geo,
          product_group: key.group,
          weight: value,
          start_month: window.start_month,
          end_month: window.end_month,
        });
      }
    }
    if (i + BULK < allVectorIds.length) await new Promise((r) => setTimeout(r, 250));
  }

  return rows;
}
