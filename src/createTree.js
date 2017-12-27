import binarySearch from 'binary-search';
import {asc, desc} from 'num-sort';

/**
 * Function that creates the tree
 * @param {Array<Array<number>>} spectrum
 * @param {object} [options]
 * @return {Tree|null}
 * left and right have the same structure than the parent,
 * or are null if they are leaves
 */
export function createTree(spectrum, options = {}) {
    var X = spectrum[0];
    var {
        minWindow = 0.16,
        threshold = 0.01,
        from = X[0],
        to = X[X.length - 1]
    } = options;

    if (X[0] > X[1]) {
        if (from < to) [from, to] = [to, from];
    } else if (from > to) {
        [from, to] = [to, from];
    }
    var comparator = from > to ? desc : asc;

    return mainCreateTree(spectrum[0], spectrum[1], from, to, minWindow, threshold, comparator);
}

function mainCreateTree(X, Y, from, to, minWindow, threshold, comparator) {

    if (Math.abs(to - from) < minWindow) {
        return null;
    }

    // search first point
    var start = binarySearch(X, from, comparator);

    if (start < 0) {
        start = ~start;
    }

    // stop at last point
    var sum = 0;
    var center = 0;
    for (var i = start; i < X.length; i++) {
        if (comparator(X[i], to) >= 0) {
            break;
        }
        sum += Y[i];
        center += X[i] * Y[i];
    }

    if (sum < threshold) {
        return null;
    }

    center /= sum;

    if ((comparator(center, from) < 1e-6) || (comparator(to, center) < 1e-6)) {
        return null;
    }
    if (comparator(center, from) < (minWindow / 4)) {
        return mainCreateTree(X, Y, center, to, minWindow, threshold, comparator);
    } else {
        if (comparator(to, center) < (minWindow / 4)) {
            return mainCreateTree(X, Y, from, center, minWindow, threshold, comparator);
        } else {
            return new Tree(
                sum, center,
                mainCreateTree(X, Y, from, center, minWindow, threshold, comparator),
                mainCreateTree(X, Y, center, to, minWindow, threshold, comparator)
            );
        }
    }
}

class Tree {
    constructor(sum, center, left, right) {
        this.sum = sum;
        this.center = center;
        this.left = left;
        this.right = right;
    }
}
