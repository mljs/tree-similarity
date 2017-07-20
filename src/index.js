import {getSimilarity} from './getSimilarity';
export {createTree} from './createTree';

export function treeSimilarity(A, B, options =  {}) {
    return getSimilarity(A, B, options);
}

export function getFunction(options = {}) {
    return (A, B) => {
        return getSimilarity(A, B, options);
    };
}
