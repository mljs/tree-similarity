import {treeSimilarity, createTree} from '..';

var a = [
    [1, 2, 3, 4, 5, 6, 7],
    [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3]
];
var b = [
    [1, 2, 3, 4, 5, 6, 7],
    [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3]
];

describe('Tree similarity', () => {
    it('should work with two arrays', () => {
        expect(treeSimilarity(a, b)).toBeCloseTo(0.653354, 4);
    });

    it('should create Tree object', () => {
        var tree = createTree(a);
        expect(tree.center).toBeCloseTo(4.3714, 4);
        expect(tree.sum).toBeCloseTo(10.5, 4);
    });
});
