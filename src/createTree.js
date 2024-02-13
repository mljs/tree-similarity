import binarySearch from 'binary-search';

/**
 * @typedef {import("../tree-similarity").Tree} Tree
 * @typedef {import("../tree-similarity").CreateTreeOptions} CreateTreeOptions
 * @typedef {import("cheminfo-types").DataXY} DataXY
 * @typedef {import("cheminfo-types").DoubleArray} DoubleArray
 */

/**
 * Function that creates the tree
 * @param {DataXY} dataXY
 * @param {CreateTreeOptions} [options]
 * @return { Tree | null }
 */
export function createTree(dataXY, options = {}) {
  const { x, y } = dataXY;
  const {
    minWindow = 0.16,
    threshold = 0.01,
    from = x[0],
    to = x[x.length - 1],
  } = options;

  return mainCreateTree(x, y, from, to, minWindow, threshold);
}

/**
 * recursive function to generate all the nodes in the tree
 * @param {DoubleArray} x
 * @param {DoubleArray} y
 * @param {number} from
 * @param {number} to
 * @param {number} minWindow
 * @param {number} threshold
 * @returns {Tree | null}
 */

function mainCreateTree(x, y, from, to, minWindow, threshold) {
  if (to - from < minWindow) {
    return null;
  }

  // search first point
  let start = binarySearch(x, from, (a, b) => a - b);
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
