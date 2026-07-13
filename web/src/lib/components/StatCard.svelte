<script lang="ts">
  import { direction, formatPct } from '$lib/format';

  interface Props {
    label: string;
    value: number | null;
    sub?: string;
    icon?: string;
    big?: boolean;
    decimals?: number;
  }
  let { label, value, sub, icon, big = false, decimals = 1 }: Props = $props();
  let dir = $derived(direction(value));
</script>

<div class="stat" class:big>
  <div class="top">
    {#if icon}<span class="ico" aria-hidden="true"><i class={icon}></i></span>{/if}
    <span class="label muted">{label}</span>
  </div>
  <div class="value tnum" class:up={dir.label === 'up'} class:down={dir.label === 'down'}>
    <span class="glyph" aria-hidden="true">{dir.glyph}</span>{formatPct(value, decimals)}
    <span class="sr">{dir.label}</span>
  </div>
  {#if sub}<div class="sub muted">{sub}</div>{/if}
</div>

<style>
  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .label {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .ico {
    color: var(--accent);
    font-size: 14px;
    width: 18px;
    text-align: center;
  }
  .value {
    font-family: var(--font-sans);
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.02em;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .big .value {
    font-size: clamp(48px, 9vw, 84px);
    line-height: 1;
    letter-spacing: -0.04em;
  }
  .glyph {
    font-size: 0.6em;
    color: var(--muted);
  }
  .value.up .glyph {
    color: var(--accent);
  }
  .value.down .glyph {
    color: var(--series-4);
  }
  .sub {
    font-size: 13px;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
