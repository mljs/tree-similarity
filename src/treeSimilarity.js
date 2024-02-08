/**
 * Similarity between two nodes
 * @param {Tree} a - tree A node
 * @param {Tree} b - tree B node
 * @param {Record<string>} [options]
 * @return {number} similarity measure between tree nodes
 */
export function treeSimilarity(a, b, options = {}) {
  const { alpha = 0.1, beta = 0.33, gamma = 0.001 } = options;

  if (!isTree(a) || !isTree(b)) {
    throw new Error('tree similarity expects tree as inputs');
  }

  if (a.sum === 0 && b.sum === 0) {
    return 1;
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

function isTree(a) {
  return ['sum', 'center', 'left', 'right'].every((key) => key in a);
}
