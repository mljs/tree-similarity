import { Tree } from './createTree';

export interface TreeSimilarityOptions {
  alpha?: number;
  beta?: number;
  gamma?: number;
}

/**
 * Similarity between two nodes
 * @return similarity measure between tree nodes
 */
export function treeSimilarity(
  treeA: Tree | null,
  treeB: Tree | null,
  options: TreeSimilarityOptions = {},
): number {
  const { alpha = 0.1, beta = 0.33, gamma = 0.001 } = options;

  if (treeA === null || treeB === null) {
    return 0;
  }

  if (!isTree(treeA) || !isTree(treeB)) {
    throw new Error('tree similarity expects tree as inputs');
  }

  if (treeA.sum === 0 && treeB.sum === 0) {
    return 1;
  }

  const C =
    (alpha * Math.min(treeA.sum, treeB.sum)) / Math.max(treeA.sum, treeB.sum) +
    (1 - alpha) * Math.exp(-gamma * Math.abs(treeA.center - treeB.center));

  return (
    beta * C +
    ((1 - beta) *
      (treeSimilarity(treeA.left, treeB.left, options) +
        treeSimilarity(treeA.right, treeB.right, options))) /
      2
  );
}

function isTree(tree: object): tree is Tree {
  return ['sum', 'center', 'left', 'right'].every((key) => key in tree);
}
