<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import SegmentedControl from '$lib/components/SegmentedControl.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { crosshairMarks } from '$lib/plot/crosshair';
  import { theme } from '$lib/theme.svelte';
  import { formatMonthShort, formatDay, formatPctPlain } from '$lib/format';
  import { windowStart } from '$lib/util';
  import { DATE_WINDOWS } from '$lib/strings';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let windowYears = $state(5);

  const maxDate = $derived(data.rates.at(-1)?.ref_date ?? data.bonds.at(-1)?.ref_date ?? '');
  const from = $derived(windowStart(maxDate, windowYears));
  const inWin = (d: string) => !from || d >= from;

  const rateSeries = $derived(data.rates.filter((r) => r.overnight_target != null));
  const latestRate = $derived(rateSeries.at(-1));
  const latestBond = $derived(data.bonds.at(-1));

  // Last move in the policy rate — the "▼ −0.25 on Jun 4" note (direction by glyph, not good/bad).
  const policyMove = $derived.by(() => {
    const s = rateSeries;
    if (s.length < 2) return null;
    const last = s.at(-1)!.overnight_target as number;
    for (let i = s.length - 2; i >= 0; i--) {
      const v = s[i].overnight_target as number;
      if (v !== last) {
        // the change happened at the first row that reached `last`
        const changedAt = s[i + 1].ref_date;
        return { delta: last - v, date: changedAt };
      }
    }
    return null;
  });

  // Policy rate vs headline CPI — the "response" story (dual axis via rescale)
  function policyVsCpi(width: number): Plot.PlotOptions {
    const c = plotColors();
    const rates = data.rates.filter((r) => r.overnight_target != null && inWin(r.ref_date));
    const cpi = data.cpiYoy.filter((p) => p.yoy != null && inWin(p.ref_date));
    const rows = [
      ...rates.map((r) => ({ ref_date: r.ref_date, value: r.overnight_target as number, series: 'Policy rate' })),
      ...cpi.map((p) => ({ ref_date: p.ref_date, value: p.yoy as number, series: 'CPI (YoY)' })),
    ];
    return {
      height: 320,
      x: { type: 'utc', label: null },
      y: { label: '%', grid: true, tickFormat: (d: number) => d + '%' },
      color: { domain: ['Policy rate', 'CPI (YoY)'], range: [c.series[0], c.series[1]] },
      marks: [
        Plot.ruleY([2], { stroke: c.faint, strokeDasharray: '5,4', strokeWidth: 1.5 }), // 2% inflation target
        Plot.lineY(rows.filter((r) => r.series === 'Policy rate'), { x: (d) => new Date(d.ref_date), y: 'value', stroke: c.series[0], strokeWidth: 2.6, curve: 'step-after' }),
        Plot.lineY(rows.filter((r) => r.series === 'CPI (YoY)'), { x: (d) => new Date(d.ref_date), y: 'value', stroke: c.series[1], strokeWidth: 2.2 }),
        ...crosshairMarks(rows, { header: formatMonthShort, format: (v) => `${v.toFixed(2)}%` }),
      ],
    };
  }

  function bondsSpec(width: number): Plot.PlotOptions {
    const c = plotColors();
    const b = data.bonds.filter((d) => inWin(d.ref_date));
    const rows = [
      ...b.filter((d) => d.yr2 != null).map((d) => ({ ref_date: d.ref_date, value: d.yr2 as number, series: '2-year' })),
      ...b.filter((d) => d.yr5 != null).map((d) => ({ ref_date: d.ref_date, value: d.yr5 as number, series: '5-year' })),
      ...b.filter((d) => d.yr10 != null).map((d) => ({ ref_date: d.ref_date, value: d.yr10 as number, series: '10-year' })),
    ];
    return {
      height: 300,
      x: { type: 'utc', label: null },
      y: { label: 'Yield %', grid: true, tickFormat: (d: number) => d + '%' },
      color: { domain: ['2-year', '5-year', '10-year'], range: [c.series[0], c.series[1], c.series[2]], legend: true },
      marks: [
        Plot.lineY(rows, { x: (d) => new Date(d.ref_date), y: 'value', stroke: 'series', strokeWidth: 2 }),
        ...crosshairMarks(rows, { header: formatDay, format: (v) => `${v.toFixed(2)}%` }),
      ],
    };
  }
</script>

<svelte:head><title>Rates — Maple CPI</title></svelte:head>

<div class="head">
  <div class="page-header">
    <p class="page-kicker">Rates</p>
    <h1>Interest rates &amp; bond yields</h1>
    <p class="lead">The Bank of Canada moves its policy rate to steer inflation toward its 2% target.</p>
  </div>
  <div class="winctl">
    <SegmentedControl
      options={DATE_WINDOWS.map((w) => ({ label: w.label, value: String(w.years) }))}
      value={String(windowYears)} onChange={(v) => (windowYears = Number(v))} ariaLabel="Window" />
  </div>
</div>

<div class="tiles">
  <div class="tile card">
    <span class="eyebrow">Policy rate</span>
    <span class="tv tnum">{formatPctPlain(latestRate?.overnight_target, 2).replace('%', '')}<span class="pct">%</span></span>
    {#if policyMove}
      <span class="note mono" class:cut={policyMove.delta < 0}>
        {policyMove.delta < 0 ? '▼' : '▲'} {policyMove.delta > 0 ? '+' : '−'}{Math.abs(policyMove.delta).toFixed(2)} on {formatDay(policyMove.date)}
      </span>
    {/if}
  </div>
  <div class="tile card">
    <span class="eyebrow">Bank rate</span>
    <span class="tv tnum">{formatPctPlain(latestRate?.bank_rate, 2).replace('%', '')}<span class="pct">%</span></span>
    <span class="note mono muted">— ceiling of the range</span>
  </div>
  <div class="tile card wide">
    <span class="eyebrow">Bond yields · 2Y / 5Y / 10Y</span>
    <span class="tv tnum split">
      {formatPctPlain(latestBond?.yr2).replace('%', '')}<span class="pct">%</span><span class="slash">/</span>{formatPctPlain(latestBond?.yr5).replace('%', '')}<span class="pct">%</span><span class="slash">/</span>{formatPctPlain(latestBond?.yr10).replace('%', '')}<span class="pct">%</span>
    </span>
    <span class="note mono muted">Government of Canada benchmarks</span>
  </div>
</div>

<section class="card chartcard">
  <div class="section-head">
    <h2>Policy rate vs. inflation</h2>
    <p class="caption">Dashed line marks the 2% target — where the Bank wants CPI to sit.</p>
  </div>
  <div class="legend">
    <span><span class="sw" style="background:var(--series-1)"></span>Policy rate</span>
    <span><span class="sw" style="background:var(--series-2)"></span>CPI (YoY)</span>
    <span><span class="sw dash"></span>2% target</span>
  </div>
  <Chart build={policyVsCpi} height={320} revision={theme.revision} ariaLabel="Policy rate versus CPI year-over-year" />
</section>

<section class="card chartcard">
  <div class="section-head">
    <h2>Government of Canada benchmark bond yields</h2>
    <p class="caption">What the market charges to lend to Ottawa across 2-, 5- and 10-year horizons.</p>
  </div>
  <Chart build={bondsSpec} height={300} revision={theme.revision} ariaLabel="Bond yields 2, 5 and 10 year" />
</section>

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
  .head .page-header { margin-bottom: 24px; }
  .winctl { padding-top: 44px; flex: none; }
  h2 { font-size: clamp(20px, 3vw, 24px); font-weight: 500; }

  .tiles { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 20px; margin-bottom: 24px; }
  .tile { display: flex; flex-direction: column; padding: 24px 26px; }
  .tile .eyebrow { margin-bottom: 12px; }
  .tv {
    font-family: var(--font-sans);
    font-size: 56px;
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -0.03em;
    color: var(--ink);
    display: flex;
    align-items: baseline;
  }
  .tv .pct { font-size: 0.48em; font-weight: 800; }
  .tv.split { font-size: 42px; gap: 8px; flex-wrap: wrap; }
  .tv .slash { color: var(--border-strong); font-weight: 500; margin: 0 2px; }
  .note { font-size: 13px; margin-top: 12px; }
  .note.cut { color: var(--green); }

  .chartcard { margin-bottom: 20px; padding: 28px 30px; }
  .legend { display: flex; flex-wrap: wrap; gap: 22px; margin-bottom: 14px; font-size: 13px; font-weight: 500; color: var(--ink); }
  .legend span { display: flex; align-items: center; gap: 7px; }
  .legend .sw { width: 16px; height: 3px; border-radius: 2px; }
  .legend .sw.dash { height: 0; border-top: 2px dashed var(--faint); border-radius: 0; }

  @media (max-width: 760px) {
    .tiles { grid-template-columns: 1fr; }
    .winctl { padding-top: 0; }
    .chartcard { padding: 22px 20px; }
    .tv { font-size: 48px; }
    .tv.split { font-size: 34px; }
  }
</style>
