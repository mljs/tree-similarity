import {getSimilarity} from './getSimilarity';
export {createTree} from './createTree';

export default function treeSimilarity(A, B, options) {
    const {
        alpha = 0.1,
        beta = 0.33,
        gamma = 0.001
    } = options;

    return getSimilarity(A, B, {alpha, beta, gamma});
}

export function getFunction(options = {}) {
    const {
        alpha = 0.1,
        beta = 0.33,
        gamma = 0.001
    } = options;

    return function treeSimilarity(A, B) {
        return getSimilarity(A, B, {alpha, beta, gamma});
    };
}
