<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import SegmentedControl from '$lib/components/SegmentedControl.svelte';
  import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';
  import Explainer from '$lib/components/Explainer.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { crosshairMarks } from '$lib/plot/crosshair';
  import { theme } from '$lib/theme.svelte';
  import { formatMonth, formatMonthShort, formatPctPlain } from '$lib/format';
  import { shortGroup, windowStart } from '$lib/util';
  import { strings, DATE_WINDOWS } from '$lib/strings';
  import { downloadCsv, downloadPng } from '$lib/export';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import { initParams, syncQuery, boolParam, numParam } from '$lib/urlState';
  import { untrack } from 'svelte';
  import type { MomYoyPoint } from '@maple-cpi/shared';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Seed selections from the URL so a shared link opens on the same view.
  // geo/group drive an API fetch, so only accept values we actually offer.
  const p = initParams();
  const geoParam = p.get('geo');
  const groupParam = p.get('group');
  let geo = $state(untrack(() => (geoParam && data.avail.geos.includes(geoParam) ? geoParam : 'Canada')));
  let group = $state(
    untrack(() => (groupParam && data.avail.groups.includes(groupParam) ? groupParam : 'All-items')),
  );
  let metric = $state<'yoy' | 'mom'>(p.get('metric') === 'mom' ? 'mom' : 'yoy');
  let windowYears = $state(numParam(p, 'win', 2));
  let ema = $state(boolParam(p, 'ema', false));
  let compare = $state(boolParam(p, 'cmp', true));

  // Keep the URL in step with the selections (defaults are omitted → tidy links).
  $effect(() => {
    syncQuery({
      geo: { value: geo, default: 'Canada' },
      group: { value: group, default: 'All-items' },
      metric: { value: metric, default: 'yoy' },
      win: { value: windowYears, default: 2 },
      ema: { value: ema, default: false },
      cmp: { value: compare, default: true },
    });
  });

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
      height: 360,
      x: { type: 'utc', label: null },
      y: { label: null, grid: true, tickFormat: (d: number) => d + '%' },
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
        ...crosshairMarks(plotRows, { header: formatMonthShort }),
      ],
    };
  }

  // Region list (5a: a tidy ranked list, not the map). All-items YoY per geo,
  // Canada pinned on top, provinces ranked hottest-first.
  const regions = $derived.by(() => {
    const provinces = data.avail.geos
      .filter((g) => g !== 'Canada')
      .map((g) => ({ geo: g, yoy: data.mapValues[g] ?? null }))
      .sort((a, b) => (b.yoy ?? -99) - (a.yoy ?? -99));
    return [{ geo: 'Canada', yoy: data.mapValues['Canada'] ?? initialLatest() }, ...provinces];
  });
  function initialLatest(): number | null {
    return data.initialSeries.at(-1)?.yoy ?? null;
  }

  const windowLabel = $derived(DATE_WINDOWS.find((w) => w.years === windowYears)?.label ?? '');

  // Data-driven one-line insight for the chart (honest, not a canned trend claim).
  const mainPts = $derived(seriesByGeo[`${geo}|${group}|${emaWin}`] ?? []);
  const val = (p: MomYoyPoint) => (metric === 'yoy' ? p.yoy : p.mom);
  const inWinPts = $derived(mainPts.filter((p) => (!from || p.ref_date >= from) && val(p) != null));
  const insight = $derived.by(() => {
    const last = inWinPts.at(-1);
    const first = inWinPts[0];
    if (!last || !first) return '';
    const lv = val(last)!;
    const fv = val(first)!;
    const diff = lv - fv;
    const dirw = Math.abs(diff) < 0.1 ? 'about the same as' : diff < 0 ? 'down from' : 'up from';
    const anchor = windowLabel === 'All' ? 'at the start of the record' : `at the start of this ${windowLabel} window`;
    return `Now at ${formatPctPlain(lv)}, ${dirw} ${formatPctPlain(fv)} ${anchor}.`;
  });
  const nowPt = $derived(inWinPts.at(-1));

  function exportCsv() {
    downloadCsv(`maple-cpi-${geo}-${group}-${metric}.csv`, plotRows);
  }

  function exportPng() {
    if (!chartEl) return;
    const c = plotColors();
    const names = [...new Set(plotRows.map((r) => r.series))];
    const legend = names.map((n, i) => ({
      label: n,
      color: c.series[i % c.series.length],
      dash: n.includes('trend'),
    }));
    downloadPng(chartEl, `maple-cpi-${geo}-${group}-${metric}.png`, {
      title: shortGroup(group),
      subtitle: `${geo}${geo !== 'Canada' && compare ? ' vs Canada' : ''} · ${metric === 'yoy' ? 'year-over-year' : 'month-over-month'}`,
      caption: insight,
      legend,
      axisLabel: `↑ ${metric.toUpperCase()} %`,
      note: nowPt ? `now: ${formatPctPlain(val(nowPt))} (${formatMonth(nowPt.ref_date)})` : undefined,
      source: 'Maple CPI · Source: Statistics Canada',
    });
  }
</script>

<svelte:head><title>Time series — Maple CPI</title></svelte:head>

<div class="page-header">
  <p class="page-kicker">Time series</p>
  <h1>Explore the numbers</h1>
  <p class="lead">
    <Explainer term={metric === 'yoy' ? 'Year-over-year' : 'Month-over-month'} text={metric === 'yoy' ? strings.glossary.yoy : strings.glossary.mom} />
    change for any group, nationally or by province.
  </p>
</div>

<div class="controls">
  <label class="ctl">
    <span class="clab">Group</span>
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
</div>

<div class="grid">
  <div class="regioncol">
    <div class="clab">Region</div>
    <div class="regions">
      {#each regions as r (r.geo)}
        <button class="region" class:active={geo === r.geo} onclick={() => (geo = r.geo)}>
          <span class="rname">{r.geo === 'Canada' ? '🍁 Canada' : r.geo}</span>
          <span class="ryoy tnum">{formatPctPlain(r.yoy)}</span>
        </button>
      {/each}
    </div>
    {#if geo !== 'Canada'}
      <div class="compare">
        <ToggleSwitch checked={compare} onChange={(v) => (compare = v)} label="Compare to Canada" />
      </div>
    {/if}
  </div>

  <div class="chartcard">
    <div class="charthd">
      <h2 class="ctitle">
        {shortGroup(group)}<span class="sub"> · {geo}{geo !== 'Canada' && compare ? ' vs Canada' : ''} · {metric === 'yoy' ? 'year-over-year' : 'month-over-month'}</span>
      </h2>
      <div class="exports">
        {#if loading}<span class="caption load">loading…</span>{/if}
        <button onclick={exportCsv}>CSV</button>
        <button onclick={exportPng}>PNG</button>
        <ShareButton />
      </div>
    </div>
    {#if insight}<p class="insight">{insight}</p>{/if}
    <div bind:this={chartEl}>
      <Chart build={spec} height={360} revision={theme.revision} ariaLabel="{metric} time series for {group}" />
    </div>
    <div class="chartfoot">
      <span class="mono axislabel">↑ {metric.toUpperCase()} %</span>
      {#if nowPt}<span class="mono now">● now: {formatPctPlain(val(nowPt))} ({formatMonth(nowPt.ref_date)})</span>{/if}
    </div>
  </div>
</div>

<style>
  /* ---- Controls on paper (not boxed) ---- */
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 30px;
    margin-bottom: 26px;
  }
  .ctl {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .clab {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--faint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  select {
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    padding: 9px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--ink);
    min-height: 40px;
    min-width: 210px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 13.5px;
    font-weight: 500;
    padding-bottom: 9px;
    cursor: pointer;
  }

  /* ---- Region list + chart ---- */
  .grid {
    display: grid;
    grid-template-columns: 210px 1fr;
    gap: 24px;
    align-items: start;
  }
  .regioncol .clab {
    margin-bottom: 10px;
  }
  .regions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 420px;
    overflow-y: auto;
  }
  .region {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px 13px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--ink);
    border-radius: 8px;
    font-family: var(--font-sans);
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
  }
  .region .ryoy {
    color: var(--muted);
    font-weight: 600;
  }
  .region:hover {
    border-color: var(--faint);
  }
  .region.active {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
    font-weight: 600;
  }
  .region.active .ryoy {
    color: var(--paper);
  }
  .compare {
    margin-top: 14px;
  }

  .chartcard {
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 24px 26px 20px;
  }
  .charthd {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .ctitle {
    font-size: 22px;
    font-weight: 500;
    margin: 0;
  }
  .ctitle .sub {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: 15px;
    color: var(--muted);
  }
  .insight {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 14.5px;
    line-height: 1.5;
    color: var(--muted);
    margin: 6px 0 16px;
    max-width: 62ch;
  }
  .exports {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
  .exports button {
    border: 1px solid var(--border-strong);
    background: var(--surface-2);
    color: var(--muted);
    border-radius: 7px;
    padding: 6px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .exports button:hover {
    color: var(--ink);
  }
  .load {
    font-size: 12px;
  }
  .chartfoot {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--muted);
  }
  .chartfoot .now {
    color: var(--accent);
  }
  @media (max-width: 800px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .regions {
      max-height: none;
    }
  }
</style>
