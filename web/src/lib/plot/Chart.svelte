<script lang="ts">
  import * as Plot from '@observablehq/plot';
  import { basePlotOptions } from './theme';

  /**
   * Generic Observable Plot wrapper. Pass a `build(width)` that returns Plot marks
   * + option overrides; the component measures its container, merges base theme
   * options, renders, and re-renders on prop change / resize / theme change.
   */
  interface Props {
    build: (width: number) => Plot.PlotOptions;
    height?: number;
    ariaLabel?: string;
    /** bump to force re-render (e.g. theme toggle) */
    revision?: number;
  }
  let { build, height = 300, ariaLabel = 'chart', revision = 0 }: Props = $props();

  let el: HTMLDivElement;
  let width = $state(600);

  $effect(() => {
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && Math.abs(w - width) > 1) width = w;
    });
    ro.observe(el);
    return () => ro.disconnect();
  });

  $effect(() => {
    // deps: width, build, revision
    void revision;
    if (!el || width < 10) return;
    const opts = build(width);
    const chart = Plot.plot({ ...basePlotOptions(width), height, ...opts });
    (chart as SVGElement).setAttribute('role', 'img');
    (chart as SVGElement).setAttribute('aria-label', ariaLabel);
    el.replaceChildren(chart);
    return () => el?.replaceChildren();
  });
</script>

<div class="chart" bind:this={el} style="min-height:{height}px"></div>

<style>
  .chart {
    width: 100%;
    overflow-x: auto;
  }
</style>
