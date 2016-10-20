'use strict';

const createTree = require('./createTree');
const getSimilarity = require('./getSimilarity');

var defaultOptions = {
    alpha: 0.1,
    beta: 0.33,
    gamma: 0.001
};

function treeSimilarity(A, B, options) {
    options = Object.assign({}, defaultOptions, options);
    return getSimilarity(A, B, options);
}

module.exports = treeSimilarity;

module.exports.createTree = createTree;
module.exports.getFunction = function getTreeSimilarityFunction(options) {
    options = Object.assign({}, defaultOptions, options);
    return function treeSimilarity(A, B) {
        return getSimilarity(A, B, options);
    };
};
