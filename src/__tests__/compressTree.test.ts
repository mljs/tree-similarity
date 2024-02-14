import { test, expect } from 'vitest';

import { compressTree } from '../compressTree';
import { Tree, createTree } from '../createTree';

test('compressTree', () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [0, 1, 2, 3, 0, 0, 0, 1, 0, 0, 0];
  const tree = createTree({ x, y }) as Tree;

  expect(compressTree(tree, { fixed: 3 })).toStrictEqual({
    sum: 7,
    center: 3,
    left: {
      sum: 3,
      center: 1.667,
      left: { sum: 1, center: 1 },
      right: { sum: 2, center: 2 },
    },
    right: { sum: 4, center: 4, right: { sum: 1, center: 7 } },
  });
});
