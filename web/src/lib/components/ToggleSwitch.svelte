<script lang="ts">
  /** A labelled on/off switch — the pill toggle used across the app. */
  interface Props {
    checked: boolean;
    onChange: (v: boolean) => void;
    label?: string;
  }
  let { checked, onChange, label }: Props = $props();
</script>

<button class="tsw" role="switch" aria-checked={checked} onclick={() => onChange(!checked)}>
  <span class="switch" class:on={checked}></span>
  {#if label}<span class="lbl">{label}</span>{/if}
</button>

<style>
  .tsw {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 13.5px;
    font-weight: 500;
  }
</style>
