import binarySearch from 'binary-search';
import { numberSortAscending } from 'num-sort';

/**
 * Function that creates the tree
 * @param {object} spectrum
 * @param {object} [options]
 * @return {Tree|null}
 * left and right have the same structure than the parent,
 * or are null if they are leaves
 */
export function createTree(spectrum, options = {}) {
  const { x, y } = spectrum;
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
  let start = binarySearch(x, from, numberSortAscending);
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
