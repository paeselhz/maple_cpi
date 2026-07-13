/** CSV + PNG export helpers (the old app advertised "export information"). */

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}

/** Metadata that turns a bare chart into a shareable, self-explanatory graphic. */
export interface PngExportMeta {
  title: string;
  subtitle?: string;
  caption?: string;
  legend?: { label: string; color: string; dash?: boolean }[];
  axisLabel?: string;
  note?: string;
  source?: string;
}

/** Rasterize a (vector) inline SVG to an <img> at its own dimensions. */
async function svgToImage(svg: SVGSVGElement, w: number, h: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const data = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
  });
  return img;
}

/**
 * Compose the chart plus its title, subtitle, legend, axis label, "now" marker and
 * source into a single PNG — so the export reads on its own, not just a bare plot.
 */
export async function downloadPng(
  container: HTMLElement,
  filename: string,
  meta: PngExportMeta,
  scale = 2,
): Promise<void> {
  // Plot renders a swatch legend as tiny 15×15 SVGs *before* the chart when a colour
  // scale has `legend: true`; pick the largest SVG so we never grab a solid swatch.
  const svgs = [...container.querySelectorAll('svg')];
  if (!svgs.length) return;
  const area = (s: SVGSVGElement) =>
    (s.clientWidth || Number(s.getAttribute('width')) || 0) *
    (s.clientHeight || Number(s.getAttribute('height')) || 0);
  const svg = svgs.reduce((a, b) => (area(b) > area(a) ? b : a)) as SVGSVGElement;

  const cw = svg.clientWidth || Number(svg.getAttribute('width')) || 640;
  const ch = svg.clientHeight || Number(svg.getAttribute('height')) || 360;
  const chartImg = await svgToImage(svg, cw, ch);
  await document.fonts.ready;

  const css = getComputedStyle(document.documentElement);
  const tok = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
  const ink = tok('--ink', '#1c1a19');
  const muted = tok('--muted', '#8a817c');
  const faint = tok('--faint', '#b8a79e');
  const accent = tok('--accent', '#e4572e');
  const surface = tok('--surface', '#ffffff');
  const border = tok('--border', '#eadfd6');
  const serif = "'Newsreader', Georgia, serif";
  const sans = "'Libre Franklin', system-ui, sans-serif";
  const mono = "'IBM Plex Mono', ui-monospace, monospace";

  const PAD = 34;
  const W = cw;
  const totalW = W + PAD * 2;

  // ---- vertical layout (CSS px) ----
  let headerH = 26 /* kicker */ + 32 /* title */;
  if (meta.caption) headerH += 24;
  const legendH = meta.legend?.length ? 30 : 0;
  const footerH = 18 + 22 + (meta.source ? 20 : 0);
  const totalH = PAD + headerH + legendH + ch + footerH + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = totalW * scale;
  canvas.height = totalH * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, totalW, totalH);
  ctx.textBaseline = 'alphabetic';

  let y = PAD + 11;
  // brand kicker
  ctx.fillStyle = accent;
  ctx.font = `700 11px ${mono}`;
  ctx.fillText('MAPLE CPI', PAD, y);
  // title + inline subtitle
  y += 30;
  ctx.fillStyle = ink;
  ctx.font = `600 24px ${serif}`;
  ctx.fillText(meta.title, PAD, y);
  if (meta.subtitle) {
    const tw = ctx.measureText(meta.title).width;
    ctx.fillStyle = muted;
    ctx.font = `italic 15px ${serif}`;
    ctx.fillText(`  ·  ${meta.subtitle}`, PAD + tw, y);
  }
  // caption / insight
  if (meta.caption) {
    y += 24;
    ctx.fillStyle = muted;
    ctx.font = `italic 14px ${serif}`;
    ctx.fillText(meta.caption, PAD, y);
  }

  // legend
  if (meta.legend?.length) {
    y += 26;
    let lx = PAD;
    ctx.font = `500 13px ${sans}`;
    for (const it of meta.legend) {
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 3;
      ctx.setLineDash(it.dash ? [4, 3] : []);
      ctx.beginPath();
      ctx.moveTo(lx, y - 4);
      ctx.lineTo(lx + 18, y - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      lx += 24;
      ctx.fillStyle = muted;
      ctx.fillText(it.label, lx, y);
      lx += ctx.measureText(it.label).width + 22;
    }
  }

  // chart (SVG rasterizes crisply at device resolution)
  y += 14;
  ctx.drawImage(chartImg, PAD, y, W, ch);
  y += ch;

  // footer: divider, axis label + now marker, source
  y += 16;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(totalW - PAD, y);
  ctx.stroke();
  y += 20;
  ctx.font = `600 12px ${mono}`;
  if (meta.axisLabel) {
    ctx.fillStyle = muted;
    ctx.textAlign = 'left';
    ctx.fillText(meta.axisLabel, PAD, y);
  }
  if (meta.note) {
    ctx.fillStyle = accent;
    ctx.textAlign = 'right';
    ctx.fillText(meta.note, totalW - PAD, y);
    ctx.textAlign = 'left';
  }
  if (meta.source) {
    y += 20;
    ctx.fillStyle = faint;
    ctx.font = `400 11px ${mono}`;
    ctx.fillText(meta.source, PAD, y);
  }

  canvas.toBlob((blob) => blob && triggerDownload(blob, filename), 'image/png');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
