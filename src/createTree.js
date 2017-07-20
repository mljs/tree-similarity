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
    const {
        minWindow = 0.16,
        threshold = 0.01,
        from = X[0],
        to = X[X.length - 1]
    } = options;

    return mainCreateTree(spectrum[0], spectrum[1], from, to, minWindow, threshold);
}

function mainCreateTree(X, Y, from, to, minWindow, threshold) {
    if ((to - from) < minWindow) {
        return null;
    }
    var sum = 0;
    var start, end;
    var i = 0;

    // search first point
    for (; i < X.length; i++) {
        if (X[i] >= from) {
            start = i;
            break;
        }
    }

    // stop at last point
    for (; i < X.length; i++) {
        if (X[i] >= to) {
            end = i;
            break;
        }
        sum += Y[i];
    }
    if (sum < threshold) {
        return null;
    }

    var center = 0;
    for (i = start; i < end; i++) {
        center += X[i] * Y[i];
    }
    center /= sum;
    if (((center - from) < 1e-6) || ((to - center) < 1e-6)) {
        return null;
    }
    if ((center - from) < (minWindow / 4)) {
        return mainCreateTree(X, Y, center, to, minWindow, threshold);
    } else {
        if ((to - center) < (minWindow / 4)) {
            return mainCreateTree(X, Y, from, center, minWindow, threshold);
        } else {
            return new Tree(
                sum, center,
                mainCreateTree(X, Y, from, center, minWindow, threshold),
                mainCreateTree(X, Y, center, to, minWindow, threshold)
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
