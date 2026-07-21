import { expect, test } from 'vitest';

import { createTree } from '../createTree.ts';
import { treeSimilarity } from '../treeSimilarity.ts';

test('same tree', () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  const tree1 = createTree({ x, y });
  const tree2 = createTree({ x, y });

  expect(treeSimilarity(tree1, tree2, { beta: 1 })).toBe(1);
});
