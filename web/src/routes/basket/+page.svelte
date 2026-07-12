<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import SegmentedControl from '$lib/components/SegmentedControl.svelte';
  import Explainer from '$lib/components/Explainer.svelte';
  import ContributionBars from '$lib/components/ContributionBars.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { crosshairMarks } from '$lib/plot/crosshair';
  import { theme } from '$lib/theme.svelte';
  import { formatMonth, formatPctPlain } from '$lib/format';
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

  // Simulation: custom CPI from selected groups vs the FULL basket (all 8 groups).
  // The baseline is the all-groups reconstruction so selecting everything gives an
  // exact 0.00 pp delta (it also tracks the published All-items imperceptibly).
  const selectedGroups = $derived(MAJOR_GROUPS.filter((g) => selected[g]));
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
    const yourRows = simRows.filter((r) => r.series === 'Your basket');
    const officialRows = simRows.filter((r) => r.series !== 'Your basket');
    return {
      height: 200,
      marginLeft: 38,
      x: { type: 'utc', label: null },
      y: { label: null, grid: true, tickFormat: (d: number) => d + '%' },
      marks: [
        Plot.ruleY([0], { stroke: c.border }),
        Plot.lineY(officialRows, { x: (d) => new Date(d.ref_date), y: 'value', stroke: c.muted, strokeWidth: 2, strokeDasharray: '3,3' }),
        Plot.lineY(yourRows, { x: (d) => new Date(d.ref_date), y: 'value', stroke: c.accent, strokeWidth: 2.6 }),
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

<div class="page-header">
  <p class="page-kicker">Basket</p>
  <h1>What's in the basket</h1>
  <p class="lead">
    Headline inflation is a weighted average of eight groups. See each group's
    <Explainer term="contribution" text={strings.glossary.contribution} />, then switch groups off to
    build your own basket and compare.
  </p>
</div>

<div class="toolbar">
  <SegmentedControl
    options={[{ label: 'Year-over-year', value: 'yoy' }, { label: 'Month-over-month', value: 'mom' }]}
    value={metric} onChange={(v) => (metric = v as 'yoy' | 'mom')} ariaLabel="Change type" />
  <SegmentedControl
    options={DATE_WINDOWS.map((w) => ({ label: w.label, value: String(w.years) }))}
    value={String(windowYears)} onChange={(v) => (windowYears = Number(v))} ariaLabel="Window" />
</div>

<div class="grid">
  <section class="card driving">
    <div class="section-head">
      <h2>Who's driving it <span class="hdate">· {latestDateStr ? formatMonth(latestDateStr) : ''}</span></h2>
      <p class="caption">Each group's contribution to the headline number, ranked.</p>
    </div>
    <ContributionBars items={latest} />
    <p class="caption note">Filled = pushing prices up · outline = pulling down.</p>
  </section>

  <section class="panel">
    <div class="section-head">
      <h2>Build your basket</h2>
      <p class="caption">Toggle groups off; the custom line re-weights to what's left.</p>
    </div>

    <div class="toggles">
      {#each MAJOR_GROUPS as g (g)}
        {@const on = selected[g]}
        <button
          class="tog"
          class:off={!on}
          role="switch"
          aria-checked={on}
          onclick={() => (selected = { ...selected, [g]: !selected[g] })}
        >
          <span class="switch" class:on></span>
          <i class={GROUP_ICONS[g as ProductGroup]}></i>
          <span class="tg">{shortGroup(g)}</span>
          <span class="tw tnum">{formatPctPlain(weightPct(g))}</span>
        </button>
      {/each}
    </div>

    <div class="deltarow">
      <div>
        <div class="eyebrow">Your basket vs official</div>
        <div class="caption dsub">{selectedWeight.toFixed(1)}% of the basket, re-normalized</div>
      </div>
      <div class="dval tnum" class:pos={delta > 0.005} class:neg={delta < -0.005}>
        {delta > 0 ? '+' : delta < 0 ? '−' : ''}{Math.abs(delta).toFixed(2)}<span class="pp"> pp</span>
      </div>
    </div>

    <Chart build={simSpec} height={200} revision={theme.revision} ariaLabel="Custom basket vs official CPI" />
    <div class="simlegend">
      <span><span class="sw solid"></span> Your basket</span>
      <span><span class="sw dash"></span> Official (all-items)</span>
    </div>
  </section>
</div>

<style>
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 436px; gap: 24px; align-items: start; }
  h2 { font-size: clamp(20px, 2.6vw, 24px); font-weight: 500; }
  .hdate { font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: 17px; color: var(--muted); }

  .driving { padding: 28px 30px; }
  .driving .note { color: var(--faint); margin-top: 20px; font-size: 13px; }

  /* ---- Build-your-basket panel ---- */
  .panel {
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    padding: 28px 26px;
  }
  .toggles { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 18px; }
  .tog {
    display: flex; align-items: center; gap: 12px; text-align: left;
    background: var(--surface); border: 1px solid var(--border-strong);
    border-radius: 9px; padding: 11px 14px; cursor: pointer; min-height: 44px;
  }
  .tog i { color: var(--accent); width: 16px; text-align: center; font-size: 13px; }
  .tog .tg { flex: 1; font-family: var(--font-sans); font-weight: 500; font-size: 14px; color: var(--ink); }
  .tog .tw { font-family: var(--font-mono); font-weight: 600; font-size: 13px; color: var(--muted); }
  .tog.off { background: color-mix(in srgb, var(--surface) 60%, transparent); opacity: 0.72; }
  .tog.off i { color: var(--faint); }
  .tog.off .tg { color: var(--muted); text-decoration: line-through; }
  .tog.off .tw { color: var(--faint); }

  .deltarow {
    display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
    padding-top: 16px; border-top: 1px solid var(--border-strong); margin-bottom: 8px;
  }
  .dsub { margin-top: 2px; font-size: 13px; }
  .dval { font-family: var(--font-sans); font-size: 40px; font-weight: 800; line-height: 1; letter-spacing: -0.02em; color: var(--ink); }
  .dval .pp { font-size: 0.48em; font-weight: 600; color: var(--muted); }
  .dval.pos { color: var(--accent); }
  .dval.neg { color: var(--series-4); }

  .simlegend { display: flex; gap: 18px; margin-top: 8px; font-size: 12px; color: var(--muted); }
  .simlegend span { display: flex; align-items: center; gap: 7px; }
  .simlegend .sw { width: 16px; height: 0; }
  .simlegend .sw.solid { border-top: 2.5px solid var(--accent); }
  .simlegend .sw.dash { border-top: 2px dashed var(--muted); }

  @media (max-width: 860px) {
    .grid { grid-template-columns: 1fr; }
    .driving { padding: 22px 20px; }
    .panel { padding: 22px 20px; }
  }
</style>
