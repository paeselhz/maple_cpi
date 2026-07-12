<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import Chart from '$lib/plot/Chart.svelte';
  import Explainer from '$lib/components/Explainer.svelte';
  import ContributionBars from '$lib/components/ContributionBars.svelte';
  import { plotColors } from '$lib/plot/theme';
  import { theme } from '$lib/theme.svelte';
  import { formatMonth, formatPctPlain, direction } from '$lib/format';
  import { strings } from '$lib/strings';
  import type { PageData } from './$types';

  let { data }: Props = $props();
  interface Props {
    data: PageData;
  }

  const latest = $derived(data.latest);
  const yoy = $derived(latest?.yoy ?? null);
  const mom = $derived(latest?.mom ?? null);
  const dir = $derived(direction(yoy));

  // Integer + fractional split so the big number can render "2" large and ".1%" smaller.
  const bigNum = $derived(yoy == null ? '–' : Math.abs(yoy).toFixed(1));

  // Acceleration vs. deceleration — the pill's meaning (NOT good/bad). Compare with a year ago.
  const yoyYearAgo = $derived(data.spark.length >= 13 ? (data.spark.at(-13)?.yoy ?? null) : null);
  const easing = $derived(yoy != null && yoyYearAgo != null ? yoy < yoyYearAgo : null);

  const headline = $derived.by(() => {
    if (yoy == null) return 'Canadian inflation, at a glance.';
    const upDown = dir.label === 'down' ? 'down' : 'up';
    if (easing == null) return `Prices are ${upDown} over the last year.`;
    return easing
      ? `Prices are ${upDown} over the last year — but the pace is cooling.`
      : `Prices are ${upDown} over the last year — and the pace is quickening.`;
  });

  const gloss = $derived.by(() => {
    if (yoy == null) return '';
    const target = 2;
    const vsTarget =
      yoy <= target + 0.3
        ? "back within sight of the Bank of Canada's 2% target"
        : `still above the Bank of Canada's ${target}% target`;
    if (yoyYearAgo == null) return `Measured in ${formatMonth(latest!.ref_date)} — ${vsTarget}.`;
    const move = yoy < yoyYearAgo ? 'down' : 'up';
    return `That's ${move} from ${formatPctPlain(yoyYearAgo)} a year ago — ${vsTarget}.`;
  });

  // Ranked "who's driving it" — top contributors by magnitude.
  const drivers = $derived(data.latestContribs.slice(0, 5));

  function rateSpec(width: number): Plot.PlotOptions {
    const c = plotColors();
    const rows = data.rateSpark.filter((r) => r.overnight_target != null);
    return {
      height: 150,
      marginLeft: 40,
      x: { type: 'utc', label: null },
      y: { label: '%', grid: true },
      marks: [
        Plot.lineY(rows, {
          x: (d) => new Date(d.ref_date),
          y: 'overnight_target',
          stroke: c.series[1],
          strokeWidth: 2.5,
          curve: 'step-after',
        }),
        Plot.dot(rows.slice(-1), { x: (d) => new Date(d.ref_date), y: 'overnight_target', fill: c.accent, r: 4 }),
        Plot.tip(
          rows,
          Plot.pointerX({
            x: (d) => new Date(d.ref_date),
            y: 'overnight_target',
            title: (d) => `${d.ref_date}\nPolicy rate: ${d.overnight_target}%`,
          }),
        ),
      ],
    };
  }
</script>

<svelte:head>
  <title>Maple CPI — Canadian inflation right now</title>
  <meta
    name="description"
    content="Canada's Consumer Price Index at a glance: headline inflation, what's driving it, and the Bank of Canada's response."
  />
</svelte:head>

<section class="hero fade-in">
  <h1 class="lede">{headline}</h1>
  <div class="figure">
    <div class="big tnum" aria-label="{formatPctPlain(yoy)} year over year">
      {bigNum}<span class="pct">%</span>
    </div>
    <div class="tag">
      {#if easing != null}
        <span class="pill" class:easing class:accelerating={!easing}>
          <span aria-hidden="true">{easing ? '▼' : '▲'}</span>
          {easing ? 'easing' : 'accelerating'}
        </span>
      {/if}
      <span class="eyebrow">All-items YoY · {latest ? formatMonth(latest.ref_date) : ''}</span>
    </div>
  </div>
  <p class="gloss">
    {gloss}
    <Explainer term="What is CPI?" text={strings.glossary.cpi} />
  </p>
  {#if mom != null}
    <p class="mom muted">Month over month, prices moved {formatPctPlain(mom)}.</p>
  {/if}
</section>

<section class="drivers">
  <h2>Here's who's driving it</h2>
  <p class="caption">Each group's contribution to the {formatPctPlain(yoy)} headline, ranked.</p>
  <div class="barswrap">
    <ContributionBars items={drivers} />
  </div>
  <p class="caption note">Filled = pushing prices up · outline = pulling down.</p>
  <a class="more" href="/basket">See the whole basket →</a>
</section>

<section class="rate">
  <div class="rhead">
    <div class="rlead">
      <h2>What the Bank is doing</h2>
      <p class="caption">
        Overnight <Explainer term="policy rate" text={strings.glossary.policyRate} />.
      </p>
      {#if data.latestRate}
        <div class="rnow tnum">
          {formatPctPlain(data.latestRate.overnight_target).replace('%', '')}<span class="pct">%</span>
        </div>
      {/if}
    </div>
    <div class="rchart">
      <Chart
        build={rateSpec}
        height={150}
        revision={theme.revision}
        ariaLabel="Bank of Canada overnight policy rate"
      />
    </div>
  </div>
  <a class="more" href="/rates">Rates &amp; bond yields →</a>
</section>

<style>
  /* ---- Hero ---- */
  .hero {
    margin: 18px 0 44px;
    max-width: 760px;
  }
  .lede {
    font-size: clamp(24px, 4.2vw, 34px);
    font-weight: 500;
    line-height: 1.25;
    margin: 0 0 26px;
    max-width: 20ch;
  }
  .figure {
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
  }
  .big {
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: clamp(72px, 15vw, 128px);
    line-height: 0.9;
    letter-spacing: -0.04em;
    color: var(--ink);
  }
  .big .pct {
    font-size: 0.5em;
    font-weight: 800;
  }
  .tag {
    display: flex;
    flex-direction: column;
    gap: 7px;
    align-items: flex-start;
  }
  .gloss {
    font-family: var(--font-serif);
    font-size: clamp(17px, 2.4vw, 19px);
    line-height: 1.6;
    color: var(--maroon);
    margin: 22px 0 0;
    max-width: 62ch;
  }
  :root:not([data-theme='dark']) .gloss {
    color: #4a423d;
  }
  .mom {
    font-size: 14px;
    margin: 10px 0 0;
  }

  /* ---- Section shared ---- */
  h2 {
    font-size: clamp(20px, 3vw, 24px);
    font-weight: 500;
    margin: 0 0 4px;
  }
  .caption {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 15px;
    color: var(--muted);
    margin: 0 0 22px;
  }
  .caption.note {
    color: var(--faint);
    margin: 16px 0 0;
    font-size: 13px;
  }
  .more {
    display: inline-block;
    font-weight: 600;
    font-size: 14px;
    margin-top: 18px;
  }

  /* ---- Drivers (ranked contribution bars) ---- */
  .drivers {
    margin: 44px 0;
    padding-top: 34px;
    border-top: 1px solid var(--border);
  }
  .barswrap {
    max-width: 760px;
  }

  /* ---- Rate ---- */
  .rate {
    margin: 44px 0 0;
    padding-top: 34px;
    border-top: 1px solid var(--border);
  }
  .rhead {
    display: flex;
    gap: 44px;
    align-items: flex-start;
  }
  .rlead {
    flex: none;
    width: 250px;
  }
  .rchart {
    flex: 1;
    min-width: 0;
  }
  .rnow {
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 52px;
    line-height: 1;
    margin-top: 14px;
    color: var(--ink);
  }
  .rnow .pct {
    font-size: 0.5em;
  }

  @media (max-width: 700px) {
    .rhead {
      flex-direction: column;
      gap: 20px;
    }
    .rlead {
      width: 100%;
    }
  }
</style>
