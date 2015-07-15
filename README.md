# tree-similarity

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Tree similarity in Javascript

## Installation

`npm install ml-tree-similarity`

## tree(a,b, from, to, [options])

Returns the [tree similarity](http://www.researchgate.net/publication/257035181_Fast_and_shift-insensitive_similarity_comparisons_of_NMR_using_a_tree-representation_of_spectra) between two spectra in the format {'x':Array,'y':Array}

__Options__

* alpha - weights the relative importance of intensity vs. shift match
* beta - weights the relative importance of node matching and children matching
* gamma - controls the attenuation of the effect of chemical shift differences
* minWindow - smallest range to accept in x
* threshold - smallest range to accept in y

__Calc__

Calculates the tree-similarity

__CreateTree__

Creates the tree based in the input dataset

__Example__

```js
var tree = require('ml-tree-similarity');
var a = {
    'x': [1, 2, 3, 4, 5, 6, 7],
    'y': [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3]
};
var b = {
    'x': [1, 2, 3, 4, 5, 6, 7],
    'y': [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3]
};
// creates an actual tree
var A = tree.createTree(a.x, a.y, 1, 7).center.should.be.approximately(4.5,10e-4);
// a pre-calculated tree is also a valid input
var ans = tree.calc(A, b, 1, 7);
console.log(ans);
```


## Test

```shell
$ npm install
$ npm test
```

## Authors

  - [Miguel Asencio](https://github.com/maasencioh)

## License

  [MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/ml-tree-similarity.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ml-tree-similarity
[travis-image]: https://img.shields.io/travis/mljs/tree-similarity/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/mljs/tree-similarity
[david-image]: https://img.shields.io/david/mljs/tree-similarity.svg?style=flat-square
[david-url]: https://david-dm.org/mljs/tree-similarity
[download-image]: https://img.shields.io/npm/dm/ml-tree-similarity.svg?style=flat-square
[download-url]: https://npmjs.org/package/ml-tree-similarity
