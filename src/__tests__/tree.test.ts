import { expect, test } from 'vitest';

import type { Tree } from '../index.ts';
import { createTree, treeSimilarity } from '../index.ts';

const a = {
  x: [1, 2, 3, 4, 5, 6, 7],
  y: [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3],
};
const b = {
  x: [1, 2, 3, 4, 5, 6, 7],
  y: [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3],
};

test('should work with two arrays', () => {
  expect(treeSimilarity(createTree(a), createTree(b))).toBeCloseTo(0.653354, 4);
});

test('should throw with wrong input', () => {
  expect(() => treeSimilarity(createTree(a), {} as Tree)).toThrow(
    'tree similarity expects tree as inputs',
  );
});
