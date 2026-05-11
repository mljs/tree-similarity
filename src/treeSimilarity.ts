import { Tree } from './createTree';

export interface TreeSimilarityOptions {
  alpha?: number;
  beta?: number;
  gamma?: number;
  /**
   * If true use `xMassCenterVectorSimilarity` fast aggregated path (approximate).
   * Default: false (exact, per-node recursion parity).
   */
  useXVectorSimilarity?: boolean;
}

/**
 * Similarity between two nodes (vector-backed implementation)
 * - Default: exact parity with original recursive formula
 * - Optional fast/approximate path via `xMassCenterVectorSimilarity`
 * @param treeA
 * @param treeB
 * @param options
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

  if (treeA.sum === 0 && treeB.sum === 0) return 1;

  // compute depths and allocate full binary arrays (heap-style indexing)
  const depthA = getTreeDepth(treeA);
  const depthB = getTreeDepth(treeB);
  const depth = Math.max(depthA, depthB);
  const size = (1 << depth) - 1;

  const centersA = new Float64Array(size).fill(Number.NaN);
  const centersB = new Float64Array(size).fill(Number.NaN);
  const sumsA = new Float64Array(size).fill(Number.NaN);
  const sumsB = new Float64Array(size).fill(Number.NaN);

  fillArrays(treeA, 0, centersA, sumsA);
  fillArrays(treeB, 0, centersB, sumsB);

  // exact parity path: compute per-node C and aggregate bottom-up to reproduce recursive formula
  const S = new Float64Array(size).fill(0);

  for (let i = size - 1; i >= 0; i--) {
    const aSum = sumsA[i];
    const bSum = sumsB[i];

    if (!Number.isFinite(aSum) || !Number.isFinite(bSum)) {
      S[i] = 0;
      continue;
    }

    if (aSum === 0 && bSum === 0) {
      S[i] = 1;
      continue;
    }

    const aCenter = centersA[i];
    const bCenter = centersB[i];
    const C =
      (alpha * Math.min(aSum, bSum)) / Math.max(aSum, bSum) +
      (1 - alpha) * Math.exp(-gamma * Math.abs(aCenter - bCenter));

    const left = 2 * i + 1;
    const right = left + 1;
    const sl = left < size ? S[left] : 0;
    const sr = right < size ? S[right] : 0;
    S[i] = beta * C + ((1 - beta) * (sl + sr)) / 2;
  }

  return S[0];
}

function getTreeDepth(tree: Tree | null): number {
  if (tree === null) return 0;
  return 1 + Math.max(getTreeDepth(tree.left), getTreeDepth(tree.right));
}

function fillArrays(
  tree: Tree,
  index: number,
  centers: Float64Array,
  sums: Float64Array,
): void {
  const size = centers.length;
  const stack: Array<{ node: Tree; idx: number }> = [];
  stack.push({ node: tree, idx: index });

  while (stack.length > 0) {
    //@ts-expect-error stack is non-empty, so pop will return a value
    const { node, idx } = stack.pop();
    if (idx >= size) continue;
    if (!node) {
      centers[idx] = Number.NaN;
      sums[idx] = Number.NaN;
      continue;
    }

    centers[idx] = node.center;
    sums[idx] = node.sum;

    const leftIdx = 2 * idx + 1;
    const rightIdx = leftIdx + 1;
    // push right first so left is processed next (mirrors typical recursion order)
    if (rightIdx < size) stack.push({ node: node.right, idx: rightIdx });
    if (leftIdx < size) stack.push({ node: node.left, idx: leftIdx });
  }
}

function isTree(tree: object): tree is Tree {
  return ['sum', 'center', 'left', 'right'].every((key) => key in tree);
}
