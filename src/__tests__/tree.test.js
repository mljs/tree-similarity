import { describe, it, expect } from 'vitest';

import { createTree, treeSimilarity } from '../index';

const a = {
  x: [1, 2, 3, 4, 5, 6, 7],
  y: [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3],
};
const b = {
  x: [1, 2, 3, 4, 5, 6, 7],
  y: [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3],
};

describe('Tree similarity', () => {
  it('should work with two arrays', () => {
    expect(treeSimilarity(createTree(a), createTree(b))).toBeCloseTo(
      0.653354,
      4,
    );
  });
});
