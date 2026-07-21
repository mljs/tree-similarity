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
    name: '10-three-peaks-broad',
    title: 'Three broad peaks (fwhm 0.3), 5% noise',
    peaks: [
      [2, 100, 0.3],
      [5, 100, 0.3],
      [8, 100, 0.3],
    ],
    noisePercent: 5,
    seed: 7,
  },
];

const dataDir = join(import.meta.dirname, '..', 'src', '__tests__', 'data');
mkdirSync(dataDir, { recursive: true });

for (const example of examples) {
  const spectrum = generateSpectrum(example.peaks, {
    generator: generatorOptions,
    noise:
      example.noisePercent > 0
        ? {
            distribution: 'normal',
            percent: example.noisePercent,
            seed: example.seed,
          }
        : undefined,
  });

  const jcamp = fromJSON(
    { x: spectrum.x, y: spectrum.y },
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
