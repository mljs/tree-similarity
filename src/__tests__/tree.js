import tree from '..';

describe('Tree similarity', () => {

    var a, b;
    beforeEach(() => {
        a = [
            [1, 2, 3, 4, 5, 6, 7],
            [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3]
        ];
        b = [
            [1, 2, 3, 4, 5, 6, 7],
            [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3]
        ];
    });

    it('should work with two arrays', () => {
        expect(tree(a, b)).toBeCloseTo(0.685253, 4);
    });

    it('should create Tree object', () => {
        var theTree = tree.createTree(a);
        expect(theTree.center).toBeCloseTo(4.5, 4);
        expect(theTree.sum).toEqual(10.2);
    });

});
