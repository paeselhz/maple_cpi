import { describe, expect, it } from 'vitest';
import {
  calculateMomYoy,
  customCpi,
  emaSeries,
  groupContributions,
  round,
  weightFor,
} from './transforms.js';
import type { BasketWeightRow, CpiRow } from './types.js';

/** Build a 24-month Canada All-items series growing 0.5% per month from 100. */
function makeSeries(geo: string, group: string, start = 100, growth = 1.005, n = 24): CpiRow[] {
  const rows: CpiRow[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    const month = (i % 12) + 1;
    const year = 2020 + Math.floor(i / 12);
    rows.push({
      ref_date: `${year}-${String(month).padStart(2, '0')}-01`,
      geo,
      product_group: group,
      value: round(v, 4),
    });
    v *= growth;
  }
  return rows;
}

describe('round', () => {
  it('rounds to 3 decimals like R round()', () => {
    expect(round(1.23456)).toBe(1.235);
    expect(round(2 / 3, 3)).toBe(0.667);
  });
});

describe('calculateMomYoy', () => {
  it('computes mom and yoy with positional lag(1)/lag(12), dropping first 12 months', () => {
    const rows = makeSeries('Canada', 'All-items');
    const out = calculateMomYoy(rows);
    // 24 months in, 12 dropped (yoy NA) → 12 kept
    expect(out).toHaveLength(12);
    // constant 0.5% monthly growth → mom ≈ 0.5 every month
    for (const p of out) {
      expect(p.mom).toBeCloseTo(0.5, 3);
    }
    // yoy over 12 months of 0.5% compounding = 1.005^12 - 1 ≈ 6.168%
    const expectedYoy = round((1.005 ** 12 - 1) * 100);
    expect(out[0].yoy).toBeCloseTo(expectedYoy, 2);
  });

  it('matches the exact R formula on a hand example', () => {
    // value doubles at month 13 vs month 1 → yoy = 100%
    const rows: CpiRow[] = [];
    for (let i = 0; i < 13; i++) {
      rows.push({
        ref_date: `2020-${String(i + 1).padStart(2, '0')}-01`.replace('2020-13', '2021-01'),
        geo: 'Canada',
        product_group: 'All-items',
        value: i === 12 ? 200 : 100,
      });
    }
    const out = calculateMomYoy(rows);
    expect(out).toHaveLength(1);
    expect(out[0].yoy).toBe(100);
    expect(out[0].mom).toBe(100); // 200/100 - 1
  });

  it('adds EMA over the NA-filtered yoy when emaWindow > 0', () => {
    const rows = makeSeries('Canada', 'All-items');
    const out = calculateMomYoy(rows, 3);
    expect(out[0].ema).toBeDefined();
    // first ema seeds to first yoy
    expect(out[0].ema).toBeCloseTo(out[0].yoy as number, 3);
  });

  it('keeps separate series independent', () => {
    const a = makeSeries('Canada', 'Food');
    const b = makeSeries('Ontario', 'Food', 100, 1.01);
    const out = calculateMomYoy([...a, ...b]);
    const canada = out.filter((_, i) => i < 12);
    expect(canada).toHaveLength(12);
    expect(out).toHaveLength(24);
  });
});

describe('emaSeries', () => {
  it('matches pracma movavg type="e": a=2/(n+1), seeded with x[0]', () => {
    const x = [10, 20, 30];
    const n = 3;
    const a = 2 / (n + 1); // 0.5
    const expected = [10, a * 20 + (1 - a) * 10, 0];
    expected[2] = a * 30 + (1 - a) * expected[1];
    const got = emaSeries(x, n);
    expect(got[0]).toBeCloseTo(expected[0], 6);
    expect(got[1]).toBeCloseTo(expected[1], 6);
    expect(got[2]).toBeCloseTo(expected[2], 6);
  });

  it('returns a copy when n<=0', () => {
    expect(emaSeries([1, 2, 3], 0)).toEqual([1, 2, 3]);
  });
});

const WEIGHTS: BasketWeightRow[] = [
  { ref_date: '2017', geo: 'Canada', product_group: 'Food', weight: 16, start_month: '2019-01-01', end_month: '2022-12-01' },
  { ref_date: '2021', geo: 'Canada', product_group: 'Food', weight: 17, start_month: '2023-01-01', end_month: '2030-12-01' },
  { ref_date: '2017', geo: 'Canada', product_group: 'Shelter', weight: 27, start_month: '2019-01-01', end_month: '2022-12-01' },
  { ref_date: '2021', geo: 'Canada', product_group: 'Shelter', weight: 28, start_month: '2023-01-01', end_month: '2030-12-01' },
];

describe('weightFor (time-windowed vintages)', () => {
  it('picks the vintage whose window covers the date', () => {
    expect(weightFor(WEIGHTS, 'Canada', 'Food', '2020-06-01')).toBe(16);
    expect(weightFor(WEIGHTS, 'Canada', 'Food', '2024-06-01')).toBe(17);
  });
  it('returns null when no window covers the date', () => {
    expect(weightFor(WEIGHTS, 'Canada', 'Food', '2001-01-01')).toBeNull();
  });
});

describe('groupContributions', () => {
  it('contribution = change% × weight/100 and shares sum to ~100 per date', () => {
    const food = makeSeries('Canada', 'Food', 100, 1.01); // ~12.7% yoy
    const shelter = makeSeries('Canada', 'Shelter', 100, 1.002); // ~2.4% yoy
    const out = groupContributions([...food, ...shelter], WEIGHTS, 'yoy');
    expect(out.length).toBeGreaterThan(0);

    // grab a single date and verify contribution math + share normalization
    const date = out[0].ref_date;
    const atDate = out.filter((p) => p.ref_date === date);
    expect(atDate).toHaveLength(2);
    const shareSum = atDate.reduce((s, p) => s + p.share, 0);
    expect(shareSum).toBeCloseTo(100, 1);

    const foodPt = atDate.find((p) => p.product_group === 'Food')!;
    // Food yoy ≈ (1.01^12-1)*100, weight 16 → contribution ≈ yoy*16/100
    const yoy = round((1.01 ** 12 - 1) * 100);
    expect(foodPt.contribution).toBeCloseTo(round((yoy * 16) / 100), 2);
  });

  it('drops dates with no covering weight vintage', () => {
    const food = makeSeries('Canada', 'Food', 100, 1.01, 24); // 2020-2021, before window start 2019 ok, but window ends 2022 so covered
    const out = groupContributions(food, WEIGHTS, 'yoy');
    // all kept dates must fall within a weight window
    for (const p of out) {
      expect(weightFor(WEIGHTS, 'Canada', p.product_group, p.ref_date)).not.toBeNull();
    }
  });
});

describe('customCpi', () => {
  it('renormalizes selected weights to sum to 1 (weighted average of changes)', () => {
    const food = makeSeries('Canada', 'Food', 100, 1.01);
    const shelter = makeSeries('Canada', 'Shelter', 100, 1.002);
    const allItems = makeSeries('Canada', 'All-items', 100, 1.005);
    const rows = [...food, ...shelter, ...allItems];
    const out = customCpi(rows, WEIGHTS, ['Food', 'Shelter'], 'yoy');
    expect(out.length).toBeGreaterThan(0);

    // At a date, custom = (yoyFood*16 + yoyShelter*27) / (16+27)
    const foodYoy = round((1.01 ** 12 - 1) * 100);
    const shelterYoy = round((1.002 ** 12 - 1) * 100);
    const expected = round((foodYoy * 16 + shelterYoy * 27) / (16 + 27));
    expect(out[0].custom).toBeCloseTo(expected, 1);
    // headline present for comparison
    expect(out[0].headline).not.toBeNull();
  });

  it('single group → custom equals that group change', () => {
    const food = makeSeries('Canada', 'Food', 100, 1.01);
    const allItems = makeSeries('Canada', 'All-items', 100, 1.005);
    const out = customCpi([...food, ...allItems], WEIGHTS, ['Food'], 'yoy');
    const foodYoy = round((1.01 ** 12 - 1) * 100);
    expect(out[0].custom).toBeCloseTo(foodYoy, 1);
  });

  it('empty selection → empty result', () => {
    expect(customCpi(makeSeries('Canada', 'Food'), WEIGHTS, [], 'yoy')).toEqual([]);
  });
});
