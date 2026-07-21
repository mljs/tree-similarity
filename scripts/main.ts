import {
  xEqualIntegrationVectorSimilarity,
  xyEqualIntegrationVector,
  xySortX,
} from 'ml-spectra-processing';

import { parseSpectrum } from '../src/__tests__/parseSpectrum.ts';
import type { Tree } from '../src/index.ts';
import { createTree, treeSimilarity } from '../src/index.ts';

const PLOT_W = Math.max(700, Math.min(1400, window.innerWidth - 60));
const TREE_H = 120;
const SPEC_H = 230;
const TOTAL_H = TREE_H + SPEC_H;
const ROW_H = 12;

// Equal-integration vector settings for the ml-spectra-processing similarity.
const VECTOR_DEPTH = 6;
const RECENTER = false;
const positionSimilarity = (a: number, b: number) => Math.exp(-Math.abs(a - b));

const shortName = (name: string) => name.replace(/\.(?:jdx|dx|jcamp)$/i, '');

interface Group {
  label: string;
  color: string;
  background: string;
  /** short names (without extension) that belong to this group, in display order */
  members: string[];
  /**
   * true for the green/blue reference groups whose spectra all share the same
   * true peaks at 2, 5, 8 ppm, so they feed the quality statistics.
   * @default false
   */
  stats?: boolean;
}

// Spectra are ordered and colored by what they probe, not alphabetically.
// The 1% noise draws sit at display positions 2 and 3, right after the clean one.
const GROUPS: Group[] = [
  {
    label: 'Three peaks · noise level',
    color: '#2e7d32',
    background: '#e8f5e9',
    stats: true,
    members: [
      '01-three-peaks-clean',
      '18-three-peaks-noise-1pct-a',
      '19-three-peaks-noise-1pct-b',
      '02-three-peaks-noise-a',
      '03-three-peaks-noise-b',
      '04-three-peaks-noise-high',
      '13-three-peaks-tiny-extras',
      '20-three-peaks-tiny-extras-1pct',
    ],
  },
  {
    label: 'Three peaks · peak width (1% noise)',
    color: '#558b2f',
    background: '#f1f8e9',
    stats: true,
    members: [
      '10-three-peaks-fwhm-0p01',
      '14-three-peaks-fwhm-0p02',
      '15-three-peaks-fwhm-0p1',
    ],
  },
  {
    label: 'Three peaks · resampling',
    color: '#00838f',
    background: '#e0f7fa',
    stats: true,
    members: [
      '11-three-peaks-1to9-dense',
      '12-three-peaks-1to9-sparse',
      '21-three-peaks-1pct-100001pts',
      '22-three-peaks-1pct-1001pts',
    ],
  },
  {
    label: 'Three peaks · shifted',
    color: '#ef6c00',
    background: '#fff3e0',
    members: ['05-three-peaks-global-shift', '06-three-peaks-local-shift'],
  },
  {
    label: 'Different peak count',
    color: '#6a1b9a',
    background: '#f3e5f5',
    members: ['07-two-peaks', '08-four-peaks'],
  },
  {
    label: 'Peak heights',
    color: '#c2185b',
    background: '#fce4ec',
    members: ['09-three-peaks-heights'],
  },
  {
    label: 'Baseline distortion',
    color: '#5d4037',
    background: '#efebe9',
    members: [
      '16-three-peaks-linear-baseline',
      '17-three-peaks-parabolic-baseline',
    ],
  },
  {
    label: 'Real NMR spectra',
    color: '#455a64',
    background: '#eceff1',
    members: ['aspirin', 'cyclosporin', 'cytisin', 'ethylvinylether'],
  },
  {
    label: 'Ibuprofen · field & solvent',
    color: '#3949ab',
    background: '#e8eaf6',
    members: [
      'ibuprofen-300-cdcl3',
      'ibuprofen-400-cdcl3',
      'ibuprofen-600-cdcl3',
      'ibuprofen-300-dmso',
      'ibuprofen-400-dmso',
      'ibuprofen-600-dmso',
    ],
  },
];

const OTHER_GROUP: Group = {
  label: 'Other',
  color: '#777',
  background: '#f0f0f0',
  members: [],
};

function groupRank(name: string): { group: Group; order: number } {
  const short = shortName(name);
  for (let g = 0; g < GROUPS.length; g++) {
    const index = (GROUPS[g] as Group).members.indexOf(short);
    if (index !== -1) {
      return { group: GROUPS[g] as Group, order: g * 100 + index };
    }
  }
  return { group: OTHER_GROUP, order: GROUPS.length * 100 };
}

interface Meta {
  /** short human-readable label shown in the matrix */
  label: string;
  /** one sentence describing what the spectrum probes, shown on hover */
  description: string;
}

// Peaks are height 100 unless stated otherwise; every simulated spectrum states
// its noise level in the description (S/N ~ 20 at 5% noise, ~ 100 at 1%).
const META: Record<string, Meta> = {
  '01-three-peaks-clean': {
    label: 'Clean · no noise',
    description: 'Reference: three peaks at 2, 5, 8 ppm (fwhm 0.05), no noise.',
  },
  '02-three-peaks-noise-a': {
    label: '5% noise · A',
    description: 'Reference peaks plus 5% Gaussian noise (seed A), S/N ~ 20.',
  },
  '03-three-peaks-noise-b': {
    label: '5% noise · B',
    description:
      'Same peaks and level as A but an independent noise draw (seed B).',
  },
  '04-three-peaks-noise-high': {
    label: '20% noise',
    description: 'Reference peaks with heavy 20% noise, S/N ~ 5.',
  },
  '05-three-peaks-global-shift': {
    label: 'Global shift −1 ppm',
    description:
      'All peaks shifted to 1, 4, 7 ppm, 5% noise. Probes shift sensitivity.',
  },
  '06-three-peaks-local-shift': {
    label: 'Local shift 8 → 8.4',
    description:
      'Only the third peak moved to 8.4 ppm; the others stay put. 5% noise.',
  },
  '07-two-peaks': {
    label: 'Two peaks (5 missing)',
    description: 'Middle peak removed: peaks only at 2 and 8 ppm, 5% noise.',
  },
  '08-four-peaks': {
    label: 'Four peaks',
    description: 'An extra peak: 2, 4, 6, 8 ppm, 5% noise.',
  },
  '09-three-peaks-heights': {
    label: 'Heights 100/50/25',
    description: 'Three peaks with decreasing heights (100, 50, 25), 5% noise.',
  },
  '10-three-peaks-fwhm-0p01': {
    label: 'Width · fwhm 0.01',
    description: 'Three very sharp peaks (fwhm 0.01) at 2, 5, 8 ppm, 1% noise.',
  },
  '11-three-peaks-1to9-dense': {
    label: '1–9 ppm · 10001 pts',
    description:
      'Reference peaks sampled over 1–9 ppm with 10001 points, 5% noise.',
  },
  '12-three-peaks-1to9-sparse': {
    label: '1–9 ppm · 2001 pts',
    description:
      'Every 5th point of the dense one: same peaks & 5% noise, 5× coarser.',
  },
  '13-three-peaks-tiny-extras': {
    label: '+2 tiny peaks',
    description:
      '5% noise (draw B) plus two 5%-height peaks at 3.5 and 6.5 ppm.',
  },
  '14-three-peaks-fwhm-0p02': {
    label: 'Width · fwhm 0.02',
    description: 'Three sharp peaks (fwhm 0.02) at 2, 5, 8 ppm, 1% noise.',
  },
  '15-three-peaks-fwhm-0p1': {
    label: 'Width · fwhm 0.1',
    description:
      'Three peaks at the wide end of realistic NMR (fwhm 0.1), 1% noise.',
  },
  '16-three-peaks-linear-baseline': {
    label: 'Linear baseline',
    description:
      'Reference peaks with an added sloping (linear) baseline, 5% noise.',
  },
  '17-three-peaks-parabolic-baseline': {
    label: 'Parabolic baseline',
    description:
      'Reference peaks with an added parabolic (bowl) baseline, 5% noise.',
  },
  '18-three-peaks-noise-1pct-a': {
    label: '1% noise · A',
    description: 'Reference peaks plus 1% Gaussian noise (seed A), S/N ~ 100.',
  },
  '19-three-peaks-noise-1pct-b': {
    label: '1% noise · B',
    description:
      'Same peaks and level as 1% A but an independent draw (seed B).',
  },
  '20-three-peaks-tiny-extras-1pct': {
    label: '+2 tiny peaks · 1% noise',
    description:
      'Two 5%-height peaks at 3.5 and 6.5 ppm, now clear of the 1% noise floor.',
  },
  '21-three-peaks-1pct-100001pts': {
    label: '1% noise · 100001 pts',
    description: 'Reference peaks at 1% noise sampled with 100001 points.',
  },
  '22-three-peaks-1pct-1001pts': {
    label: '1% noise · 1001 pts',
    description:
      'Every 100th point of the 100001-pt one: same peaks & 1% noise.',
  },
  aspirin: {
    label: 'Aspirin',
    description: 'Real experimental ¹H NMR spectrum of aspirin.',
  },
  cyclosporin: {
    label: 'Cyclosporin',
    description: 'Real experimental ¹H NMR spectrum of cyclosporin.',
  },
  cytisin: {
    label: 'Cytisin',
    description: 'Real experimental ¹H NMR spectrum of cytisin.',
  },
  ethylvinylether: {
    label: 'Ethyl vinyl ether',
    description: 'Real experimental ¹H NMR spectrum of ethyl vinyl ether.',
  },
  'ibuprofen-300-cdcl3': {
    label: 'Ibuprofen 300 · CDCl₃',
    description: 'Real ¹H NMR of ibuprofen, 300 MHz in CDCl₃.',
  },
  'ibuprofen-400-cdcl3': {
    label: 'Ibuprofen 400 · CDCl₃',
    description: 'Real ¹H NMR of ibuprofen, 400 MHz in CDCl₃.',
  },
  'ibuprofen-600-cdcl3': {
    label: 'Ibuprofen 600 · CDCl₃',
    description: 'Real ¹H NMR of ibuprofen, 600 MHz in CDCl₃.',
  },
  'ibuprofen-300-dmso': {
    label: 'Ibuprofen 300 · DMSO',
    description: 'Real ¹H NMR of ibuprofen, 300 MHz in DMSO-d₆.',
  },
  'ibuprofen-400-dmso': {
    label: 'Ibuprofen 400 · DMSO',
    description: 'Real ¹H NMR of ibuprofen, 400 MHz in DMSO-d₆.',
  },
  'ibuprofen-600-dmso': {
    label: 'Ibuprofen 600 · DMSO',
    description: 'Real ¹H NMR of ibuprofen, 600 MHz in DMSO-d₆.',
  },
};

function metaOf(name: string): Meta {
  const short = shortName(name);
  return META[short] ?? { label: short, description: short };
}

interface Spectrum {
  name: string;
  x: number[];
  y: number[];
  tree: Tree | null;
  self: number;
  /** equal-integration vector for the ml-spectra-processing similarity */
  eiVector: Float64Array;
  xMin: number;
  xMax: number;
  group: Group;
  order: number;
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
    const eiVector = xyEqualIntegrationVector(xySortX({ x, y }), {
      depth: VECTOR_DEPTH,
    });
    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    for (const value of x) {
      if (value < xMin) xMin = value;
      if (value > xMax) xMax = value;
    }
    const { group, order } = groupRank(name);
    return {
      name,
      x,
      y,
      tree,
      self: treeSimilarity(tree, tree),
      eiVector,
      xMin,
      xMax,
      group,
      order,
    };
  })
  .toSorted((a, b) => a.order - b.order);

// Two similarity matrices computed in parallel so the viewer can toggle between
// them: the current center-of-mass tree, and the equal-integration vector scored
// with the ml-spectra-processing algorithm.
const gridTree: number[][] = spectra.map((a) =>
  spectra.map((b) =>
    a.self === 0 || b.self === 0
      ? 0
      : treeSimilarity(a.tree, b.tree) / Math.sqrt(a.self * b.self),
  ),
);
const gridEI: number[][] = spectra.map((a) =>
  spectra.map((b) =>
    xEqualIntegrationVectorSimilarity(a.eiVector, b.eiVector, {
      recenter: RECENTER,
      similarityFct: positionSimilarity,
    }),
  ),
);

type Method = 'tree' | 'ei';
const METHOD_LABELS: Record<Method, string> = {
  tree: 'Current tree',
  ei: 'Equal-integration + SP algo',
};
let method: Method = 'ei';
const activeGrid = (): number[][] => (method === 'ei' ? gridEI : gridTree);

function findIndex(fragment: string): number {
  const index = spectra.findIndex((s) => s.name.includes(fragment));
  return index === -1 ? 0 : index;
}

// The green/blue reference spectra all have their three real peaks here.
const TRUE_PEAKS = [2, 5, 8];
const cleanIndex = findIndex('01-three-peaks-clean');

function collectCenters(tree: Tree | null, out: number[]): void {
  if (!tree) return;
  out.push(tree.center);
  collectCenters(tree.left, out);
  collectCenters(tree.right, out);
}

// Node positions of the active method: the center-of-mass tree, or the
// equal-integration split vector (which the SP algorithm compares).
function nodeCenters(spectrum: Spectrum): number[] {
  if (method === 'ei') return Array.from(spectrum.eiVector);
  const centers: number[] = [];
  collectCenters(spectrum.tree, centers);
  return centers;
}

// Mean distance in ppm from each true peak to the nearest tree node: how
// precisely the tree drops a node on top of every real peak. Lower is better,
// and it is the localization criterion we want the algorithm to improve.
function peakLocalizationError(centers: number[]): number {
  if (centers.length === 0) return Number.NaN;
  let total = 0;
  for (const peak of TRUE_PEAKS) {
    let best = Number.POSITIVE_INFINITY;
    for (const center of centers) {
      const distance = Math.abs(center - peak);
      if (distance < best) best = distance;
    }
    total += best;
  }
  return total / TRUE_PEAKS.length;
}

let mode: 'pair' | 'ranked' = 'pair';
let selA = findIndex('02-three-peaks-noise-a');
let selB = findIndex('03-three-peaks-noise-b');
// The product a ranked list is built around (its row label was clicked).
let rankAnchor = 0;
const view = { xMin: 0, xMax: 10, yScale: 1 };

function resetView(): void {
  view.yScale = 1;
  const a = spectra[selA];
  const b = spectra[selB];
  if (!a || !b) return;
  view.xMin = Math.min(a.xMin, b.xMin);
  view.xMax = Math.max(a.xMax, b.xMax);
}

// All spectra scored against the anchor by the active method, best match first.
function rankingFor(anchor: number): Array<{ index: number; value: number }> {
  const row = activeGrid()[anchor] ?? [];
  const list = spectra.map((_, index) => ({ index, value: row[index] ?? 0 }));
  return list.toSorted((a, b) => b.value - a.value);
}

// Enter ranked mode: build the list around `anchor` and preselect the closest
// other sample so the two plots below always show a meaningful comparison.
function selectAnchor(anchor: number): void {
  mode = 'ranked';
  rankAnchor = anchor;
  selA = anchor;
  const best = rankingFor(anchor).find((entry) => entry.index !== anchor);
  selB = best?.index ?? anchor;
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

// The equal-integration vector is a complete binary tree in heap order: node i
// has children 2i+1 and 2i+2 and parent floor((i-1)/2). Each entry is a split x.
function equalIntegrationNodes(vector: Float64Array): FlatNode[] {
  const out: FlatNode[] = [];
  for (let i = 0; i < vector.length; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const parent = i === 0 ? undefined : (i - 1) >> 1;
    out.push({
      center: vector[i] as number,
      level,
      parentCenter: parent === undefined ? undefined : vector[parent],
      parentLevel: parent === undefined ? undefined : level - 1,
    });
  }
  return out;
}

function treeNodes(sp: Spectrum): FlatNode[] {
  if (method === 'ei') return equalIntegrationNodes(sp.eiVector);
  const out: FlatNode[] = [];
  flattenTree(sp.tree, 0, undefined, undefined, out);
  return out;
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
  const nodes = treeNodes(sp);
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

  // Intensity (y) gridlines and labels; the zero level is drawn in yellow.
  for (const value of [25, 50, 75, 100]) {
    const py = yToPx(value);
    if (py < TREE_H || py > TOTAL_H) continue;
    parts.push(
      `<line class="ygrid" x1="0" y1="${py.toFixed(1)}" x2="${PLOT_W}" y2="${py.toFixed(1)}" />`,
      `<text class="ytick" x="3" y="${(py - 2).toFixed(1)}">${value}</text>`,
    );
  }

  const env = envelopePath(sp);
  if (env) parts.push(`<path class="spectrum" d="${env}" />`);

  const zeroY = yToPx(0).toFixed(1);
  parts.push(
    `<line class="zero" x1="0" y1="${zeroY}" x2="${PLOT_W}" y2="${zeroY}" />`,
    `<text class="ytick zero-label" x="3" y="${(yToPx(0) - 2).toFixed(1)}">0</text>`,
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
    `<text class="title" x="24" y="14">${metaOf(sp.name).label}</text>`,
  );

  return `<svg width="${PLOT_W}" height="${TOTAL_H}" viewBox="0 0 ${PLOT_W} ${TOTAL_H}">${parts.join('')}</svg>`;
}

// Diverging scale: green for high similarity, pink/red for low, over 0.4-1.0.
function cellColor(value: number): string {
  const mid = 0.75;
  const clamped = Math.min(1, Math.max(0.4, value));
  let toR: number;
  let toG: number;
  let toB: number;
  let t: number;
  if (clamped >= mid) {
    toR = 27;
    toG = 132;
    toB = 60;
    t = (clamped - mid) / (1 - mid);
  } else {
    toR = 194;
    toG = 55;
    toB = 64;
    t = (mid - clamped) / (mid - 0.4);
  }
  const r = Math.round(244 + (toR - 244) * t);
  const g = Math.round(241 + (toG - 241) * t);
  const b = Math.round(234 + (toB - 234) * t);
  return `rgb(${r},${g},${b})`;
}

function renderMethods(): string {
  const buttons = (Object.keys(METHOD_LABELS) as Method[])
    .map(
      (key) =>
        `<button class="method-btn${key === method ? ' active' : ''}" data-method="${key}">${METHOD_LABELS[key]}</button>`,
    )
    .join('');
  return `<div class="methods"><span class="methods-label">Matrix algorithm</span>${buttons}</div>`;
}

function renderLegend(): string {
  const items = GROUPS.map(
    (group) =>
      `<span class="legend-item"><span class="legend-swatch" style="background:${group.color}"></span>${group.label}</span>`,
  ).join('');
  return `<div class="legend">${items}</div>`;
}

function renderMatrix(): void {
  const container = document.querySelector('#matrix');
  if (!container) return;
  const grid = activeGrid();
  const header = `<tr><th></th>${spectra
    .map(
      (s, i) =>
        `<th class="col" data-index="${i}" style="border-bottom:3px solid ${s.group.color};color:${s.group.color}">${i + 1}</th>`,
    )
    .join('')}</tr>`;
  const body = spectra
    .map((rowSpectrum, i) => {
      const rowSelected =
        mode === 'ranked' && i === rankAnchor ? ' selected' : '';
      const label = `<th class="rowlabel${rowSelected}" data-index="${i}" style="border-left:5px solid ${rowSpectrum.group.color};background:${rowSpectrum.group.background}">${i + 1}. ${metaOf(rowSpectrum.name).label}</th>`;
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
  container.innerHTML = `${renderMethods()}${renderLegend()}<table class="matrix">${header}${body}</table>`;
}

function renderStats(): void {
  const container = document.querySelector('#stats');
  if (!container) return;
  const entries = spectra
    .map((spectrum, index) => ({ spectrum, index }))
    .filter(({ spectrum }) => spectrum.group.stats);

  const grid = activeGrid();
  let sumSimilarity = 0;
  let sumError = 0;
  const rows = entries
    .map(({ spectrum, index }) => {
      const similarityToClean = grid[index]?.[cleanIndex] ?? 0;
      const error = peakLocalizationError(nodeCenters(spectrum));
      sumSimilarity += similarityToClean;
      sumError += error;
      return `<tr>
        <td class="s-name" style="border-left:4px solid ${spectrum.group.color}">${metaOf(spectrum.name).label}</td>
        <td class="s-num">${similarityToClean.toFixed(3)}</td>
        <td class="s-num">${error.toFixed(4)}</td>
      </tr>`;
    })
    .join('');
  const count = entries.length || 1;

  container.innerHTML = `
    <div class="stats-title">Quality — green + blue set (${entries.length})</div>
    <div class="stats-sub">
      All share true peaks at 2 / 5 / 8 ppm. <b>Sim→clean</b> is the
      <i>${METHOD_LABELS[method]}</i> similarity to the clean spectrum;
      <b>Peak err</b> is the mean ppm gap from each true peak to the nearest
      center-of-mass tree node — the localization criterion to drive down.
    </div>
    <table class="stats-table">
      <tr><th>Spectrum</th><th>Sim→clean</th><th>Peak err (ppm)</th></tr>
      ${rows}
      <tr class="stats-mean">
        <th>Mean</th>
        <td>${(sumSimilarity / count).toFixed(3)}</td>
        <td>${(sumError / count).toFixed(4)}</td>
      </tr>
    </table>`;
}

function renderRankingList(anchor: number): string {
  const anchorSpectrum = spectra[anchor];
  if (!anchorSpectrum) return '';
  const rows = rankingFor(anchor)
    .map((entry, rank) => {
      const sp = spectra[entry.index];
      if (!sp) return '';
      const isAnchor = entry.index === anchor;
      const isSelected = entry.index === selB ? ' selected' : '';
      const selfTag = isAnchor ? ' <span class="muted">(self)</span>' : '';
      return `<tr class="rank-row${isSelected}" data-index="${entry.index}">
        <td class="rank-num">${rank + 1}</td>
        <td class="rank-name" style="border-left:4px solid ${sp.group.color}">${metaOf(sp.name).label}${selfTag}</td>
        <td class="rank-val" style="background:${cellColor(entry.value)}">${entry.value.toFixed(3)}</td>
      </tr>`;
    })
    .join('');
  return `<div class="rank-panel">
      <div class="rank-title">Samples ranked by similarity to <b>${metaOf(anchorSpectrum.name).label}</b> <span class="muted">(${METHOD_LABELS[method]})</span></div>
      <div class="rank-hint">Click a row to view the two spectra below.</div>
      <table class="rank-table">${rows}</table>
    </div>`;
}

function pairPlotsHtml(): string {
  const a = spectra[selA];
  const b = spectra[selB];
  if (!a || !b) return '';
  const value = (activeGrid()[selA]?.[selB] ?? 0).toFixed(3);
  return (
    `<div class="pair-info">Similarity <b>${value}</b> <span class="muted">(${METHOD_LABELS[method]})</span> — ${metaOf(a.name).label} vs ${metaOf(b.name).label}</div>` +
    `<div class="plot" data-plot>${drawPlotSvg(a)}</div>` +
    `<div class="plot" data-plot>${drawPlotSvg(b)}</div>`
  );
}

function renderRanking(): void {
  const container = document.querySelector('#ranking');
  if (!container) return;
  container.innerHTML = mode === 'ranked' ? renderRankingList(rankAnchor) : '';
}

function renderPlots(): void {
  const container = document.querySelector('#plots');
  if (!container) return;
  container.innerHTML = pairPlotsHtml();
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

function showTooltip(spectrum: Spectrum, event: MouseEvent): void {
  const tooltip = document.querySelector('#tooltip');
  if (!tooltip) return;
  const meta = metaOf(spectrum.name);
  tooltip.innerHTML =
    `<div class="tt-title" style="color:${spectrum.group.color}">${meta.label}</div>` +
    `<div class="tt-file">${shortName(spectrum.name)} · ${spectrum.group.label}</div>` +
    `<div class="tt-desc">${meta.description}</div>`;
  tooltip.style.display = 'block';
  const x = Math.min(
    event.clientX + 14,
    window.innerWidth - tooltip.offsetWidth - 8,
  );
  const y = Math.min(
    event.clientY + 14,
    window.innerHeight - tooltip.offsetHeight - 8,
  );
  tooltip.style.left = `${Math.max(4, x)}px`;
  tooltip.style.top = `${Math.max(4, y)}px`;
}

function hideTooltip(): void {
  const tooltip = document.querySelector('#tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

function spectrumFromLabel(target: HTMLElement): Spectrum | undefined {
  const label = target.closest('.rowlabel, .col');
  if (!label) return undefined;
  return spectra[Number(label.dataset.index)];
}

function init(): void {
  const matrix = document.querySelector('#matrix');
  matrix?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const methodButton = target.closest('.method-btn');
    if (methodButton) {
      method = (methodButton as HTMLElement).dataset.method as Method;
      if (mode === 'ranked') selectAnchor(rankAnchor);
      hideTooltip();
      renderMatrix();
      renderStats();
      renderRanking();
      renderPlots();
      return;
    }
    const cell = target.closest('td.cell');
    if (cell) {
      mode = 'pair';
      selA = Number(cell.dataset.i);
      selB = Number(cell.dataset.j);
    } else {
      const label = target.closest('.rowlabel, .col');
      if (!label) return;
      selectAnchor(Number(label.dataset.index));
    }
    hideTooltip();
    resetView();
    renderMatrix();
    renderRanking();
    renderPlots();
  });
  matrix?.addEventListener('mousemove', (event) => {
    const spectrum = spectrumFromLabel(event.target as HTMLElement);
    if (spectrum) {
      showTooltip(spectrum, event as MouseEvent);
    } else {
      hideTooltip();
    }
  });
  matrix?.addEventListener('mouseleave', hideTooltip);
  const ranking = document.querySelector('#ranking');
  ranking?.addEventListener('click', (event) => {
    const row = (event.target as HTMLElement).closest('.rank-row');
    if (!row) return;
    selB = Number((row as HTMLElement).dataset.index);
    resetView();
    renderMatrix();
    renderRanking();
    renderPlots();
  });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  resetView();
  renderMatrix();
  renderStats();
  renderRanking();
  renderPlots();
}

init();
