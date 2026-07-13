<script lang="ts">
  import { geoConicConformal, geoPath, type GeoPermissibleObjects } from 'd3-geo';
  import { formatPctPlain } from '$lib/format';

  /**
   * Province map used ONLY where geography is the task (DESIGN §4: the map is a
   * poor comparison tool, good as a selector). Colors by |value| intensity with a
   * text label on hover; selection is by click. Always paired with a text list
   * fallback in the parent for mobile / a11y.
   */
  interface Props {
    values: Record<string, number | null>; // geo name → value (yoy)
    selected: string;
    onSelect: (geo: string) => void;
    width?: number;
  }
  let { values, selected, onSelect, width = 360 }: Props = $props();

  let features = $state<{ name: string; d: string; centroid: [number, number] }[]>([]);
  let height = $state(320);
  let hovered = $state<string | null>(null);

  const maxAbs = $derived(
    Math.max(0.5, ...Object.values(values).map((v) => (v == null ? 0 : Math.abs(v)))),
  );

  function fill(name: string): string {
    const v = values[name];
    if (v == null) return 'var(--surface-2)';
    const t = Math.min(1, Math.abs(v) / maxAbs);
    // single-hue accent wash (no good/bad diverging semantics on the map)
    return `color-mix(in srgb, var(--accent) ${Math.round(15 + t * 75)}%, var(--surface))`;
  }

  $effect(() => {
    (async () => {
      const res = await fetch('/geo/provinces.geojson');
      const geo = (await res.json()) as {
        features: { properties: { name: string }; geometry: GeoPermissibleObjects }[];
      };
      const h = Math.round(width * 0.82);
      height = h;
      const projection = geoConicConformal()
        .parallels([49, 77])
        .rotate([95, 0])
        .fitSize([width, h], geo as unknown as GeoPermissibleObjects);
      const path = geoPath(projection);
      features = geo.features.map((f) => ({
        name: f.properties.name,
        d: path(f.geometry as GeoPermissibleObjects) ?? '',
        centroid: path.centroid(f.geometry as GeoPermissibleObjects) as [number, number],
      }));
    })();
  });
</script>

<div class="wrap">
  <svg viewBox="0 0 {width} {height}" width={width} height={height} role="group" aria-label="Province map selector">
    {#each features as f (f.name)}
      <path
        d={f.d}
        fill={fill(f.name)}
        stroke={selected === f.name ? 'var(--accent)' : 'var(--border)'}
        stroke-width={selected === f.name ? 2.5 : 0.8}
        role="button"
        tabindex="0"
        aria-label="{f.name}: {formatPctPlain(values[f.name])}"
        class:sel={selected === f.name}
        onclick={() => onSelect(f.name)}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(f.name))}
        onmouseenter={() => (hovered = f.name)}
        onmouseleave={() => (hovered = null)}
      />
    {/each}
  </svg>
  {#if hovered}
    <div class="tip">{hovered}: <strong class="tnum">{formatPctPlain(values[hovered])}</strong></div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
  }
  svg {
    max-width: 100%;
    height: auto;
    display: block;
  }
  path {
    cursor: pointer;
    transition: fill 0.2s, stroke-width 0.1s;
    outline: none;
  }
  path:hover {
    stroke: var(--accent);
    stroke-width: 1.6;
  }
  path:focus-visible {
    stroke: var(--accent);
    stroke-width: 2.5;
  }
  .tip {
    position: absolute;
    top: 8px;
    left: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 13px;
    box-shadow: var(--shadow);
    pointer-events: none;
  }
</style>
