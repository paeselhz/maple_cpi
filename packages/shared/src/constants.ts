/**
 * Canonical string lists — pinned VERBATIM to the strings the original R app and
 * StatCan WDS use, so historical joins line up. Do not "tidy" these.
 * Source: legacy global.R (geographical_locations, major_groups, icon_groups).
 */

/** 11 v1 geographies: Canada + 10 provinces, StatCan east-to-west order. */
export const GEOGRAPHIES = [
  'Canada',
  'Newfoundland and Labrador',
  'Prince Edward Island',
  'Nova Scotia',
  'New Brunswick',
  'Quebec',
  'Ontario',
  'Manitoba',
  'Saskatchewan',
  'Alberta',
  'British Columbia',
] as const;

export type Geography = (typeof GEOGRAPHIES)[number];

/** 9 product groups: All-items + the 8 major groups. Verbatim StatCan strings. */
export const PRODUCT_GROUPS = [
  'All-items',
  'Food',
  'Shelter',
  'Household operations, furnishings and equipment',
  'Clothing and footwear',
  'Transportation',
  'Health and personal care',
  'Recreation, education and reading',
  'Alcoholic beverages, tobacco products and recreational cannabis',
] as const;

export type ProductGroup = (typeof PRODUCT_GROUPS)[number];

/** The 8 major groups (excludes All-items) — used for contribution/simulation. */
export const MAJOR_GROUPS = PRODUCT_GROUPS.slice(1) as unknown as ProductGroup[];

/**
 * Font Awesome icon per group (index-aligned with PRODUCT_GROUPS), carried from
 * the original `icon_groups` for brand continuity.
 */
export const GROUP_ICONS: Record<ProductGroup, string> = {
  'All-items': 'fa-solid fa-asterisk',
  Food: 'fa-solid fa-utensils',
  Shelter: 'fa-solid fa-house',
  'Household operations, furnishings and equipment': 'fa-solid fa-wrench',
  'Clothing and footwear': 'fa-solid fa-shirt',
  Transportation: 'fa-solid fa-plane',
  'Health and personal care': 'fa-solid fa-heart',
  'Recreation, education and reading': 'fa-solid fa-book',
  'Alcoholic beverages, tobacco products and recreational cannabis': 'fa-solid fa-martini-glass',
};

/** Short display labels for the long group names (UI only — never used as keys). */
export const GROUP_SHORT_LABELS: Record<ProductGroup, string> = {
  'All-items': 'All-items',
  Food: 'Food',
  Shelter: 'Shelter',
  'Household operations, furnishings and equipment': 'Household ops & furnishings',
  'Clothing and footwear': 'Clothing & footwear',
  Transportation: 'Transportation',
  'Health and personal care': 'Health & personal care',
  'Recreation, education and reading': 'Recreation, education & reading',
  'Alcoholic beverages, tobacco products and recreational cannabis': 'Alcohol, tobacco & cannabis',
};

/** Legacy chart accent colors (from the original Highcharts theme / cards). */
export const LEGACY_COLORS = {
  accent: '#E4572E',
  cardCoral: '#E87D6B',
  red: '#E53622',
  maroon: '#4F2824',
  green: '#009949',
} as const;

/** StatCan WDS REST base + product IDs. */
export const WDS = {
  BASE: 'https://www150.statcan.gc.ca/t1/wds/rest',
  PID_CPI: 18100004,
  PID_RATES: 10100139,
} as const;

/** Bank of Canada Valet endpoint for benchmark bond yields. */
export const VALET_BOND_YIELDS_JSON =
  'https://www.bankofcanada.ca/valet/observations/group/bond_yields_all/json';

/** Money-market rate series (table 10100139) → D1 column mapping. */
export const RATE_SERIES: Record<string, 'overnight_target' | 'bank_rate' | 'corra'> = {
  'Target rate': 'overnight_target',
  'Bank rate': 'bank_rate',
  'Overnight money market financing': 'corra',
};

/** History floors carried from the original app. */
export const CPI_HISTORY_FLOOR = '2001-01-01';
export const RATES_HISTORY_FLOOR = '2002-01-01';

/** CPI basket weights product table (separate from the CPI index table). */
export const WDS_PID_WEIGHTS = 18100007;

/**
 * Basket-weight vintage → CPI-effective validity window (inclusive), keyed by the
 * vintage's reference year. Rows 1996–2022 are the authoritative windows the
 * original app shipped (data/basket_weights_timewindow.rds); 2023–2025 extend
 * them following StatCan's annual-update schedule (each vintage effective in May
 * of ref-year+1 through April of ref-year+2; the 2025 basket effective May 2026
 * matches StatCan's May-2026 basket update). The current vintage is open-ended.
 */
export const WEIGHT_WINDOWS: Record<number, { start_month: string; end_month: string }> = {
  1996: { start_month: '1997-12-01', end_month: '2002-11-01' },
  2001: { start_month: '2002-12-01', end_month: '2007-03-01' },
  2005: { start_month: '2007-04-01', end_month: '2011-03-01' },
  2009: { start_month: '2011-04-01', end_month: '2012-12-01' },
  2011: { start_month: '2013-01-01', end_month: '2014-11-01' },
  2013: { start_month: '2014-12-01', end_month: '2016-11-01' },
  2015: { start_month: '2016-12-01', end_month: '2018-12-01' },
  2017: { start_month: '2019-01-01', end_month: '2021-06-01' },
  2020: { start_month: '2021-07-01', end_month: '2022-04-01' },
  2021: { start_month: '2022-05-01', end_month: '2023-04-01' },
  2022: { start_month: '2023-05-01', end_month: '2024-04-01' },
  2023: { start_month: '2024-05-01', end_month: '2025-04-01' },
  2024: { start_month: '2025-05-01', end_month: '2026-04-01' },
  2025: { start_month: '2026-05-01', end_month: '2099-12-01' },
};
