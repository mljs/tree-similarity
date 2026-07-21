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

test('tolerance overrides gamma with gamma = ln2 / tolerance', () => {
  const a = { x: [1, 2, 3, 4, 5, 6, 7], y: [0.3, 0.7, 4, 0.3, 0.2, 5, 0.3] };
  const b = { x: [1, 2, 3, 4, 5, 6, 7], y: [0.3, 4, 0.7, 0.3, 5, 0.2, 0.3] };
  const treeA = createTree(a);
  const treeB = createTree(b);

  const tolerance = 0.5;
  const withTolerance = treeSimilarity(treeA, treeB, { tolerance });
  const withEquivalentGamma = treeSimilarity(treeA, treeB, {
    gamma: Math.LN2 / tolerance,
  });

  expect(withTolerance).toBe(withEquivalentGamma);

  // tolerance wins when both are provided
  const ignoringGamma = treeSimilarity(treeA, treeB, { tolerance, gamma: 999 });

  expect(ignoringGamma).toBe(withTolerance);
});
