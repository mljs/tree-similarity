import { describe, it, expect } from 'vitest';

import { createTree } from '../createTree';
import { treeSimilarity } from '../treeSimilarity';

describe('simple trees', () => {
  it('same tree', () => {
    let x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    let tree1 = createTree([x, y]);
    let tree2 = createTree([x, y]);

    expect(treeSimilarity(tree1, tree2, { beta: 1 })).toBe(1);
  });
});
