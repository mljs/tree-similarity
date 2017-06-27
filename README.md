# tree-similarity

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![Test coverage][coveralls-image]][coveralls-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Tree similarity in Javascript

## Installation

`npm install ml-tree-similarity`

## Documentation

### tree(a, b, [options])

Returns the [tree similarity](http://www.researchgate.net/publication/257035181_Fast_and_shift-insensitive_similarity_comparisons_of_NMR_using_a_tree-representation_of_spectra) between two spectra in the format [[x1, x2, ...], [y1, y2, ...]]

__Options__

* `alpha` - weights the relative importance of intensity vs. shift match
* `beta` - weights the relative importance of node matching and children matching
* `gamma` - controls the attenuation of the effect of chemical shift differences
* `minWindow` - smallest range to accept in x
* `threshold` - smallest range to accept in y
* `from` - First x value to compute the tree
* `to` - Last x value to compute the tree

### tree.getFunction([options])

Returns a function that can calculate the similarity using `options`.

### tree.createTree(spectrum, [options])

Creates the tree based on the input spectrum.

__Example__

```js
var tree = require('ml-tree-similarity');

var a = [
    [1, 2, 3, 4, 5, 6, 7],
    [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3]
];
var b = [
    [1, 2, 3, 4, 5, 6, 7],
    [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3]
];

var options = {from: 1, to: 7};

var A = tree.createTree(a, options);
// a pre-calculated tree is also a valid input
var ans = tree(A, b, options);
```

## Literature

This algorithm was used for NMR spectra comparison:
* https://doi.org/10.1186/1758-2946-6-9
* https://doi.org/10.1016/j.chemolab.2013.05.009

## License

  [MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/ml-tree-similarity.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ml-tree-similarity
[travis-image]: https://img.shields.io/travis/mljs/tree-similarity/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/mljs/tree-similarity
[coveralls-image]: https://img.shields.io/coveralls/mljs/tree-similarity.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/mljs/tree-similarity
[david-image]: https://img.shields.io/david/mljs/tree-similarity.svg?style=flat-square
[david-url]: https://david-dm.org/mljs/tree-similarity
[download-image]: https://img.shields.io/npm/dm/ml-tree-similarity.svg?style=flat-square
[download-url]: https://npmjs.org/package/ml-tree-similarity
