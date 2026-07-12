<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import SegmentedControl from '$lib/components/SegmentedControl.svelte';
  import Explainer from '$lib/components/Explainer.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { crosshairMarks } from '$lib/plot/crosshair';
  import { theme } from '$lib/theme.svelte';
  import { formatMonth, formatPct, formatPctPlain } from '$lib/format';
  import { shortGroup, windowStart } from '$lib/util';
  import { strings, DATE_WINDOWS } from '$lib/strings';
  import {
    MAJOR_GROUPS,
    GROUP_ICONS,
    customCpi,
    groupContributions,
    weightFor,
    type ProductGroup,
  } from '@maple-cpi/shared';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let metric = $state<'yoy' | 'mom'>('yoy');
  let windowYears = $state(3);
  // simulation selection — start with all groups on (= headline)
  let selected = $state<Record<string, boolean>>(Object.fromEntries(MAJOR_GROUPS.map((g) => [g, true])));

  const from = $derived(windowStart(latestDate(), windowYears));

  function latestDate(): string {
    return data.cpi.reduce((m, r) => (r.ref_date > m ? r.ref_date : m), '');
  }

  const contribs = $derived(groupContributions(data.cpi, data.weights, metric));
  const latest = $derived.by(() => {
    const d = contribs.at(-1)?.ref_date;
    return contribs
      .filter((c) => c.ref_date === d)
      .sort((a, b) => b.contribution - a.contribution);
  });
  const latestDateStr = $derived(contribs.at(-1)?.ref_date ?? '');

  // Ranked contribution bar (DESIGN §4: ranked bar beats the old stack for "who's the culprit")
  function barSpec(width: number): Plot.PlotOptions {
    const c = plotColors();
    return {
      height: 320,
      marginLeft: 162,
      marginRight: 48,
      x: { label: `${metric.toUpperCase()} contribution (pp)`, grid: true },
      y: { label: null },
      marks: [
        Plot.ruleX([0], { stroke: c.border }),
        Plot.barX(latest, {
          x: 'contribution',
          y: (d) => shortGroup(d.product_group),
          fill: c.accent,
          sort: { y: 'x', reverse: true },
        }),
        Plot.text(latest, {
          x: 'contribution',
          y: (d) => shortGroup(d.product_group),
          text: (d) => formatPct(d.contribution, 2),
          dx: 6,
          textAnchor: 'start',
          fontSize: 11,
          fill: c.muted,
        }),
      ],
    };
  }

  // Simulation: custom CPI from selected groups vs the FULL basket (all 8 groups).
  // The baseline is the all-groups reconstruction so selecting everything gives an
  // exact 0.00 pp delta (it also tracks the published All-items imperceptibly).
  const selectedGroups = $derived(MAJOR_GROUPS.filter((g) => selected[g]));
  const allSelected = $derived(selectedGroups.length === MAJOR_GROUPS.length);
  const baseline = $derived(
    customCpi(data.cpi, data.weights, [...MAJOR_GROUPS], metric).filter((p) => !from || p.ref_date >= from),
  );
  const yours = $derived(
    customCpi(data.cpi, data.weights, selectedGroups, metric).filter((p) => !from || p.ref_date >= from),
  );
  const delta = $derived.by(() => {
    const y = yours.at(-1)?.custom;
    const b = baseline.at(-1)?.custom;
    return y != null && b != null ? y - b : 0;
  });

  const simRows = $derived([
    ...yours.map((p) => ({ ref_date: p.ref_date, value: p.custom, series: 'Your basket' })),
    ...baseline.map((p) => ({ ref_date: p.ref_date, value: p.custom, series: 'Official (All-items)' })),
  ]);

  function simSpec(width: number): Plot.PlotOptions {
    const c = plotColors();
    return {
      height: 300,
      x: { type: 'utc', label: null },
      y: { label: `${metric.toUpperCase()} %`, grid: true, tickFormat: (d: number) => d + '%' },
      color: { domain: ['Your basket', 'Official (All-items)'], range: [c.accent, c.muted], legend: true },
      marks: [
        Plot.ruleY([0], { stroke: c.border }),
        Plot.lineY(simRows, { x: (d) => new Date(d.ref_date), y: 'value', stroke: 'series', strokeWidth: 2.2 }),
        ...crosshairMarks(simRows, { header: formatMonth }),
      ],
    };
  }

  function weightPct(g: string): number | null {
    return weightFor(data.weights, 'Canada', g, latestDateStr);
  }
  const selectedWeight = $derived(selectedGroups.reduce((s, g) => s + (weightPct(g) ?? 0), 0));
</script>

<svelte:head><title>The basket — Maple CPI</title></svelte:head>

<h1>What's in the basket</h1>
<p class="muted sub">
  Headline inflation is a weighted average of eight groups. See each group's
  <Explainer term="contribution" text={strings.glossary.contribution} />, then switch groups off to
  build your own basket and compare.
</p>

<div class="toolbar">
  <SegmentedControl
    options={[{ label: 'Year-over-year', value: 'yoy' }, { label: 'Month-over-month', value: 'mom' }]}
    value={metric} onChange={(v) => (metric = v as 'yoy' | 'mom')} ariaLabel="Change type" />
  <SegmentedControl
    options={DATE_WINDOWS.map((w) => ({ label: w.label, value: String(w.years) }))}
    value={String(windowYears)} onChange={(v) => (windowYears = Number(v))} ariaLabel="Window" />
</div>

<div class="grid">
  <section class="card">
    <h2>Who's driving it {latestDateStr ? `· ${formatMonth(latestDateStr)}` : ''}</h2>
    <p class="muted tiny">Each group's contribution to the headline number, ranked.</p>
    <Chart build={barSpec} height={320} revision={theme.revision} ariaLabel="Ranked group contributions" />
  </section>

  <section class="card">
    <div class="simhd">
      <div>
        <h2>Build your basket</h2>
        <p class="muted tiny">Toggle groups; the custom line re-weights to what's left.</p>
      </div>
      <div class="delta">
        <div class="dlabel muted tiny">Your basket vs official</div>
        <div class="dval tnum" class:pos={delta > 0} class:neg={delta < 0}>
          {delta > 0 ? '+' : ''}{delta.toFixed(2)} pp
        </div>
      </div>
    </div>

    <div class="pickers">
      {#each MAJOR_GROUPS as g (g)}
        <button
          class="pick"
          class:on={selected[g]}
          aria-pressed={selected[g]}
          onclick={() => (selected = { ...selected, [g]: !selected[g] })}
        >
          <i class={GROUP_ICONS[g as ProductGroup]}></i>
          <span class="pg">{shortGroup(g)}</span>
          <span class="pw tnum muted">{formatPctPlain(weightPct(g))}</span>
        </button>
      {/each}
    </div>
    <p class="muted tiny wsum">Selected weight: <strong class="tnum">{selectedWeight.toFixed(1)}%</strong> of the basket, re-normalized to 100%.</p>

    <Chart build={simSpec} height={300} revision={theme.revision} ariaLabel="Custom basket vs official CPI" />
  </section>
</div>

<style>
  h1 { margin: 0 0 2px; }
  .sub { margin: 0 0 16px; max-width: 70ch; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  h2 { font-size: 18px; margin: 0 0 2px; }
  .tiny { font-size: 12px; }
  .simhd { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .delta { text-align: right; }
  .dval { font-size: 22px; font-weight: 800; }
  .dval.pos { color: var(--accent); }
  .dval.neg { color: var(--series-4); }
  .pickers { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
  .pick {
    display: flex; align-items: center; gap: 8px; text-align: left;
    border: 1px solid var(--border); background: var(--surface-2); color: var(--muted);
    border-radius: 10px; padding: 9px 11px; cursor: pointer; font: inherit; font-size: 13px;
    min-height: 44px;
  }
  .pick.on { background: var(--surface); color: var(--ink); border-color: var(--accent); }
  .pick i { color: var(--accent); width: 16px; text-align: center; }
  .pg { flex: 1; font-weight: 600; }
  .pw { font-size: 12px; }
  .wsum { margin: 4px 0 14px; }
  @media (max-width: 800px) {
    .grid { grid-template-columns: 1fr; }
    .pickers { grid-template-columns: 1fr; }
  }
</style>
