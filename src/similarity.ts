import { DataXY } from 'cheminfo-types';
import {
  xyMassCenterVector,
  xMassCenterVectorSimilarity,
  xFindClosestIndex,
} from 'ml-spectra-processing';

export interface TreeSimilarityOptions {
  alpha?: number;
  beta?: number;
  gamma?: number;
  /** depth used by `xyMassCenterVector` when inputs are `DataXY` */
  depth?: number;
  /** if true use xMassCenterVectorSimilarity fast/approximate path */
  useXVectorSimilarity?: boolean;
  /** passed to xMassCenterVectorSimilarity */
  recenter?: boolean;
}

/**
 * - If given `DataXY` objects, it builds center/mass vectors (via `xyMassCenterVector`) and
 *   computes per-node sums to reproduce the original alpha/beta/gamma aggregation (exact parity).
 */
export function similarity(
  a: DataXY | null,
  b: DataXY | null,
  options: TreeSimilarityOptions = {},
): number {
  const {
    alpha = 0.1,
    beta = 0.33,
    gamma = 0.001,
    depth = 5,
    useXVectorSimilarity = false,
    recenter = true,
  } = options;

  // null handling (matches original behavior for tree inputs)
  if (a === null || b === null) return 0;

  const centersA = xyMassCenterVector(a, { depth });
  const centersB = xyMassCenterVector(b, { depth });
  console.log(centersA, 'centersA');
  const { integral: integralA } = getWeightedIntegral(a);
  const { integral: integralB } = getWeightedIntegral(b);

  const size = centersA.length;
  const sumsA = computeSumsFromCenters(a, centersA, integralA, depth);
  const sumsB = computeSumsFromCenters(b, centersB, integralB, depth);

  if (useXVectorSimilarity) {
    const massSim = xMassCenterVectorSimilarity(sumsA, sumsB, {
      recenter,
      similarityFct: (u: number, v: number) => {
        if (!isFinite(u) || !isFinite(v)) return 0;
        if (u === 0 && v === 0) return 1;
        if (u === 0 || v === 0) return 0;
        return Math.min(u, v) / Math.max(u, v);
      },
    });

    const centerSim = xMassCenterVectorSimilarity(centersA, centersB, {
      recenter,
      similarityFct: (u: number, v: number) => {
        if (!isFinite(u) || !isFinite(v)) return 0;
        return Math.exp(-gamma * Math.abs(u - v));
      },
    });

    return alpha * massSim + (1 - alpha) * centerSim;
  }

  // exact parity aggregation (bottom-up)
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

function getWeightedIntegral(data: DataXY) {
  const { x, y } = data;
  const weightedIntegral = new Float64Array(x.length);
  const integral = new Float64Array(x.length);
  // the first point, no points before
  const firstIntegration = (x[1] - x[0]) * y[0];
  let totalIntegration = firstIntegration;
  integral[0] = totalIntegration;
  let totalWeightedIntegral = firstIntegration * x[0];
  weightedIntegral[0] = totalWeightedIntegral;
  for (let i = 1; i < x.length - 1; i++) {
    const currentIntegration = ((x[i + 1] - x[i - 1]) * y[i]) / 2;
    const currentX = x[i];
    totalIntegration += currentIntegration;
    integral[i] = totalIntegration;
    totalWeightedIntegral += currentIntegration * currentX;
    weightedIntegral[i] = totalWeightedIntegral;
  }
  // the last point, no points after
  const lastIntegration = (x[x.length - 1] - x[x.length - 2]) * y[y.length - 1];
  totalIntegration += lastIntegration;
  integral[x.length - 1] = totalIntegration;
  totalWeightedIntegral += lastIntegration * x[x.length - 1];
  weightedIntegral[x.length - 1] = totalWeightedIntegral;
  return { integral, weightedIntegral };
}

function computeSumsFromCenters(
  data: DataXY,
  centers: Float64Array,
  integral: Float64Array,
  depth: number,
): Float64Array {
  const size = centers.length;
  const endIndexes = new Int32Array(size);
  endIndexes[0] = data.x.length - 1;
  const beginIndexes = new Int32Array(size);
  beginIndexes[0] = -1;
  const sums = new Float64Array(size);

  let index = 0;
  for (let i = 0; i < depth; i++) {
    for (let j = 0; j < 1 << i; j++) {
      const currentBeginIndex = beginIndexes[index];
      const currentEndIndex = endIndexes[index];
      const currentIntegration =
        currentBeginIndex === -1
          ? integral[currentEndIndex]
          : integral[currentEndIndex] - integral[currentBeginIndex];

      sums[index] = currentIntegration;

      if (i < depth - 1) {
        const nextIndex = (1 << (i + 1)) + j * 2 - 1;
        let middleIndex = xFindClosestIndex(data.x, centers[index]);
        if (middleIndex === currentBeginIndex) {
          middleIndex++;
        }
        beginIndexes[nextIndex] = currentBeginIndex;
        endIndexes[nextIndex] = middleIndex;
        if (middleIndex === currentEndIndex) {
          middleIndex--;
        }
        beginIndexes[nextIndex + 1] = middleIndex;
        endIndexes[nextIndex + 1] = currentEndIndex;
      }
      index++;
    }
  }

  return sums;
}
