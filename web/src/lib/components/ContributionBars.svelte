<script lang="ts">
  import { formatPP } from '$lib/format';
  import { shortGroup } from '$lib/util';

  interface Item {
    product_group: string;
    contribution: number;
  }
  interface Props {
    /** Rows to draw, in display order (caller decides ranking/slicing). */
    items: Item[];
    /** Label column width. */
    labelWidth?: string;
  }
  let { items, labelWidth = '150px' }: Props = $props();

  // Scale every bar to the largest magnitude in the set so the ranking reads at a glance.
  const maxAbs = $derived(Math.max(0.0001, ...items.map((i) => Math.abs(i.contribution))));
  const barPct = (v: number) => `${Math.max(4, (Math.abs(v) / maxAbs) * 100)}%`;
</script>

<div class="bars" style="--label-w:{labelWidth}">
  {#each items as c (c.product_group)}
    {@const down = c.contribution < -0.05}
    <div class="row" class:down>
      <span class="name">{shortGroup(c.product_group)}</span>
      <span class="track"><span class="fill" style="width:{barPct(c.contribution)}"></span></span>
      <span class="val mono tnum">{formatPP(c.contribution)}</span>
    </div>
  {/each}
</div>

<style>
  .bars {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .row {
    display: grid;
    grid-template-columns: var(--label-w) 1fr 92px;
    align-items: center;
    gap: 14px;
  }
  .name {
    font-weight: 500;
    font-size: 14px;
    color: var(--ink);
  }
  .row.down .name {
    color: var(--muted);
  }
  .track {
    height: 22px;
    background: var(--wash);
    border-radius: 5px;
    position: relative;
    overflow: hidden;
  }
  .fill {
    position: absolute;
    inset: 0;
    background: var(--accent);
    border-radius: 5px;
  }
  .row.down .fill {
    background: transparent;
    border: 1.5px solid var(--faint);
  }
  .val {
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    color: var(--ink);
  }
  .row.down .val {
    color: var(--muted);
  }
  @media (max-width: 520px) {
    .row {
      grid-template-columns: 104px 1fr 84px;
      gap: 10px;
    }
    .name {
      font-size: 13px;
    }
  }
</style>
