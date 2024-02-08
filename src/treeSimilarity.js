import { createTree } from './createTree';

/**
 * Similarity between two nodes
 * @param {Tree|Array<Array<number>>} a - tree A node
 * @param {Tree|Array<Array<number>>} b - tree B node
 * @param {object} [options]
 * @return {number} similarity measure between tree nodes
 */
export function treeSimilarity(a, b, options = {}) {
  const { alpha = 0.1, beta = 0.33, gamma = 0.001 } = options;

  if (a === null || b === null) {
    return 0;
  }
  if (Array.isArray(a)) {
    a = createTree(a);
  }
  if (Array.isArray(b)) {
    b = createTree(b);
  }

  const C =
    (alpha * Math.min(a.sum, b.sum)) / Math.max(a.sum, b.sum) +
    (1 - alpha) * Math.exp(-gamma * Math.abs(a.center - b.center));

  return (
    beta * C +
    ((1 - beta) *
      (treeSimilarity(a.left, b.left, options) +
        treeSimilarity(a.right, b.right, options))) /
      2
  );
}
