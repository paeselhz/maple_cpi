import type { Geography, ProductGroup } from './constants.js';

/** One CPI index-level observation (mirrors the `cpi` table). */
export interface CpiRow {
  ref_date: string; // 'YYYY-MM-01'
  geo: string;
  product_group: string;
  value: number; // index level (2002=100)
}

/** Money-market rates, one row per date (mirrors `boc_rates`). */
export interface BocRateRow {
  ref_date: string; // daily 'YYYY-MM-DD'
  overnight_target: number | null;
  bank_rate: number | null;
  corra: number | null;
}

/** GoC benchmark bond yields (mirrors `bond_yields`). */
export interface BondYieldRow {
  ref_date: string; // daily 'YYYY-MM-DD'
  yr2: number | null;
  yr5: number | null;
  yr10: number | null;
}

/** Time-windowed basket weight vintage (mirrors `basket_weights`). */
export interface BasketWeightRow {
  ref_date: string; // weight vintage
  geo: string;
  product_group: string;
  weight: number; // percent (0..100), as published
  start_month: string; // validity window (inclusive)
  end_month: string; // validity window (inclusive)
}

/** A computed MoM/YoY point for a single (geo, group) series. */
export interface MomYoyPoint {
  ref_date: string;
  cpi_level: number;
  mom: number | null;
  yoy: number | null;
  ema?: number | null;
}

/** A group's weighted contribution to headline CPI at a point in time. */
export interface ContributionPoint {
  ref_date: string;
  product_group: string;
  /** yoy (or mom) × weight/100 — same units as headline % change. */
  contribution: number;
  /** share of total absolute contribution at this date, in percent. */
  share: number;
}

/** Resolved StatCan vector record, committed as seed/vectors.json. */
export interface VectorRecord {
  geo: string;
  group: string; // 'group' for CPI; the rate name for rate vectors
  coordinate: string;
  vectorId: number; // numeric (no 'v' prefix)
}

export type { Geography, ProductGroup };
