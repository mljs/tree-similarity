'use strict';

var extend = require('extend');
var createTree = require('./createTree');
var getSimilarity = require('./getSimilarity');

var defaultOptions = {
    alpha: 0.1,
    beta: 0.33,
    gamma: 0.001
};

function treeSimilarity(A, B, options) {
    options = extend({}, defaultOptions, options);
    return getSimilarity(A, B, options);
}

module.exports = treeSimilarity;

module.exports.createTree = createTree;
module.exports.getFunction = function getTreeSimilarityFunction(options) {
    options = extend({}, defaultOptions, options);
    return function treeSimilarity(A, B) {
        return getSimilarity(A, B, options);
    };
};
