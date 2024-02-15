# Changelog

## [2.2.0](https://github.com/mljs/tree-similarity/compare/v2.1.0...v2.2.0) (2024-02-15)


### Features

* migrate to typescript ([#19](https://github.com/mljs/tree-similarity/issues/19)) ([6634fd0](https://github.com/mljs/tree-similarity/commit/6634fd0993af4bb4f2df67c475d27a78df57cdfb))

## [2.1.0](https://github.com/mljs/tree-similarity/compare/v2.0.0...v2.1.0) (2024-02-13)


### Features

* add compressTree to reduce tree size ([c20c571](https://github.com/mljs/tree-similarity/commit/c20c571d7ac46d4a8a73f752e03a9d0f34dd57b6))


### Bug Fixes

* remove num-sort dep ([#14](https://github.com/mljs/tree-similarity/issues/14)) ([66fac3e](https://github.com/mljs/tree-similarity/commit/66fac3e9e7234485a4d5967d525f3de81eb684ff))

## [2.0.0](https://github.com/mljs/tree-similarity/compare/v1.0.0...v2.0.0) (2024-02-08)


### ⚠ BREAKING CHANGES

* treeSimilarity now only accepts Tree objects
* createTree expects an object {x: [],y: []}

### Code Refactoring

* createTree expects an object {x: [],y: []} ([ec9318f](https://github.com/mljs/tree-similarity/commit/ec9318f470600cf028476ef7b37ed08c3560587d))
* treeSimilarity now only accepts Tree objects ([ec9318f](https://github.com/mljs/tree-similarity/commit/ec9318f470600cf028476ef7b37ed08c3560587d))

## Changelog

## [1.0.0](https://github.com/mljs/tree-similarity/compare/v0.1.0...v1.0.0) (2019-06-29)


### chore

* update dependencies and remove support for Node.js 6 ([e8ad736](https://github.com/mljs/tree-similarity/commit/e8ad736))


### BREAKING CHANGES

* Node.js 6 is no longer supported.



<a name="0.1.0"></a>
## 0.1.0 (2017-08-10)


### Bug Fixes

* divide by number of children ([eb7ce7e](https://github.com/mljs/tree-similarity/commit/eb7ce7e))


### Performance Improvements

* improve search on start ([8edebc2](https://github.com/mljs/tree-similarity/commit/8edebc2))
