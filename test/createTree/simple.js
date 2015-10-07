'use strict';

var createTree = require('../..').createTree;
var assert = require('assert');

describe('simple trees', function () {

    it('two peaks, same height', function () {
        var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
        var tree = createTree([x, y]);

        tree.center.should.equal(5);
        tree.sum.should.equal(2);

        var left = tree.left;
        left.center.should.equal(3);
        left.sum.should.equal(1);
        assert.equal(left.left, null);
        assert.equal(left.right, null);

        var right = tree.right;
        right.center.should.equal(7);
        right.sum.should.equal(1);
        assert.equal(right.left, null);
        assert.equal(right.right, null);
    });

    it('two peaks, same height (higher)', function () {
        var x = new Array(101);
        var y = new Array(101);
        for (var i = 0; i < 101; i++) {
            x[i]=i;
            y[i] = 0;
        }
        y[20] = 20;
        y[80] = 20;

        var tree = createTree([x, y]);

        tree.center.should.equal(50);
        tree.sum.should.equal(40);

        var left = tree.left;
        left.center.should.equal(20);
        left.sum.should.equal(20);
        assert.equal(left.left, null);
        assert.equal(left.right, null);

        var right = tree.right;
        right.center.should.equal(80);
        right.sum.should.equal(20);
        assert.equal(right.left, null);
        assert.equal(right.right, null);
    });
});
