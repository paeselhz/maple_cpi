/**
 * StatCan WDS fetchers, shared by the ingest Worker and the seed backfill.
 * Treat all responses as untrusted — validate shape before use.
 */

import { WDS } from '@maple-cpi/shared';

export interface VectorPoint {
  refPer: string; // 'YYYY-MM-DD'
  value: number | null;
}
export interface VectorSeries {
  vectorId: number;
  points: VectorPoint[];
}

interface BulkEnvelope {
  status: string;
  object: {
    vectorId: number;
    vectorDataPoint: Array<{ refPer: string; value: number | string | null }>;
  };
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

function toNumOrNull(v: number | string | null): number | null {
  if (v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * getBulkVectorDataByRange over a set of vectors. Vector IDs are passed numeric
 * (no 'v' prefix). Chunks the vector list to stay polite; each call returns the
 * full range for its vectors.
 */
export async function fetchBulkVectorRange(
  vectorIds: number[],
  startIso: string, // 'YYYY-MM-DDTHH:mm'
  endIso: string,
  chunkSize = 20,
): Promise<VectorSeries[]> {
  const out: VectorSeries[] = [];
  for (let i = 0; i < vectorIds.length; i += chunkSize) {
    const chunk = vectorIds.slice(i, i + chunkSize);
    const json = await wdsPost<BulkEnvelope[]>('getBulkVectorDataByRange', {
      vectorIds: chunk.map((v) => String(v)),
      startDataPointReleaseDate: startIso,
      endDataPointReleaseDate: endIso,
    });
    for (const env of json) {
      if (env.status !== 'SUCCESS') continue;
      out.push({
        vectorId: env.object.vectorId,
        points: (env.object.vectorDataPoint ?? []).map((p) => ({
          refPer: p.refPer,
          value: toNumOrNull(p.value),
        })),
      });
    }
    if (i + chunkSize < vectorIds.length) await new Promise((r) => setTimeout(r, 250));
  }
  return out;
}

/**
 * getDataFromVectorsAndLatestNPeriods — cheap monthly-refresh fetch (small N).
 * Returns the latest N points per vector.
 */
export async function fetchLatestNPeriods(vectorIds: number[], n: number): Promise<VectorSeries[]> {
  const json = await wdsPost<BulkEnvelope[]>(
    'getDataFromVectorsAndLatestNPeriods',
    vectorIds.map((v) => ({ vectorId: v, latestN: n })),
  );
  const out: VectorSeries[] = [];
  for (const env of json) {
    if (env.status !== 'SUCCESS') continue;
    out.push({
      vectorId: env.object.vectorId,
      points: (env.object.vectorDataPoint ?? []).map((p) => ({
        refPer: p.refPer,
        value: toNumOrNull(p.value),
      })),
    });
  }
  return out;
}
