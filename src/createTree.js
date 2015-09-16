'use strict';

var extend = require('extend');

var defaultOptions = {
    minWindow: 0.16,
    threshold: 0.01
};

/**
 * Function that creates the tree
 * @param {[[number], [number]]} spectrum
 * @param {Object} options
 * @returns {Tree | null}
 * left and right have the same structure than the parent,
 * or are null if they are leaves
 */
function createTree(spectrum, options) {
    options = extend({}, defaultOptions, options);
    var X = spectrum[0];
    var from = options.from === undefined ? X[0] : options.from;
    var to = options.to === undefined ? X[X.length - 1] : options.to;
    return mainCreateTree(spectrum[0], spectrum[1], from, to, options.minWindow, options.threshold);
}

function mainCreateTree(X, Y, from, to, minWindow, threshold) {
    if ((to - from) < minWindow)
        return null;
    var sum = 0;
    for (var i = 0; X[i] < to; i++) {
        if (X[i] > from)
            sum += Y[i];
    }
    if (sum < threshold) {
        return null;
    }
    var center = 0;
    for (var j = 0; X[j] < to; j++) {
        if (X[i] > from)
            center += X[j] * Y[j];
    }
    center = center / sum;
    if (((center - from) < 10e-6) || ((to - center) < 10e-6)) {
        return null;
    }
    if ((center - from) < (minWindow / 4)) {
        return mainCreateTree(X, Y, center, to, minWindow, threshold);
    }
    else {
        if ((to - center) < (minWindow / 4)) {
            return mainCreateTree(X, Y, from, center, minWindow, threshold);
        }
        else {
            return new Tree(
                sum, center,
                mainCreateTree(X, Y, from, center, minWindow, threshold),
                mainCreateTree(X, Y, center, to, minWindow, threshold)
            );
        }
    }
}

function Tree(sum, center, left, right) {
    this.sum = sum;
    this.center = center;
    this.left = left;
    this.right = right;
}

module.exports = createTree;
