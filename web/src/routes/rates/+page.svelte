<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import SegmentedControl from '$lib/components/SegmentedControl.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { theme } from '$lib/theme.svelte';
  import { formatPctPlain } from '$lib/format';
  import { windowStart } from '$lib/util';
  import { DATE_WINDOWS } from '$lib/strings';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let windowYears = $state(5);

  const maxDate = $derived(data.rates.at(-1)?.ref_date ?? data.bonds.at(-1)?.ref_date ?? '');
  const from = $derived(windowStart(maxDate, windowYears));
  const inWin = (d: string) => !from || d >= from;

  const latestRate = $derived(data.rates.filter((r) => r.overnight_target != null).at(-1));
  const latestBond = $derived(data.bonds.at(-1));

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
      color: { domain: ['Policy rate', 'CPI (YoY)'], range: [c.series[0], c.series[3]], legend: true },
      marks: [
        Plot.ruleY([2], { stroke: c.muted, strokeDasharray: '2,4' }), // 2% inflation target
        Plot.lineY(rows.filter((r) => r.series === 'Policy rate'), { x: (d) => new Date(d.ref_date), y: 'value', stroke: c.series[0], strokeWidth: 2.2, curve: 'step-after' }),
        Plot.lineY(rows.filter((r) => r.series === 'CPI (YoY)'), { x: (d) => new Date(d.ref_date), y: 'value', stroke: c.series[3], strokeWidth: 2.2 }),
        Plot.tip(rows, Plot.pointerX({ x: (d) => new Date(d.ref_date), y: 'value', title: (d) => `${d.series}\n${d.ref_date}: ${d.value}%` })),
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
        Plot.tip(rows, Plot.pointerX({ x: (d) => new Date(d.ref_date), y: 'value', title: (d) => `${d.series}\n${d.ref_date}: ${d.value}%` })),
      ],
    };
  }
</script>

<svelte:head><title>Rates — Maple CPI</title></svelte:head>

<div class="head">
  <div>
    <h1>Interest rates &amp; bond yields</h1>
    <p class="muted sub">The Bank of Canada moves its policy rate to steer inflation toward its 2% target.</p>
  </div>
  <SegmentedControl
    options={DATE_WINDOWS.map((w) => ({ label: w.label, value: String(w.years) }))}
    value={String(windowYears)} onChange={(v) => (windowYears = Number(v))} ariaLabel="Window" />
</div>

<div class="tiles">
  <div class="tile card"><span class="muted tiny">Policy rate</span><span class="tv tnum">{formatPctPlain(latestRate?.overnight_target)}</span></div>
  <div class="tile card"><span class="muted tiny">Bank rate</span><span class="tv tnum">{formatPctPlain(latestRate?.bank_rate)}</span></div>
  <div class="tile card"><span class="muted tiny">2yr / 5yr / 10yr</span><span class="tv tnum small">{formatPctPlain(latestBond?.yr2)} / {formatPctPlain(latestBond?.yr5)} / {formatPctPlain(latestBond?.yr10)}</span></div>
</div>

<section class="card">
  <h2>Policy rate vs. inflation</h2>
  <p class="muted tiny">Dashed line marks the 2% inflation target.</p>
  <Chart build={policyVsCpi} height={320} revision={theme.revision} ariaLabel="Policy rate versus CPI year-over-year" />
</section>

<section class="card">
  <h2>Government of Canada benchmark bond yields</h2>
  <Chart build={bondsSpec} height={300} revision={theme.revision} ariaLabel="Bond yields 2, 5 and 10 year" />
</section>

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
  h1 { margin: 0 0 2px; }
  .sub { margin: 0; }
  h2 { font-size: 18px; margin: 0 0 2px; }
  .tiny { font-size: 12px; }
  .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
  .tile { display: flex; flex-direction: column; gap: 4px; }
  .tv { font-size: 30px; font-weight: 800; color: var(--accent); }
  .tv.small { font-size: 19px; }
  section.card { margin-bottom: 16px; }
  @media (max-width: 700px) { .tiles { grid-template-columns: 1fr; } }
</style>
