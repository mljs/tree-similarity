import { Tree } from './createTree';

/**
 * Destructive compression in which we reduce the number of decimals
 */
export function compressTree(
  tree: Tree,
  options: {
    // number of decimal ot keep
    fixed?: number;
  } = {},
): Tree {
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
