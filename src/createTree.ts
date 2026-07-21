import binarySearch from 'binary-search';
import type { DataXY, NumberArray } from 'cheminfo-types';
import { xySortX } from 'ml-spectra-processing';

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
 * Creates the binary tree that represents a spectrum.
 * The points are sorted by x with `xySortX`, so spectra stored with a
 * decreasing x, as usual for NMR ppm, are handled.
 * @param dataXY - object with x (chemical shifts) and y (intensities) arrays.
 * @param options - creation options.
 * @returns the root of the tree, or null when no node could be created.
 */
export function createTree(
  dataXY: DataXY,
  options: CreateTreeOptions = {},
): Tree | null {
  const { x, y } = xySortX(dataXY);
  const { minWindow = 0.16, threshold = 0.01 } = options;
  const from = options.from ?? x[0] ?? 0;
  const to = options.to ?? x.at(-1) ?? 0;

  return mainCreateTree(x, y, from, to, minWindow, threshold);
}

function mainCreateTree(
  x: NumberArray,
  y: NumberArray,
  from: number,
  to: number,
  minWindow: number,
  threshold: number,
): Tree | null {
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
    const xValue = x[i] as number;
    const yValue = y[i] as number;
    if (xValue >= to) {
      break;
    }
    sum += yValue;
    center += xValue * yValue;
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
