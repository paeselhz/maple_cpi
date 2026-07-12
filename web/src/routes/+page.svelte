<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import Explainer from '$lib/components/Explainer.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { theme } from '$lib/theme.svelte';
  import { formatMonth, formatPct, formatPctPlain, direction } from '$lib/format';
  import { shortGroup } from '$lib/util';
  import { strings } from '$lib/strings';
  import { GROUP_ICONS, type ProductGroup } from '@maple-cpi/shared';
  import type { PageData } from './$types';

  let { data }: Props = $props();
  interface Props {
    data: PageData;
  }

  const yoy = $derived(data.latest?.yoy ?? null);
  const mom = $derived(data.latest?.mom ?? null);
  const dir = $derived(direction(yoy));
  const gloss = $derived(
    yoy == null
      ? ''
      : `Prices across Canada are ${dir.label === 'down' ? 'down' : 'up'} ${formatPctPlain(Math.abs(yoy))} over the past year — measured in ${formatMonth(data.latest!.ref_date)}.`,
  );
  const topThree = $derived(data.latestContribs.slice(0, 3));

  function sparkSpec(width: number): Plot.PlotOptions {
    const c = plotColors();
    return {
      height: 90,
      marginLeft: 30,
      marginTop: 8,
      x: { type: 'utc', ticks: 4, label: null },
      y: { ticks: 3, label: null, tickFormat: (d: number) => d + '%' },
      marks: [
        Plot.ruleY([0], { stroke: c.border }),
        Plot.areaY(data.spark, {
          x: (d) => new Date(d.ref_date),
          y: 'yoy',
          fill: c.accent,
          fillOpacity: 0.12,
        }),
        Plot.lineY(data.spark, { x: (d) => new Date(d.ref_date), y: 'yoy', stroke: c.accent, strokeWidth: 2 }),
        Plot.dot(data.spark.slice(-1), { x: (d) => new Date(d.ref_date), y: 'yoy', fill: c.accent, r: 3.5 }),
      ],
    };
  }

  function rateSpec(width: number): Plot.PlotOptions {
    const c = plotColors();
    const rows = data.rateSpark.filter((r) => r.overnight_target != null);
    return {
      height: 150,
      x: { type: 'utc', label: null },
      y: { label: '%', grid: true },
      marks: [
        Plot.lineY(rows, { x: (d) => new Date(d.ref_date), y: 'overnight_target', stroke: c.series[0], strokeWidth: 2, curve: 'step-after' }),
        Plot.tip(rows, Plot.pointerX({ x: (d) => new Date(d.ref_date), y: 'overnight_target', title: (d) => `${d.ref_date}\nPolicy rate: ${d.overnight_target}%` })),
      ],
    };
  }
</script>

<svelte:head>
  <title>Maple CPI — Canadian inflation right now</title>
  <meta name="description" content="Canada's Consumer Price Index at a glance: headline inflation, what's driving it, and the Bank of Canada's response." />
</svelte:head>

<section class="hero fade-in">
  <p class="eyebrow">Canadian inflation · {data.latestDate ? formatMonth(data.latestDate) : ''}</p>
  <div class="headline">
    <div>
      <div class="big tnum" class:up={dir.label === 'up'}>
        <span class="glyph" aria-hidden="true">{dir.glyph}</span>{formatPct(yoy)}
      </div>
      <p class="over"><Explainer term="year-over-year" text={strings.glossary.yoy} /></p>
    </div>
    <div class="spark card">
      <span class="muted tiny">Headline CPI, last 5 years</span>
      <Chart build={sparkSpec} height={90} revision={theme.revision} ariaLabel="Headline CPI year-over-year, last five years" />
    </div>
  </div>
  <p class="gloss">{gloss} Month over month, prices moved {formatPct(mom)}.</p>
</section>

<section class="drivers">
  <h2>What's driving it</h2>
  <p class="muted">Top contributors to the {formatPctPlain(yoy)} headline, by
    <Explainer term="contribution" text={strings.glossary.contribution} />.</p>
  <div class="chips">
    {#each topThree as c (c.product_group)}
      <div class="chip card">
        <span class="ci"><i class={GROUP_ICONS[c.product_group as ProductGroup]}></i></span>
        <div>
          <div class="cg">{shortGroup(c.product_group)}</div>
          <div class="cv tnum">{formatPct(c.contribution, 2)} <span class="muted tiny">of headline</span></div>
        </div>
      </div>
    {/each}
  </div>
  <a class="more" href="/basket">See the whole basket →</a>
</section>

<section class="rate">
  <div class="card">
    <div class="rhead">
      <div>
        <h2>The Bank of Canada's response</h2>
        <p class="muted tiny">Overnight policy rate</p>
      </div>
      {#if data.latestRate}
        <div class="rnow tnum">{formatPctPlain(data.latestRate.overnight_target)}</div>
      {/if}
    </div>
    <Chart build={rateSpec} height={150} revision={theme.revision} ariaLabel="Bank of Canada overnight policy rate" />
    <a class="more" href="/rates">Rates &amp; bond yields →</a>
  </div>
</section>

<style>
  .hero {
    margin: 10px 0 40px;
  }
  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    margin: 0 0 6px;
  }
  .headline {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: center;
  }
  .big {
    font-size: clamp(56px, 12vw, 110px);
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -0.03em;
    display: flex;
    align-items: baseline;
  }
  .big .glyph {
    font-size: 0.45em;
    color: var(--muted);
    margin-right: 6px;
  }
  .big.up .glyph {
    color: var(--accent);
  }
  .over {
    font-size: 18px;
    font-weight: 600;
    margin: 4px 0 0;
  }
  .spark {
    padding: 14px 16px;
  }
  .tiny {
    font-size: 12px;
  }
  .gloss {
    font-size: 20px;
    max-width: 60ch;
    margin: 22px 0 0;
    line-height: 1.4;
  }
  .drivers {
    margin: 40px 0;
  }
  .drivers h2,
  .rate h2 {
    margin: 0 0 4px;
    font-size: 22px;
  }
  .chips {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin: 16px 0;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }
  .ci {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--accent-soft);
    color: var(--accent);
    display: grid;
    place-items: center;
    font-size: 17px;
    flex: none;
  }
  .cg {
    font-weight: 700;
    font-size: 15px;
  }
  .cv {
    font-size: 15px;
    font-weight: 600;
  }
  .more {
    font-weight: 600;
    font-size: 14px;
  }
  .rhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  .rnow {
    font-size: 32px;
    font-weight: 800;
    color: var(--accent);
  }
  @media (max-width: 700px) {
    .headline {
      grid-template-columns: 1fr;
    }
    .chips {
      grid-template-columns: 1fr;
    }
    .gloss {
      font-size: 18px;
    }
  }
</style>
