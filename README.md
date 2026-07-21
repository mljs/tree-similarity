# tree-similarity

[![NPM version][npm-image]][npm-url]
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

Compares two spectra using a tree similarity.

## Installation

`$ npm i ml-tree-similarity`

> **Note:** This package is now ESM only. CommonJS projects can still `require()` it on Node.js ≥ 20.19, ≥ 22.12, or any 24.x; otherwise use `import`.

## Usage

```js
import { createTree, treeSimilarity } from 'ml-tree-similarity';

const a = {
  x: [1, 2, 3, 4, 5, 6, 7],
  y: [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3],
};
const b = {
  x: [1, 2, 3, 4, 5, 6, 7],
  y: [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3],
};

// create a tree
const options = { from: 1, to: 7 };
const aTree = createTree(a, options);
const bTree = createTree(b, options);

const ans = treeSimilarity(aTree, bTree, options);
```

`compressTree` is also exported to shrink a tree by rounding its numbers to a
fixed number of decimals:

```js
import { compressTree } from 'ml-tree-similarity';

const compact = compressTree(aTree, { fixed: 3 });
```

## How it works

Each spectrum is encoded as a **binary tree of centers of mass**: every node stores
the integral (`sum`) and the intensity-weighted mean position (`center`) of a
sub-region, and each region is split at its center of mass. Noisy and empty regions
are pruned, so the method needs **no peak picking and no pre-treatment**. Two trees
are then compared with a recursive, shift-insensitive similarity.

`createTree` always normalizes the x axis to be **strictly increasing** first:
spectra stored with decreasing ppm (as usual for NMR) are reversed, then run through
`xyEnsureGrowingX`. So descending JCAMP spectra can be passed in directly.

### `createTree` options

| option      | default    | meaning                                                       |
| ----------- | ---------- | ------------------------------------------------------------- |
| `threshold` | `0.01`     | minimum integral (Σy) for a node to be created (prunes noise) |
| `minWindow` | `0.16`     | minimum sub-region width, in x units (e.g. ppm)               |
| `from`      | `x[0]`     | lower x bound of the tree                                     |
| `to`        | `x.at(-1)` | upper x bound of the tree                                     |

### `treeSimilarity` options

| option  | default | meaning                                             |
| ------- | ------- | --------------------------------------------------- |
| `alpha` | `0.1`   | weight of the intensity match vs. the shift match   |
| `beta`  | `0.33`  | weight of a node vs. its children (shift tolerance) |
| `gamma` | `0.001` | decay of the shift penalty `exp(−γ·\|Δcenter\|)`    |

> **Note:** the raw similarity is **not** self-normalized (`treeSimilarity(a, a) ≠ 1`).
> For a comparable measure divide by `sqrt(s(a,a) · s(b,b))`.

**See [docs/algorithm.md](./docs/algorithm.md)** for the full method, its mapping to the
original paper, the noise / center-of-mass trade-off, reproducibility findings, and the
list of known limitations and planned improvements.

## Development

- `npm test` — unit tests, type-check, lint and format.
- `npm run dev` — an interactive **explorer**: a similarity matrix over every spectrum in
  `src/__tests__/data/`, with the two selected spectra and their trees, and synchronized
  zoom (drag to zoom X, double-click to reset, scroll wheel to zoom Y).
- `npm run generate-data` — regenerate the synthetic JCAMP-DX test spectra (DIFDUP
  compressed) used by the tests and the explorer.

## [API Documentation](https://mljs.github.io/tree-similarity/)

This algorithm was based in the following papers:

- [A new method for the comparison of 1H NMR predictors based on tree-similarity of spectra](https://doi.org/10.1186/1758-2946-6-9)
- [Fast and shift-insensitive similarity comparisons of NMR using a tree-representation of spectra](https://doi.org/10.1016/j.chemolab.2013.05.009)

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/ml-tree-similarity.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ml-tree-similarity
[codecov-image]: https://img.shields.io/codecov/c/github/mljs/tree-similarity.svg?style=flat-square
[codecov-url]: https://codecov.io/github/mljs/tree-similarity
[download-image]: https://img.shields.io/npm/dm/ml-tree-similarity.svg?style=flat-square
[download-url]: https://npmjs.org/package/ml-tree-similarity
