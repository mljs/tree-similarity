'use strict';

const createTree = require('./createTree');

/**
 * Similarity between two nodes
 * @param {Tree} a - tree A node
 * @param {Tree} b - tree B node
 * @param {object} options
 * @return {number} similarity measure between tree nodes
 */
function treeSimilarity(a, b, options) {
    if (a === null || b === null) {
        return 0;
    }
    if (Array.isArray(a)) {
        a = createTree(a, options);
    }
    if (Array.isArray(b)) {
        b = createTree(b, options);
    }

    var C = (options.alpha * Math.min(a.sum, b.sum) / Math.max(a.sum, b.sum) + (1 - options.alpha) * Math.exp(-options.gamma * Math.abs(a.center - b.center)));

    return options.beta * C + (1 - options.beta) * (treeSimilarity(a.left, b.left, options) + treeSimilarity(a.right, b.right, options));
}

module.exports = treeSimilarity;
