import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { fromJSON } from 'convert-to-jcamp';
import { generateSpectrum } from 'spectrum-generator';

interface Example {
  /** file name without extension */
  name: string;
  /** human readable title stored in the jcamp */
  title: string;
  /** gaussian peaks as [x, height, fwhm] */
  peaks: Array<[number, number, number]>;
  /** noise standard deviation as a percentage of the peak height */
  noisePercent: number;
  /** seed of the noise generator */
  seed: number;
  /** x range and sampling; defaults to `generatorOptions` (0 to 10, 10001 points) */
  generator?: { from: number; to: number; nbPoints: number };
  /**
   * when set, this spectrum is a subsample of a previously listed spectrum
   * (keeping every `subsampleStep`-th point) instead of a freshly generated one,
   * so peaks and noise are identical and only the point count changes
   */
  subsampleOf?: string;
  /** keep one point every `subsampleStep` when `subsampleOf` is set */
  subsampleStep?: number;
  /** optional baseline distortion added to every y value */
  baseline?: Baseline;
}

type Baseline =
  | { kind: 'linear'; intercept: number; slope: number }
  | { kind: 'parabolic'; a: number; center: number; offset: number };

function baselineValue(baseline: Baseline, x: number): number {
  return baseline.kind === 'linear'
    ? baseline.intercept + baseline.slope * x
    : baseline.a * (x - baseline.center) ** 2 + baseline.offset;
}

const generatorOptions = { from: 0, to: 10, nbPoints: 10001 };

const examples: Example[] = [
  {
    name: '01-three-peaks-clean',
    title: 'Three peaks, no noise',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 0,
    seed: 0,
  },
  {
    name: '02-three-peaks-noise-a',
    title: 'Three peaks, 5% noise (a)',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 0,
  },
  {
    name: '03-three-peaks-noise-b',
    title: 'Three peaks, 5% noise (b)',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 42,
  },
  {
    name: '04-three-peaks-noise-high',
    title: 'Three peaks, 20% noise',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 20,
    seed: 1,
  },
  {
    name: '05-three-peaks-global-shift',
    title: 'Three peaks shifted by -1 ppm, 5% noise',
    peaks: [
      [1, 100, 0.05],
      [4, 100, 0.05],
      [7, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 2,
  },
  {
    name: '06-three-peaks-local-shift',
    title: 'Three peaks, last one moved to 8.4 ppm, 5% noise',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8.4, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 3,
  },
  {
    name: '07-two-peaks',
    title: 'Two peaks (missing middle), 5% noise',
    peaks: [
      [2, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 4,
  },
  {
    name: '08-four-peaks',
    title: 'Four peaks, 5% noise',
    peaks: [
      [2, 100, 0.05],
      [4, 100, 0.05],
      [6, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 5,
  },
  {
    name: '09-three-peaks-heights',
    title: 'Three peaks with heights 100/50/25, 5% noise',
    peaks: [
      [2, 100, 0.05],
      [5, 50, 0.05],
      [8, 25, 0.05],
    ],
    noisePercent: 5,
    seed: 6,
  },
  {
    name: '10-three-peaks-fwhm-0p01',
    title: 'Three peaks, fwhm 0.01, 1% noise',
    peaks: [
      [2, 100, 0.01],
      [5, 100, 0.01],
      [8, 100, 0.01],
    ],
    noisePercent: 1,
    seed: 20,
  },
  {
    name: '11-three-peaks-1to9-dense',
    title: 'Three peaks over 1-9 ppm, 10001 points, 5% noise',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 8,
    generator: { from: 1, to: 9, nbPoints: 10001 },
  },
  {
    name: '12-three-peaks-1to9-sparse',
    title: 'Three peaks over 1-9 ppm, 2001 points, subsampled from 11',
    // Every 5th point of 11 (10001 -> 2001), so peaks and noise are identical
    // and the pair isolates robustness to the point count alone.
    peaks: [],
    noisePercent: 5,
    seed: 8,
    subsampleOf: '11-three-peaks-1to9-dense',
    subsampleStep: 5,
  },
  {
    name: '13-three-peaks-tiny-extras',
    title: 'Three peaks plus two 5% peaks at 3.5 and 6.5 ppm, 5% noise',
    peaks: [
      [2, 100, 0.05],
      [3.5, 5, 0.05],
      [5, 100, 0.05],
      [6.5, 5, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 42,
  },
  {
    name: '14-three-peaks-fwhm-0p02',
    title: 'Three peaks, fwhm 0.02, 1% noise',
    peaks: [
      [2, 100, 0.02],
      [5, 100, 0.02],
      [8, 100, 0.02],
    ],
    noisePercent: 1,
    seed: 21,
  },
  {
    name: '15-three-peaks-fwhm-0p1',
    title: 'Three peaks, fwhm 0.1, 1% noise',
    peaks: [
      [2, 100, 0.1],
      [5, 100, 0.1],
      [8, 100, 0.1],
    ],
    noisePercent: 1,
    seed: 22,
  },
  {
    name: '16-three-peaks-linear-baseline',
    title: 'Three peaks with a linear sloping baseline, 5% noise',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 11,
    baseline: { kind: 'linear', intercept: 5, slope: 3 },
  },
  {
    name: '17-three-peaks-parabolic-baseline',
    title: 'Three peaks with a parabolic (bowl) baseline, 5% noise',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 5,
    seed: 12,
    baseline: { kind: 'parabolic', a: 0.8, center: 5, offset: 0 },
  },
  {
    name: '18-three-peaks-noise-1pct-a',
    title: 'Three peaks, 1% noise (a)',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 1,
    seed: 13,
  },
  {
    name: '19-three-peaks-noise-1pct-b',
    title: 'Three peaks, 1% noise (b)',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 1,
    seed: 14,
  },
  {
    name: '20-three-peaks-tiny-extras-1pct',
    title: 'Three peaks plus two 5% peaks at 3.5 and 6.5 ppm, 1% noise',
    peaks: [
      [2, 100, 0.05],
      [3.5, 5, 0.05],
      [5, 100, 0.05],
      [6.5, 5, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 1,
    seed: 15,
  },
  {
    name: '21-three-peaks-1pct-100001pts',
    title: 'Three peaks, 1% noise, 100001 points',
    peaks: [
      [2, 100, 0.05],
      [5, 100, 0.05],
      [8, 100, 0.05],
    ],
    noisePercent: 1,
    seed: 16,
    generator: { from: 0, to: 10, nbPoints: 100001 },
  },
  {
    name: '22-three-peaks-1pct-1001pts',
    title: 'Three peaks, 1% noise, 1001 points, subsampled from 21',
    // Every 100th point of 21 (100001 -> 1001), same peaks and noise, so 21 vs
    // 22 isolates a 100x change in point count at low noise.
    peaks: [],
    noisePercent: 1,
    seed: 16,
    subsampleOf: '21-three-peaks-1pct-100001pts',
    subsampleStep: 100,
  },
];

const dataDir = join(import.meta.dirname, '..', 'src', '__tests__', 'data');
mkdirSync(dataDir, { recursive: true });

const generated = new Map<string, { x: number[]; y: number[] }>();

for (const example of examples) {
  let x: number[];
  let y: number[];
  if (example.subsampleOf) {
    const source = generated.get(example.subsampleOf);
    if (!source) {
      throw new Error(`unknown subsample source ${example.subsampleOf}`);
    }
    const step = example.subsampleStep ?? 1;
    x = [];
    y = [];
    for (let i = 0; i < source.x.length; i += step) {
      x.push(source.x[i] as number);
      y.push(source.y[i] as number);
    }
  } else {
    const spectrum = generateSpectrum(example.peaks, {
      generator: example.generator ?? generatorOptions,
      noise:
        example.noisePercent > 0
          ? {
              distribution: 'normal',
              percent: example.noisePercent,
              seed: example.seed,
            }
          : undefined,
    });
    x = Array.from(spectrum.x);
    y = Array.from(spectrum.y);
  }
  if (example.baseline) {
    for (let i = 0; i < x.length; i++) {
      y[i] = (y[i] as number) + baselineValue(example.baseline, x[i] as number);
    }
  }
  generated.set(example.name, { x, y });

  const jcamp = fromJSON(
    { x, y },
    {
      xyEncoding: 'DIFDUP',
      info: {
        title: example.title,
        dataType: 'NMR SPECTRUM',
        xUnits: 'ppm',
        yUnits: 'arbitrary',
      },
    },
  );

  const file = join(dataDir, `${example.name}.jdx`);
  writeFileSync(file, jcamp);
  // eslint-disable-next-line no-console -- generation script feedback
  console.log(`${example.name}.jdx  (${jcamp.length} bytes)`);
}
