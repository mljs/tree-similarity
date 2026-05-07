import { Tree } from './createTree';
import { xMassCenterVectorSimilarity } from 'ml-spectra-processing';

export interface TreeSimilarityOptions {
  alpha?: number;
  beta?: number;
  gamma?: number;
  /**
   * If true use `xMassCenterVectorSimilarity` fast aggregated path (approximate).
   * Default: false (exact, per-node recursion parity).
   */
  useXVectorSimilarity?: boolean;
  /**
   * Passed to `xMassCenterVectorSimilarity` when `useXVectorSimilarity` is true.
   */
  recenter?: boolean;
}

/**
 * Similarity between two nodes (vector-backed implementation)
 * - Default: exact parity with original recursive formula
 * - Optional fast/approximate path via `xMassCenterVectorSimilarity`
 */
export function newTreeSimilarity(
  treeA: Tree | null,
  treeB: Tree | null,
  options: TreeSimilarityOptions = {},
): number {
  const {
    alpha = 0.1,
    beta = 0.33,
    gamma = 0.001,
    useXVectorSimilarity = false,
    recenter = true,
  } = options;

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

  const centersA = new Float64Array(size).fill(NaN);
  const centersB = new Float64Array(size).fill(NaN);
  const sumsA = new Float64Array(size).fill(NaN);
  const sumsB = new Float64Array(size).fill(NaN);

  fillArrays(treeA, 0, centersA, sumsA);
  fillArrays(treeB, 0, centersB, sumsB);

  if (useXVectorSimilarity) {
    // approximate aggregated similarity using xMassCenterVectorSimilarity
    const massSim = xMassCenterVectorSimilarity(sumsA, sumsB, {
      recenter,
      similarityFct: (a: number, b: number) => {
        if (!isFinite(a) || !isFinite(b)) return 0;
        if (a === 0 && b === 0) return 1;
        if (a === 0 || b === 0) return 0;
        return Math.min(a, b) / Math.max(a, b);
      },
    });

    const centerSim = xMassCenterVectorSimilarity(centersA, centersB, {
      recenter,
      similarityFct: (a: number, b: number) => {
        if (!isFinite(a) || !isFinite(b)) return 0;
        return Math.exp(-gamma * Math.abs(a - b));
      },
    });

    return alpha * massSim + (1 - alpha) * centerSim;
  }

  // exact parity path: compute per-node C and aggregate bottom-up to reproduce recursive formula
  const S = new Float64Array(size).fill(0);

  for (let i = size - 1; i >= 0; i--) {
    const aSum = sumsA[i];
    const bSum = sumsB[i];

    if (!isFinite(aSum) || !isFinite(bSum)) {
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
  tree: Tree | null,
  index: number,
  centers: Float64Array,
  sums: Float64Array,
): void {
  if (index >= centers.length) return;
  if (tree === null) {
    centers[index] = NaN;
    sums[index] = NaN;
    return;
  }
  centers[index] = tree.center;
  sums[index] = tree.sum;
  fillArrays(tree.left, 2 * index + 1, centers, sums);
  fillArrays(tree.right, 2 * index + 2, centers, sums);
}

function isTree(tree: object): tree is Tree {
  return ['sum', 'center', 'left', 'right'].every((key) => key in tree);
}
