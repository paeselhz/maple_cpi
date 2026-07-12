/**
 * Centralized UI copy (PARKINGLOT i18n insurance — a later en/fr split is a lookup
 * swap, not a component rewrite). Do not inline user-facing strings in components.
 */
export const strings = {
  appName: 'Maple CPI',
  tagline: 'Canadian inflation, in plain sight.',
  nav: {
    home: 'Home',
    timeseries: 'Explore',
    basket: 'The basket',
    rates: 'Rates',
    about: 'About',
  },
  glossary: {
    yoy: 'Year-over-year: how much prices changed compared with the same month last year. This is the headline inflation number.',
    mom: 'Month-over-month: how much prices changed from the previous month.',
    cpi: 'The Consumer Price Index tracks the price of a fixed basket of goods and services a typical household buys, so a rising index means the cost of living is going up.',
    ema: 'A smoothed trend line that dampens month-to-month noise to show the underlying direction.',
    contribution: "Each group's share of the headline inflation number, weighting its price change by how big a slice of the basket it is.",
    basketWeight: 'How much of a typical household budget goes to each group. Updated by Statistics Canada roughly once a year.',
  },
  sources: {
    cpi: { label: 'StatCan Table 18-10-0004', url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401' },
    weights: { label: 'StatCan Table 18-10-0007', url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000701' },
    rates: { label: 'StatCan Table 10-10-0139', url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010013901' },
    bonds: { label: 'Bank of Canada Valet', url: 'https://www.bankofcanada.ca/valet/' },
  },
};

export const DATE_WINDOWS = [
  { label: '1Y', years: 1 },
  { label: '2Y', years: 2 },
  { label: '3Y', years: 3 },
  { label: '5Y', years: 5 },
  { label: 'All', years: 0 },
] as const;
