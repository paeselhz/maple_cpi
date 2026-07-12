<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import SegmentedControl from '$lib/components/SegmentedControl.svelte';
  import GeoMap from '$lib/components/GeoMap.svelte';
  import Explainer from '$lib/components/Explainer.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { theme } from '$lib/theme.svelte';
  import { formatMonthShort, formatPctPlain } from '$lib/format';
  import { shortGroup, windowStart } from '$lib/util';
  import { strings, DATE_WINDOWS } from '$lib/strings';
  import { downloadCsv, downloadPng } from '$lib/export';
  import type { MomYoyPoint } from '@maple-cpi/shared';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let geo = $state('Canada');
  let group = $state('All-items');
  let metric = $state<'yoy' | 'mom'>('yoy');
  let windowYears = $state(2);
  let ema = $state(false);
  let compare = $state(true);

  // series cache: keyed geo|group|ema → points (seeded from the load's initial series)
  let seriesByGeo = $state<Record<string, MomYoyPoint[]>>(
    { 'Canada|All-items|0': data.initialSeries },
  );
  let loading = $state(false);
  let chartEl: HTMLDivElement | undefined = $state();

  const emaWin = $derived(ema ? 6 : 0);
  const geosNeeded = $derived(geo === 'Canada' || !compare ? [geo] : [geo, 'Canada']);

  async function ensure(geos: string[], grp: string, e: number) {
    const missing = geos.filter((g) => !seriesByGeo[`${g}|${grp}|${e}`]);
    if (!missing.length) return;
    loading = true;
    const params = new URLSearchParams({ group: grp });
    missing.forEach((g) => params.append('geo', g));
    if (e) params.set('ema', String(e));
    const res = await fetch(`/api/cpi?${params}`);
    const json = (await res.json()) as { series: { geo: string; points: MomYoyPoint[] }[] };
    const next = { ...seriesByGeo };
    for (const s of json.series) next[`${s.geo}|${grp}|${e}`] = s.points;
    seriesByGeo = next;
    loading = false;
  }

  $effect(() => {
    ensure(geosNeeded, group, emaWin);
  });

  const from = $derived(windowStart(data.avail.maxDate, windowYears));

  interface Row {
    ref_date: string;
    value: number;
    series: string;
    [key: string]: string | number;
  }
  const plotRows = $derived.by(() => {
    const rows: Row[] = [];
    for (const g of geosNeeded) {
      const pts = seriesByGeo[`${g}|${group}|${emaWin}`] ?? [];
      for (const p of pts) {
        if (from && p.ref_date < from) continue;
        const v = metric === 'yoy' ? p.yoy : p.mom;
        if (v != null) rows.push({ ref_date: p.ref_date, value: v, series: g });
        if (ema && metric === 'yoy' && p.ema != null)
          rows.push({ ref_date: p.ref_date, value: p.ema, series: `${g} (trend)` });
      }
    }
    return rows;
  });

  function spec(width: number): Plot.PlotOptions {
    const c = plotColors();
    const seriesNames = [...new Set(plotRows.map((r) => r.series))];
    return {
      height: 380,
      x: { type: 'utc', label: null },
      y: { label: `${metric.toUpperCase()} %`, grid: true, tickFormat: (d: number) => d + '%' },
      color: { domain: seriesNames, range: c.series, legend: seriesNames.length > 1 },
      marks: [
        Plot.ruleY([0], { stroke: c.border }),
        Plot.lineY(
          plotRows.filter((r) => !r.series.includes('trend')),
          { x: (d) => new Date(d.ref_date), y: 'value', stroke: 'series', strokeWidth: 2.2 },
        ),
        Plot.lineY(
          plotRows.filter((r) => r.series.includes('trend')),
          { x: (d) => new Date(d.ref_date), y: 'value', stroke: 'series', strokeWidth: 1.5, strokeDasharray: '3,3' },
        ),
        Plot.tip(
          plotRows,
          Plot.pointerX({
            x: (d) => new Date(d.ref_date),
            y: 'value',
            title: (d: Row) => `${d.series}\n${formatMonthShort(d.ref_date)}: ${d.value.toFixed(2)}%`,
          }),
        ),
      ],
    };
  }

  const geoOptions = $derived(data.avail.geos.filter((g) => g !== 'Canada'));

  function exportCsv() {
    downloadCsv(`maple-cpi-${geo}-${group}-${metric}.csv`, plotRows);
  }
</script>

<svelte:head><title>Explore — Maple CPI</title></svelte:head>

<h1>Explore the numbers</h1>
<p class="muted sub">
  <Explainer term={metric === 'yoy' ? 'Year-over-year' : 'Month-over-month'} text={metric === 'yoy' ? strings.glossary.yoy : strings.glossary.mom} />
  change for any group, nationally or by province.
</p>

<div class="controls card">
  <label>Group
    <select bind:value={group}>
      {#each data.avail.groups as g (g)}<option value={g}>{shortGroup(g)}</option>{/each}
    </select>
  </label>
  <div class="ctl">
    <span class="clab">Change</span>
    <SegmentedControl
      options={[{ label: 'Year-over-year', value: 'yoy' }, { label: 'Month-over-month', value: 'mom' }]}
      value={metric}
      onChange={(v) => (metric = v as 'yoy' | 'mom')}
      ariaLabel="Change type"
    />
  </div>
  <div class="ctl">
    <span class="clab">Window</span>
    <SegmentedControl
      options={DATE_WINDOWS.map((w) => ({ label: w.label, value: String(w.years) }))}
      value={String(windowYears)}
      onChange={(v) => (windowYears = Number(v))}
      ariaLabel="Date window"
    />
  </div>
  <label class="check"><input type="checkbox" bind:checked={ema} /> 3-month trend line</label>
  {#if geo !== 'Canada'}
    <label class="check"><input type="checkbox" bind:checked={compare} /> Compare to Canada</label>
  {/if}
</div>

<div class="grid">
  <div class="mapcol card">
    <div class="maphd">
      <strong>Geography</strong>
      <button class="natl" class:active={geo === 'Canada'} onclick={() => (geo = 'Canada')}>🍁 Canada</button>
    </div>
    <GeoMap values={data.mapValues} selected={geo} onSelect={(g) => (geo = g)} width={300} />
    <select class="geolist" bind:value={geo} aria-label="Select geography">
      <option value="Canada">Canada (national)</option>
      {#each geoOptions as g (g)}<option value={g}>{g} · {formatPctPlain(data.mapValues[g])}</option>{/each}
    </select>
  </div>

  <div class="chartcol card">
    <div class="charthd">
      <div>
        <strong>{shortGroup(group)}</strong>
        <span class="muted"> · {geo}{geo !== 'Canada' && compare ? ' vs Canada' : ''}</span>
      </div>
      <div class="exports">
        {#if loading}<span class="muted tiny">loading…</span>{/if}
        <button onclick={exportCsv}>CSV</button>
        <button onclick={() => chartEl && downloadPng(chartEl, `maple-cpi-${geo}-${group}.png`)}>PNG</button>
      </div>
    </div>
    <div bind:this={chartEl}>
      <Chart build={spec} height={380} revision={theme.revision} ariaLabel="{metric} time series for {group}" />
    </div>
  </div>
</div>

<style>
  h1 {
    margin: 0 0 2px;
  }
  .sub {
    margin: 0 0 18px;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    margin-bottom: 16px;
  }
  .ctl {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .clab {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  select {
    font: inherit;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink);
    min-height: 38px;
  }
  .check {
    flex-direction: row;
    align-items: center;
    gap: 7px;
    color: var(--ink);
  }
  .grid {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 16px;
    align-items: start;
  }
  .maphd,
  .charthd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .natl {
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--ink);
    border-radius: 999px;
    padding: 5px 12px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
  }
  .natl.active {
    border-color: var(--accent);
    color: var(--accent);
  }
  .geolist {
    width: 100%;
    margin-top: 10px;
  }
  .exports {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .exports button {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink);
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .tiny {
    font-size: 12px;
  }
  @media (max-width: 800px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
