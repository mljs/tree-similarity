'use strict';

var tree = require('..');

describe.skip('Tree similarity', function () {

    var a, b;
    beforeEach(function () {
        a = [
            [1, 2, 3, 4, 5, 6, 7],
            [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3]
        ];
        b = [
            [1, 2, 3, 4, 5, 6, 7],
            [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3]
        ];
    });

    it('should work with two arrays', function () {
        tree(a, b).should.be.approximately(0.685253, 10e-4);
    });

    it('should create Tree object', function () {
        var theTree = tree.createTree(a);
        theTree.should.have.properties(['center', 'sum', 'left', 'right']);
        theTree.center.should.be.approximately(4.5, 10e-4);
        theTree.sum.should.equal(10.2);
    });

});
