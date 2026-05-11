import { DataXY } from 'cheminfo-types';
import {
  xyMassCenterVector,
  xMassCenterVectorSimilarity,
  xFindClosestIndex,
} from 'ml-spectra-processing';

export interface TreeSimilarityOptions {
  alpha?: number;
  gamma?: number;
  /** depth used by `xyMassCenterVector` when inputs are `DataXY` */
  depth?: number;
}

export function similarity(
  a: DataXY | null,
  b: DataXY | null,
  options: TreeSimilarityOptions = {},
): number {
  const {
    alpha = 0.1,
    gamma = 0.001,
    depth = 5,
  } = options;

  // null handling (matches original behavior for tree inputs)
  if (a === null || b === null) return 0;

  const centersA = xyMassCenterVector(a, { depth });
  const centersB = xyMassCenterVector(b, { depth });
  const integralA = getWeightedIntegral(a);
  const integralB = getWeightedIntegral(b);

  const size = centersA.length;
  const sumsA = computeSumsFromCenters(a, centersA, integralA, depth);
  const sumsB = computeSumsFromCenters(b, centersB, integralB, depth);

  const massSim = xMassCenterVectorSimilarity(sumsA, sumsB, {
    similarityFct: (u: number, v: number) => {
      if (!Number.isFinite(u) || !Number.isFinite(v)) return 0;
      if (u === 0 && v === 0) return 1;
      if (u === 0 || v === 0) return 0;
      return Math.min(u, v) / Math.max(u, v);
    },
  });

  const centerSim = xMassCenterVectorSimilarity(centersA, centersB, {
    similarityFct: (u: number, v: number) => {
      if (!Number.isFinite(u) || !Number.isFinite(v)) return 0;
      return Math.exp(-gamma * Math.abs(u - v));
    },
  });

  return alpha * massSim + (1 - alpha) * centerSim;
}

function getWeightedIntegral(data: DataXY) {
  const { x, y } = data;

  if (x.length < 2 || y.length < 2) {
    throw new Error(
      'Input DataXY must have at least two points in x and y arrays.',
    );
  }
  const integral = new Float64Array(x.length);
  // the first point, no points before
  const firstIntegration = (x[1] - x[0]) * y[0];
  let totalIntegration = firstIntegration;
  integral[0] = totalIntegration;
  for (let i = 1; i < x.length - 1; i++) {
    const currentIntegration = ((x[i + 1] - x[i - 1]) * y[i]) / 2;
    totalIntegration += currentIntegration;
    integral[i] = totalIntegration;
  }
  // the last point, no points after
  const lastIntegration = (x.at(-1)! - x.at(-2)!) * y.at(-1)!;
  totalIntegration += lastIntegration;
  integral[x.length - 1] = totalIntegration;
  return integral;
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
