<script lang="ts">
  import { strings } from '$lib/strings';
  const defs = [
    ['Consumer Price Index (CPI)', strings.glossary.cpi],
    ['Year-over-year (YoY)', strings.glossary.yoy],
    ['Month-over-month (MoM)', strings.glossary.mom],
    ['Contribution', strings.glossary.contribution],
    ['Basket weight', strings.glossary.basketWeight],
    ['Trend line', strings.glossary.ema],
  ] as const;
</script>

<svelte:head><title>About — Maple CPI</title></svelte:head>

<h1>About Maple CPI</h1>
<p class="lead">
  Maple CPI makes Canada's official inflation data legible in about three seconds — and still
  useful if you want to dig. It's a public, read-only dashboard: no accounts, no forecasts, no
  advice. Just the numbers Statistics Canada and the Bank of Canada publish, presented clearly.
</p>

<section class="card">
  <h2>Definitions</h2>
  <dl>
    {#each defs as [term, text] (term)}
      <dt>{term}</dt>
      <dd class="muted">{text}</dd>
    {/each}
  </dl>
</section>

<section class="card">
  <h2>Data sources</h2>
  <ul class="sources">
    <li><a href={strings.sources.cpi.url} target="_blank" rel="noopener">{strings.sources.cpi.label}</a> — CPI, monthly, not seasonally adjusted (index level, 2002=100).</li>
    <li><a href={strings.sources.weights.url} target="_blank" rel="noopener">{strings.sources.weights.label}</a> — CPI basket weights (time-windowed vintages).</li>
    <li><a href={strings.sources.rates.url} target="_blank" rel="noopener">{strings.sources.rates.label}</a> — Bank of Canada policy / bank / overnight money-market rates.</li>
    <li><a href={strings.sources.bonds.url} target="_blank" rel="noopener">{strings.sources.bonds.label}</a> — Government of Canada benchmark bond yields (2/5/10-year).</li>
  </ul>
  <p class="muted tiny">Data refreshes automatically each month after Statistics Canada's CPI release. Coverage: Canada and the 10 provinces, 2001–present.</p>
</section>

<section class="card">
  <h2>Method notes</h2>
  <p class="muted">
    Year-over-year is <code>value ÷ value 12 months ago − 1</code>; month-over-month uses the prior
    month. A group's contribution weights its price change by its share of the basket, using the
    weight vintage in effect for that month. The custom basket re-normalizes the selected groups'
    weights to sum to 100% before averaging their changes. These calculations are unit-tested.
  </p>
  <p class="muted tiny">Not investment advice. Maple CPI visualizes published data and does not forecast.</p>
</section>

<style>
  h1 { margin: 0 0 8px; }
  .lead { font-size: 19px; max-width: 68ch; line-height: 1.5; margin: 0 0 22px; }
  section.card { margin-bottom: 16px; }
  h2 { font-size: 18px; margin: 0 0 12px; }
  dl { margin: 0; display: grid; gap: 12px; }
  dt { font-weight: 700; }
  dd { margin: 2px 0 0; max-width: 74ch; }
  .sources { margin: 0 0 10px; padding-left: 18px; display: grid; gap: 8px; }
  .tiny { font-size: 12px; }
  code { background: var(--surface-2); padding: 1px 6px; border-radius: 5px; font-size: 0.9em; }
</style>
