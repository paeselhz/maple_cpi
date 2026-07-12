<script lang="ts">
  interface Option {
    label: string;
    value: string;
  }
  interface Props {
    options: Option[];
    value: string;
    onChange: (v: string) => void;
    ariaLabel?: string;
  }
  let { options, value, onChange, ariaLabel = 'options' }: Props = $props();
</script>

<div class="seg" role="tablist" aria-label={ariaLabel}>
  {#each options as opt (opt.value)}
    <button
      role="tab"
      aria-selected={value === opt.value}
      class:active={value === opt.value}
      onclick={() => onChange(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    display: inline-flex;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 3px;
    gap: 2px;
  }
  button {
    border: 0;
    background: transparent;
    color: var(--muted);
    font-weight: 600;
    font-size: 13px;
    padding: 6px 14px;
    border-radius: 999px;
    cursor: pointer;
    min-height: 34px;
    transition: color 0.15s;
  }
  button.active {
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--shadow);
  }
  button:hover:not(.active) {
    color: var(--ink);
  }
</style>
