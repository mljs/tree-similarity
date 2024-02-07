import { describe, it, expect } from 'vitest';

import { treeSimilarity, getFunction } from '..';

let a = [
  [1, 2, 3, 4, 5, 6, 7],
  [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3],
];
let b = [
  [1, 2, 3, 4, 5, 6, 7],
  [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3],
];

describe('Tree similarity', () => {
  it('should work with two arrays', () => {
    expect(treeSimilarity(a, b)).toBeCloseTo(0.653354, 4);
  });

  it('should currify the options', () => {
    let options = {
      alpha: 0.4,
      beta: 0.5,
      gamma: 0.001,
    };
    let func = getFunction(options);
    expect(func(a, b)).toBe(treeSimilarity(a, b, options));
  });
});
