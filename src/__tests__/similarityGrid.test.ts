import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import type { Tree } from '../index.ts';
import { createTree } from '../index.ts';
import { treeSimilarity } from '../treeSimilarity.ts';

import { parseSpectrum } from './parseSpectrum.ts';

const dataDir = join(import.meta.dirname, 'data');

const files = readdirSync(dataDir)
  .filter((name) => /\.(?:jdx|dx|jcamp)$/i.test(name))
  .toSorted();

const shortName = (file: string) => file.replace(/\.(?:jdx|dx|jcamp)$/i, '');

const trees = new Map<string, Tree | null>();
for (const file of files) {
  const jcamp = readFileSync(join(dataDir, file), 'latin1');
  trees.set(file, createTree(parseSpectrum(jcamp)));
}

// Similarity normalized so that a spectrum compared with itself is 1.
function similarity(a: string, b: string): number {
  const treeA = trees.get(a) ?? null;
  const treeB = trees.get(b) ?? null;
  const selfA = treeSimilarity(treeA, treeA);
  const selfB = treeSimilarity(treeB, treeB);
  if (selfA === 0 || selfB === 0) return 0;
  return treeSimilarity(treeA, treeB) / Math.sqrt(selfA * selfB);
}

// Normalized similarity between every pair of committed spectra (10 generated
// + real NMR). Update these values if createTree or treeSimilarity change.
const EXPECTED: Record<string, Record<string, number>> = {
  '01-three-peaks-clean': {
    '01-three-peaks-clean': 1,
    '02-three-peaks-noise-a': 0.9146,
    '03-three-peaks-noise-b': 0.8883,
    '04-three-peaks-noise-high': 0.8524,
    '05-three-peaks-global-shift': 0.8982,
    '06-three-peaks-local-shift': 0.9021,
    '07-two-peaks': 0.8954,
    '08-four-peaks': 0.901,
    '09-three-peaks-heights': 0.8443,
    '10-three-peaks-broad': 0.8086,
    aspirin: 0.8262,
    cyclosporin: 0.7871,
    cytisin: 0.8064,
    ethylvinylether: 0.8478,
  },
  '02-three-peaks-noise-a': {
    '01-three-peaks-clean': 0.9146,
    '02-three-peaks-noise-a': 1,
    '03-three-peaks-noise-b': 0.9269,
    '04-three-peaks-noise-high': 0.9193,
    '05-three-peaks-global-shift': 0.927,
    '06-three-peaks-local-shift': 0.9361,
    '07-two-peaks': 0.8845,
    '08-four-peaks': 0.9226,
    '09-three-peaks-heights': 0.9168,
    '10-three-peaks-broad': 0.8709,
    aspirin: 0.8565,
    cyclosporin: 0.839,
    cytisin: 0.8651,
    ethylvinylether: 0.8543,
  },
  '03-three-peaks-noise-b': {
    '01-three-peaks-clean': 0.8883,
    '02-three-peaks-noise-a': 0.9269,
    '03-three-peaks-noise-b': 1,
    '04-three-peaks-noise-high': 0.9317,
    '05-three-peaks-global-shift': 0.957,
    '06-three-peaks-local-shift': 0.9343,
    '07-two-peaks': 0.8734,
    '08-four-peaks': 0.9132,
    '09-three-peaks-heights': 0.9065,
    '10-three-peaks-broad': 0.8648,
    aspirin: 0.8885,
    cyclosporin: 0.8683,
    cytisin: 0.8684,
    ethylvinylether: 0.8301,
  },
  '04-three-peaks-noise-high': {
    '01-three-peaks-clean': 0.8524,
    '02-three-peaks-noise-a': 0.9193,
    '03-three-peaks-noise-b': 0.9317,
    '04-three-peaks-noise-high': 1,
    '05-three-peaks-global-shift': 0.9282,
    '06-three-peaks-local-shift': 0.916,
    '07-two-peaks': 0.8508,
    '08-four-peaks': 0.9058,
    '09-three-peaks-heights': 0.9289,
    '10-three-peaks-broad': 0.8749,
    aspirin: 0.8585,
    cyclosporin: 0.8814,
    cytisin: 0.8834,
    ethylvinylether: 0.8036,
  },
  '05-three-peaks-global-shift': {
    '01-three-peaks-clean': 0.8982,
    '02-three-peaks-noise-a': 0.927,
    '03-three-peaks-noise-b': 0.957,
    '04-three-peaks-noise-high': 0.9282,
    '05-three-peaks-global-shift': 1,
    '06-three-peaks-local-shift': 0.9268,
    '07-two-peaks': 0.8852,
    '08-four-peaks': 0.9408,
    '09-three-peaks-heights': 0.9069,
    '10-three-peaks-broad': 0.8756,
    aspirin: 0.8739,
    cyclosporin: 0.8603,
    cytisin: 0.8662,
    ethylvinylether: 0.8249,
  },
  '06-three-peaks-local-shift': {
    '01-three-peaks-clean': 0.9021,
    '02-three-peaks-noise-a': 0.9361,
    '03-three-peaks-noise-b': 0.9343,
    '04-three-peaks-noise-high': 0.916,
    '05-three-peaks-global-shift': 0.9268,
    '06-three-peaks-local-shift': 1,
    '07-two-peaks': 0.878,
    '08-four-peaks': 0.9311,
    '09-three-peaks-heights': 0.9062,
    '10-three-peaks-broad': 0.8502,
    aspirin: 0.8795,
    cyclosporin: 0.8458,
    cytisin: 0.8572,
    ethylvinylether: 0.831,
  },
  '07-two-peaks': {
    '01-three-peaks-clean': 0.8954,
    '02-three-peaks-noise-a': 0.8845,
    '03-three-peaks-noise-b': 0.8734,
    '04-three-peaks-noise-high': 0.8508,
    '05-three-peaks-global-shift': 0.8852,
    '06-three-peaks-local-shift': 0.878,
    '07-two-peaks': 1,
    '08-four-peaks': 0.8763,
    '09-three-peaks-heights': 0.8788,
    '10-three-peaks-broad': 0.8091,
    aspirin: 0.8445,
    cyclosporin: 0.7839,
    cytisin: 0.8041,
    ethylvinylether: 0.9003,
  },
  '08-four-peaks': {
    '01-three-peaks-clean': 0.901,
    '02-three-peaks-noise-a': 0.9226,
    '03-three-peaks-noise-b': 0.9132,
    '04-three-peaks-noise-high': 0.9058,
    '05-three-peaks-global-shift': 0.9408,
    '06-three-peaks-local-shift': 0.9311,
    '07-two-peaks': 0.8763,
    '08-four-peaks': 1,
    '09-three-peaks-heights': 0.915,
    '10-three-peaks-broad': 0.8809,
    aspirin: 0.8571,
    cyclosporin: 0.8642,
    cytisin: 0.8827,
    ethylvinylether: 0.8227,
  },
  '09-three-peaks-heights': {
    '01-three-peaks-clean': 0.8443,
    '02-three-peaks-noise-a': 0.9168,
    '03-three-peaks-noise-b': 0.9065,
    '04-three-peaks-noise-high': 0.9289,
    '05-three-peaks-global-shift': 0.9069,
    '06-three-peaks-local-shift': 0.9062,
    '07-two-peaks': 0.8788,
    '08-four-peaks': 0.915,
    '09-three-peaks-heights': 1,
    '10-three-peaks-broad': 0.879,
    aspirin: 0.8591,
    cyclosporin: 0.871,
    cytisin: 0.8875,
    ethylvinylether: 0.8246,
  },
  '10-three-peaks-broad': {
    '01-three-peaks-clean': 0.8086,
    '02-three-peaks-noise-a': 0.8709,
    '03-three-peaks-noise-b': 0.8648,
    '04-three-peaks-noise-high': 0.8749,
    '05-three-peaks-global-shift': 0.8756,
    '06-three-peaks-local-shift': 0.8502,
    '07-two-peaks': 0.8091,
    '08-four-peaks': 0.8809,
    '09-three-peaks-heights': 0.879,
    '10-three-peaks-broad': 1,
    aspirin: 0.8278,
    cyclosporin: 0.912,
    cytisin: 0.9359,
    ethylvinylether: 0.8003,
  },
  aspirin: {
    '01-three-peaks-clean': 0.8262,
    '02-three-peaks-noise-a': 0.8565,
    '03-three-peaks-noise-b': 0.8885,
    '04-three-peaks-noise-high': 0.8585,
    '05-three-peaks-global-shift': 0.8739,
    '06-three-peaks-local-shift': 0.8795,
    '07-two-peaks': 0.8445,
    '08-four-peaks': 0.8571,
    '09-three-peaks-heights': 0.8591,
    '10-three-peaks-broad': 0.8278,
    aspirin: 1,
    cyclosporin: 0.8437,
    cytisin: 0.8473,
    ethylvinylether: 0.8605,
  },
  cyclosporin: {
    '01-three-peaks-clean': 0.7871,
    '02-three-peaks-noise-a': 0.839,
    '03-three-peaks-noise-b': 0.8683,
    '04-three-peaks-noise-high': 0.8814,
    '05-three-peaks-global-shift': 0.8603,
    '06-three-peaks-local-shift': 0.8458,
    '07-two-peaks': 0.7839,
    '08-four-peaks': 0.8642,
    '09-three-peaks-heights': 0.871,
    '10-three-peaks-broad': 0.912,
    aspirin: 0.8437,
    cyclosporin: 1,
    cytisin: 0.9426,
    ethylvinylether: 0.7727,
  },
  cytisin: {
    '01-three-peaks-clean': 0.8064,
    '02-three-peaks-noise-a': 0.8651,
    '03-three-peaks-noise-b': 0.8684,
    '04-three-peaks-noise-high': 0.8834,
    '05-three-peaks-global-shift': 0.8662,
    '06-three-peaks-local-shift': 0.8572,
    '07-two-peaks': 0.8041,
    '08-four-peaks': 0.8827,
    '09-three-peaks-heights': 0.8875,
    '10-three-peaks-broad': 0.9359,
    aspirin: 0.8473,
    cyclosporin: 0.9426,
    cytisin: 1,
    ethylvinylether: 0.7935,
  },
  ethylvinylether: {
    '01-three-peaks-clean': 0.8478,
    '02-three-peaks-noise-a': 0.8543,
    '03-three-peaks-noise-b': 0.8301,
    '04-three-peaks-noise-high': 0.8036,
    '05-three-peaks-global-shift': 0.8249,
    '06-three-peaks-local-shift': 0.831,
    '07-two-peaks': 0.9003,
    '08-four-peaks': 0.8227,
    '09-three-peaks-heights': 0.8246,
    '10-three-peaks-broad': 0.8003,
    aspirin: 0.8605,
    cyclosporin: 0.7727,
    cytisin: 0.7935,
    ethylvinylether: 1,
  },
};

test('every data file parses and builds a non-empty tree', () => {
  expect(files.map(shortName)).toStrictEqual(Object.keys(EXPECTED));

  for (const file of files) {
    expect(trees.get(file)).not.toBeNull();
  }
});

test('a spectrum is perfectly similar to itself', () => {
  for (const file of files) {
    expect(similarity(file, file)).toBeCloseTo(1, 10);
  }
});

test('the similarity is symmetric', () => {
  for (const a of files) {
    for (const b of files) {
      expect(Math.abs(similarity(a, b) - similarity(b, a))).toBeLessThan(1e-12);
    }
  }
});

test('the full similarity grid matches the reference values', () => {
  const actual: Record<string, Record<string, number>> = {};
  const expected: Record<string, Record<string, unknown>> = {};
  for (const a of files) {
    const sa = shortName(a);
    actual[sa] = {};
    expected[sa] = {};
    for (const b of files) {
      const sb = shortName(b);
      actual[sa][sb] = similarity(a, b);
      expected[sa][sb] = expect.closeTo(EXPECTED[sa]?.[sb] ?? Number.NaN, 2);
    }
  }

  expect(actual).toStrictEqual(expected);
});

test('a 1 ppm global shift degrades similarity more than 5% noise', () => {
  // With sharp peaks (fwhm 0.05) a 1 ppm shift moves each peak far enough off
  // its original position to hurt similarity more than random 5% noise does.
  expect(
    similarity('01-three-peaks-clean.jdx', '02-three-peaks-noise-a.jdx'),
  ).toBeGreaterThan(
    similarity('01-three-peaks-clean.jdx', '05-three-peaks-global-shift.jdx'),
  );
});
