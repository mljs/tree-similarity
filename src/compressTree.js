/**
 * @typedef {import("../tree-similarity").Tree} Tree
 */
/**
 * Destructive compression in which we reduce the number of decimals
 * @param {Tree} tree
 * @param {object} [options={}]
 * @param {number} [options.fixed=undefined] - number of decimal ot keep
 * @returns
 */

export function compressTree(tree, options = {}) {
  const { fixed } = options;
  return JSON.parse(
    JSON.stringify(tree, (key, value) => {
      if (value === null) {
        return undefined;
      }
      if (fixed) {
        if (typeof value === 'number') {
          return Number(value.toFixed(fixed));
        }
        return value;
      }
      return value;
    }),
  );
}
