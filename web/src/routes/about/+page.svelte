<script lang="ts">
  import { strings } from '$lib/strings';

  // A quiet index of the words that appear everywhere else (5d).
  type Def = { term: string; abbr?: string; text: string };
  const defs: Def[] = [
    { term: 'Consumer Price Index', text: strings.glossary.cpi },
    { term: 'Contribution', text: strings.glossary.contribution },
    { term: 'Year-over-year', abbr: 'YoY', text: strings.glossary.yoy },
    { term: 'Basket weight', text: strings.glossary.basketWeight },
    { term: 'Month-over-month', abbr: 'MoM', text: strings.glossary.mom },
    { term: 'Policy rate', text: strings.glossary.policyRate },
  ];
</script>

<svelte:head><title>About — Maple CPI</title></svelte:head>

<div class="page-header">
  <p class="page-kicker">About</p>
  <h1>About Maple CPI</h1>
  <p class="lead">
    Maple CPI makes Canada's official inflation data legible in about three seconds — and still
    useful if you want to dig. It's a public, read-only dashboard: no accounts, no forecasts, no
    advice. Just the numbers Statistics Canada and the Bank of Canada publish, presented clearly.
  </p>
</div>

<section class="defs">
  <div class="section-head-row">
    <h2>Definitions</h2>
    <span class="caption">the words that show up everywhere else</span>
  </div>
  <div class="deflist">
    {#each defs as d (d.term)}
      <div class="def">
        <span class="term">{d.term}{#if d.abbr}<span class="abbr">{d.abbr}</span>{/if}</span>
        <span class="dtext">{d.text}</span>
      </div>
    {/each}
  </div>
</section>

<section class="band">
  <div class="col">
    <div class="eyebrow">Sources</div>
    <div class="srclist">
      <div class="src">
        <span class="who">Statistics Canada</span>
        <span class="what">
          CPI series &amp; basket weights —
          <a href={strings.sources.cpi.url} target="_blank" rel="noopener">{strings.sources.cpi.label}</a>,
          <a href={strings.sources.weights.url} target="_blank" rel="noopener">{strings.sources.weights.label}</a>.
        </span>
      </div>
      <div class="src">
        <span class="who">Bank of Canada</span>
        <span class="what">
          Policy rate, bank rate &amp; benchmark bond yields —
          <a href={strings.sources.rates.url} target="_blank" rel="noopener">{strings.sources.rates.label}</a>,
          <a href={strings.sources.bonds.url} target="_blank" rel="noopener">{strings.sources.bonds.label}</a>.
        </span>
      </div>
    </div>
  </div>
  <div class="col">
    <div class="eyebrow">Notes</div>
    <p class="ntext">
      Year-over-year is <code>value ÷ value 12 months ago − 1</code>; a group's contribution weights
      its price change by its share of the basket, using the weight vintage in effect that month. The
      custom basket re-normalizes the selected groups' weights to 100% before averaging. These
      calculations are unit-tested.
    </p>
    <p class="ntext">
      Direction is shown by glyph, label and sign — never by a good/bad colour. Data refreshes each
      month after Statistics Canada's CPI release; coverage is Canada and the 10 provinces,
      2001–present. Not investment advice.
    </p>
  </div>
</section>

<style>
  .page-header {
    margin-bottom: 34px;
  }
  .lead {
    max-width: 66ch;
  }

  /* ---- Definitions: a quiet two-column index ---- */
  .defs {
    margin-bottom: 44px;
  }
  .section-head-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }
  .section-head-row h2 {
    font-size: clamp(20px, 3vw, 24px);
    font-weight: 500;
    margin: 0;
  }
  .deflist {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 56px;
  }
  .def {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 22px;
    align-items: baseline;
    padding: 18px 0;
    border-top: 1px solid var(--border-strong);
  }
  .term {
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 15px;
    color: var(--ink);
  }
  .abbr {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 11px;
    color: var(--faint);
    margin-left: 7px;
    letter-spacing: 0.04em;
  }
  .dtext {
    font-family: var(--font-serif);
    font-size: 15px;
    line-height: 1.55;
    color: var(--maroon);
  }
  :root:not([data-theme='dark']) .dtext,
  :root:not([data-theme='dark']) .ntext {
    color: #4a423d;
  }

  /* ---- Sources / notes band ---- */
  .band {
    display: flex;
    flex-wrap: wrap;
    gap: 56px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px 34px;
  }
  .col {
    flex: 1;
    min-width: 260px;
  }
  .col .eyebrow {
    display: block;
    margin-bottom: 16px;
  }
  .srclist {
    display: grid;
    gap: 16px;
  }
  .src {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 14px;
    align-items: baseline;
  }
  .who {
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 15px;
    color: var(--ink);
  }
  .what {
    font-family: var(--font-serif);
    font-size: 14.5px;
    line-height: 1.55;
    color: var(--muted);
  }
  .ntext {
    font-family: var(--font-serif);
    font-size: 15px;
    line-height: 1.6;
    color: var(--maroon);
    margin: 0 0 14px;
    max-width: 60ch;
  }
  .ntext:last-child {
    margin-bottom: 0;
  }
  code {
    font-family: var(--font-mono);
    background: var(--surface);
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 0.82em;
  }

  @media (max-width: 760px) {
    .deflist {
      grid-template-columns: 1fr;
      column-gap: 0;
    }
    .def {
      grid-template-columns: 150px 1fr;
      gap: 16px;
    }
    .band {
      padding: 26px 22px;
      gap: 32px;
    }
    .src {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
  @media (max-width: 480px) {
    .def {
      grid-template-columns: 1fr;
      gap: 4px;
      padding: 14px 0;
    }
  }
</style>
