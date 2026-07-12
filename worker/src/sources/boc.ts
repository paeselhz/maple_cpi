/**
 * Bank of Canada Valet — GoC benchmark bond yields (2/5/10yr).
 * Not StatCan; no vectors. Full history in one JSON call.
 */

import { VALET_BOND_YIELDS_JSON, type BondYieldRow } from '@maple-cpi/shared';

/**
 * Valet series naming: benchmark yields are BD.CDN.<TERM>.DQ.YLD, e.g.
 * BD.CDN.2YR.DQ.YLD, BD.CDN.5YR.DQ.YLD, BD.CDN.10YR.DQ.YLD.
 */
const SERIES = {
  yr2: 'BD.CDN.2YR.DQ.YLD',
  yr5: 'BD.CDN.5YR.DQ.YLD',
  yr10: 'BD.CDN.10YR.DQ.YLD',
} as const;

interface ValetResponse {
  observations: Array<Record<string, { v: string } | string>>;
}

function num(cell: { v: string } | string | undefined): number | null {
  if (!cell || typeof cell === 'string') return null;
  const n = Number(cell.v);
  return Number.isFinite(n) ? n : null;
}

export async function fetchBondYields(): Promise<BondYieldRow[]> {
  const res = await fetch(VALET_BOND_YIELDS_JSON);
  if (!res.ok) throw new Error(`Valet → HTTP ${res.status}`);
  const json = (await res.json()) as ValetResponse;

  const rows: BondYieldRow[] = [];
  for (const obs of json.observations ?? []) {
    const ref_date = obs.d as string;
    if (!ref_date) continue;
    const yr2 = num(obs[SERIES.yr2]);
    const yr5 = num(obs[SERIES.yr5]);
    const yr10 = num(obs[SERIES.yr10]);
    if (yr2 === null && yr5 === null && yr10 === null) continue;
    rows.push({ ref_date, yr2, yr5, yr10 });
  }
  return rows;
}
