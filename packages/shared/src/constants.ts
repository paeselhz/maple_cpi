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
