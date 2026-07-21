import { parseSpectrum } from '../src/__tests__/parseSpectrum.ts';
import type { Tree } from '../src/index.ts';
import { createTree, treeSimilarity } from '../src/index.ts';

const PLOT_W = Math.max(700, Math.min(1400, window.innerWidth - 60));
const TREE_H = 120;
const SPEC_H = 230;
const TOTAL_H = TREE_H + SPEC_H;
const ROW_H = 12;

interface Spectrum {
  name: string;
  x: number[];
  y: number[];
  tree: Tree | null;
  self: number;
  xMin: number;
  xMax: number;
}

const rawFiles = import.meta.glob('../src/__tests__/data/*.{jdx,dx,jcamp}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const spectra: Spectrum[] = Object.entries(rawFiles)
  .map(([path, content]): Spectrum => {
    const name = path.split('/').at(-1) ?? path;
    const { x, y } = parseSpectrum(content);
    const tree = createTree({ x, y });
    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    for (const value of x) {
      if (value < xMin) xMin = value;
      if (value > xMax) xMax = value;
    }
    return { name, x, y, tree, self: treeSimilarity(tree, tree), xMin, xMax };
  })
  .toSorted((a, b) => a.name.localeCompare(b.name));

const grid: number[][] = spectra.map((a) =>
  spectra.map((b) => {
    if (a.self === 0 || b.self === 0) return 0;
    return treeSimilarity(a.tree, b.tree) / Math.sqrt(a.self * b.self);
  }),
);

const shortName = (name: string) => name.replace(/\.(?:jdx|dx|jcamp)$/i, '');

function findIndex(fragment: string): number {
  const index = spectra.findIndex((s) => s.name.includes(fragment));
  return index === -1 ? 0 : index;
}

let selA = findIndex('02-three-peaks-noise-a');
let selB = findIndex('03-three-peaks-noise-b');
const view = { xMin: 0, xMax: 10, yScale: 1 };

function resetView(): void {
  const a = spectra[selA];
  const b = spectra[selB];
  if (!a || !b) return;
  view.xMin = Math.min(a.xMin, b.xMin);
  view.xMax = Math.max(a.xMax, b.xMax);
  view.yScale = 1;
}

const xToPx = (x: number) =>
  ((view.xMax - x) / (view.xMax - view.xMin)) * PLOT_W;
const pxToX = (px: number) =>
  view.xMax - (px / PLOT_W) * (view.xMax - view.xMin);

function yToPx(y: number): number {
  const yHi = 110 / view.yScale;
  const yLo = -20 / view.yScale;
  return TREE_H + SPEC_H * (1 - (y - yLo) / (yHi - yLo));
}

const treeYToPx = (level: number) => 8 + Math.min(level, 9) * ROW_H;

interface FlatNode {
  center: number;
  level: number;
  parentCenter: number | undefined;
  parentLevel: number | undefined;
}

function flattenTree(
  tree: Tree | null,
  level: number,
  parentCenter: number | undefined,
  parentLevel: number | undefined,
  out: FlatNode[],
): void {
  if (!tree) return;
  out.push({ center: tree.center, level, parentCenter, parentLevel });
  flattenTree(tree.left, level + 1, tree.center, level, out);
  flattenTree(tree.right, level + 1, tree.center, level, out);
}

function envelopePath(sp: Spectrum): string {
  const maxA = new Float64Array(PLOT_W).fill(Number.NEGATIVE_INFINITY);
  const minA = new Float64Array(PLOT_W).fill(Number.POSITIVE_INFINITY);
  const { x, y } = sp;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i] as number;
    if (xi >= view.xMin && xi <= view.xMax) {
      const col = Math.min(PLOT_W - 1, Math.max(0, Math.round(xToPx(xi))));
      const yi = y[i] as number;
      if (yi > (maxA[col] as number)) maxA[col] = yi;
      if (yi < (minA[col] as number)) minA[col] = yi;
    }
  }
  const top: string[] = [];
  const bottom: string[] = [];
  for (let c = 0; c < PLOT_W; c++) {
    if (maxA[c] !== Number.NEGATIVE_INFINITY) {
      top.push(`${c},${yToPx(maxA[c] as number).toFixed(1)}`);
      bottom.push(`${c},${yToPx(minA[c] as number).toFixed(1)}`);
    }
  }
  if (top.length === 0) return '';
  return `M ${top.join(' L ')} L ${bottom.toReversed().join(' L ')} Z`;
}

function drawPlotSvg(sp: Spectrum): string {
  const nodes: FlatNode[] = [];
  flattenTree(sp.tree, 0, undefined, undefined, nodes);
  const parts: string[] = [];

  for (const node of nodes) {
    const px = xToPx(node.center).toFixed(1);
    parts.push(
      `<line class="guide" x1="${px}" y1="0" x2="${px}" y2="${TOTAL_H}" />`,
    );
  }
  for (const node of nodes) {
    const px = xToPx(node.center);
    const py = treeYToPx(node.level);
    if (node.parentCenter !== undefined && node.parentLevel !== undefined) {
      const ppx = xToPx(node.parentCenter);
      const ppy = treeYToPx(node.parentLevel);
      const midY = (ppy + py) / 2;
      parts.push(
        `<path class="edge" d="M ${ppx.toFixed(1)} ${ppy.toFixed(1)} L ${ppx.toFixed(1)} ${midY.toFixed(1)} L ${px.toFixed(1)} ${midY.toFixed(1)} L ${px.toFixed(1)} ${py.toFixed(1)}" />`,
      );
    }
    parts.push(
      `<circle class="node" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" />`,
    );
  }

  const env = envelopePath(sp);
  if (env) parts.push(`<path class="spectrum" d="${env}" />`);
  const baseY = yToPx(0).toFixed(1);
  parts.push(
    `<line class="baseline" x1="0" y1="${baseY}" x2="${PLOT_W}" y2="${baseY}" />`,
  );

  const ticks = 8;
  for (let t = 0; t <= ticks; t++) {
    const xValue = view.xMin + ((view.xMax - view.xMin) * t) / ticks;
    const px = xToPx(xValue).toFixed(1);
    parts.push(
      `<text class="tick" x="${px}" y="${TOTAL_H - 4}" text-anchor="middle">${xValue.toFixed(1)}</text>`,
    );
  }

  parts.push(
    `<rect class="sel" x="0" y="0" width="0" height="${TOTAL_H}" style="display:none" />`,
    `<text class="title" x="6" y="14">${sp.name}</text>`,
  );

  return `<svg width="${PLOT_W}" height="${TOTAL_H}" viewBox="0 0 ${PLOT_W} ${TOTAL_H}">${parts.join('')}</svg>`;
}

function cellColor(value: number): string {
  const t = Math.min(1, Math.max(0, (value - 0.75) / 0.25));
  const r = Math.round(255 - t * 215);
  const g = Math.round(255 - t * 95);
  const b = Math.round(255 - t * 130);
  return `rgb(${r},${g},${b})`;
}

function renderMatrix(): void {
  const container = document.querySelector('#matrix');
  if (!container) return;
  const header = `<tr><th></th>${spectra
    .map((s, i) => `<th class="col" title="${s.name}">${i + 1}</th>`)
    .join('')}</tr>`;
  const body = spectra
    .map((rowSpectrum, i) => {
      const label = `<th class="rowlabel" title="${rowSpectrum.name}">${i + 1}. ${shortName(rowSpectrum.name)}</th>`;
      const cells = spectra
        .map((_, j) => {
          const value = grid[i]?.[j] ?? 0;
          const selected = i === selA && j === selB ? ' selected' : '';
          return `<td class="cell${selected}" data-i="${i}" data-j="${j}" style="background:${cellColor(value)}">${value.toFixed(2)}</td>`;
        })
        .join('');
      return `<tr>${label}${cells}</tr>`;
    })
    .join('');
  container.innerHTML = `<table class="matrix">${header}${body}</table>`;
}

function renderPlots(): void {
  const container = document.querySelector('#plots');
  const a = spectra[selA];
  const b = spectra[selB];
  if (!container || !a || !b) return;
  const value = (grid[selA]?.[selB] ?? 0).toFixed(3);
  container.innerHTML =
    `<div class="pair-info">Similarity <b>${value}</b> — ${a.name} vs ${b.name}</div>` +
    `<div class="plot" data-plot>${drawPlotSvg(a)}</div>` +
    `<div class="plot" data-plot>${drawPlotSvg(b)}</div>`;
  for (const svg of document.querySelectorAll('#plots svg')) {
    svg.addEventListener('mousedown', onDown as EventListener);
    svg.addEventListener('dblclick', onReset);
    svg.addEventListener('wheel', onWheel as EventListener, { passive: false });
  }
}

let drag: { startPx: number; rectLeft: number } | undefined;

function onDown(event: MouseEvent): void {
  const svg = event.currentTarget as SVGSVGElement;
  const rectLeft = svg.getBoundingClientRect().left;
  drag = { startPx: event.clientX - rectLeft, rectLeft };
}

function onMove(event: MouseEvent): void {
  if (!drag) return;
  const px = Math.min(PLOT_W, Math.max(0, event.clientX - drag.rectLeft));
  const x = Math.min(drag.startPx, px);
  const width = Math.abs(px - drag.startPx);
  for (const rect of document.querySelectorAll('#plots .sel')) {
    rect.setAttribute('x', String(x));
    rect.setAttribute('width', String(width));
    (rect as SVGRectElement).style.display = 'block';
  }
}

function onUp(event: MouseEvent): void {
  if (!drag) return;
  const px = Math.min(PLOT_W, Math.max(0, event.clientX - drag.rectLeft));
  const x1 = pxToX(Math.min(drag.startPx, px));
  const x2 = pxToX(Math.max(drag.startPx, px));
  const from = Math.min(x1, x2);
  const to = Math.max(x1, x2);
  drag = undefined;
  if (to - from > (view.xMax - view.xMin) * 0.01) {
    view.xMin = from;
    view.xMax = to;
    renderPlots();
  } else {
    for (const rect of document.querySelectorAll('#plots .sel')) {
      (rect as SVGRectElement).style.display = 'none';
    }
  }
}

function onReset(): void {
  resetView();
  renderPlots();
}

function onWheel(event: WheelEvent): void {
  event.preventDefault();
  view.yScale = Math.min(
    50,
    Math.max(0.2, view.yScale * (event.deltaY < 0 ? 1.1 : 1 / 1.1)),
  );
  renderPlots();
}

function init(): void {
  const matrix = document.querySelector('#matrix');
  matrix?.addEventListener('click', (event) => {
    const cell = (event.target as HTMLElement).closest('td.cell');
    if (!cell) return;
    selA = Number(cell.dataset.i);
    selB = Number(cell.dataset.j);
    resetView();
    renderMatrix();
    renderPlots();
  });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  resetView();
  renderMatrix();
  renderPlots();
}

init();
