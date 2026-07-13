<script lang="ts">
  /** Inline contextual "what's this?" — replaces the old modal FAQ (DESIGN §5). */
  interface Props {
    term: string;
    text: string;
  }
  let { term, text }: Props = $props();
  let open = $state(false);
</script>

<span class="ex">
  <button
    class="trigger"
    aria-expanded={open}
    aria-label="What is {term}?"
    onclick={() => (open = !open)}
  >{term}<sup>?</sup></button>
  {#if open}
    <span class="pop" role="tooltip">{text}</span>
  {/if}
</span>

<style>
  .ex {
    position: relative;
    display: inline-block;
  }
  .trigger {
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: help;
    padding: 0;
    border-bottom: 1px dotted var(--muted);
  }
  .trigger sup {
    color: var(--accent);
    font-weight: 700;
    margin-left: 1px;
  }
  .pop {
    position: absolute;
    z-index: 20;
    left: 0;
    top: 120%;
    width: min(280px, 78vw);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow);
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--ink);
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
  }
</style>
