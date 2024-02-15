import binarySearch from 'binary-search';
import { DataXY } from 'cheminfo-types';

export interface Tree {
  sum: number;
  center: number;
  /**
   * left and right have the same structure than the parent,
   * or are null if they are leaves
   */
  left: Tree | null;
  right: Tree | null;
}

export interface CreateTreeOptions {
  /**
   * low limit of the tree
   * @default x[0]
   */
  from?: number;
  /**
   * high limit of the tree
   * @default x.at(-1)
   */
  to?: number;
  /**
   * minimal sum value to accept a node
   * @default 0.01
   */
  threshold?: number;
  /**
   * minimal window width to create a node
   * @default 0.16
   */
  minWindow?: number;
}

/**
 * Function that creates the tree
 */

export function createTree(
  dataXY: DataXY,
  options: CreateTreeOptions = {},
): Tree | null {
  const { x, y } = dataXY;
  const {
    minWindow = 0.16,
    threshold = 0.01,
    from = x[0],
    to = x[x.length - 1],
  } = options;

  return mainCreateTree(x, y, from, to, minWindow, threshold);
}

function mainCreateTree(x, y, from, to, minWindow, threshold) {
  if (to - from < minWindow) {
    return null;
  }

  // search first point
  let start = binarySearch(x, from, (a: number, b: number) => a - b);
  if (start < 0) {
    start = ~start;
  }

  // stop at last point
  let sum = 0;
  let center = 0;
  for (let i = start; i < x.length; i++) {
    if (x[i] >= to) {
      break;
    }
    sum += y[i];
    center += x[i] * y[i];
  }

  if (sum < threshold) {
    return null;
  }

  center /= sum;
  if (center - from < 1e-6 || to - center < 1e-6) {
    return null;
  }
  if (center - from < minWindow / 4) {
    return mainCreateTree(x, y, center, to, minWindow, threshold);
  } else if (to - center < minWindow / 4) {
    return mainCreateTree(x, y, from, center, minWindow, threshold);
  } else {
    return {
      sum,
      center,
      left: mainCreateTree(x, y, from, center, minWindow, threshold),
      right: mainCreateTree(x, y, center, to, minWindow, threshold),
    };
  }
}
