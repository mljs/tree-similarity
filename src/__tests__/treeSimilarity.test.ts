import { describe, it, expect } from 'vitest';

import { createTree } from '../createTree';
import { treeSimilarity } from '../treeSimilarity';

describe('simple trees', () => {
  it('same tree', () => {
    const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const tree1 = createTree({ x, y });
    const tree2 = createTree({ x, y });

    expect(treeSimilarity(tree1, tree2, { beta: 1 })).toBe(1);
  });

  it('rates identical trees at least as high as a perturbed version (default)', () => {
    const x = [0, 1, 2, 3, 4, 5, 6];
    const y = [0, 0, 1, 0, 0, 1, 0];
    const data = { x, y };
    const perturbed = { x, y: y.map((v, i) => (i === 2 ? v + 0.5 : v)) };

    const tree = createTree(data);
    const treePerturbed = createTree(perturbed);

    const sSame = treeSimilarity(tree, tree, { beta: 1 });
    const sPerturbed = treeSimilarity(tree, treePerturbed, { beta: 1 });

    expect(sSame).toBeGreaterThanOrEqual(sPerturbed);
    expect(sSame).toBeCloseTo(1);
  });

  it('returns 0 when either input is null', () => {
    const x = [0, 1];
    const y = [1, 2];
    const tree = createTree({ x, y });

    expect(treeSimilarity(null, tree)).toBe(0);
    expect(treeSimilarity(tree, null)).toBe(0);
    expect(treeSimilarity(null, null)).toBe(0);
  });

  it('is symmetric for different trees', () => {
    const x = [0, 1, 2, 3, 4];
    const y1 = [0, 0, 1, 0, 0];
    const y2 = [0, 1, 0, 1, 0];

    const tree1 = createTree({ x, y: y1 });
    const tree2 = createTree({ x, y: y2 });

    const s1 = treeSimilarity(tree1, tree2);
    const s2 = treeSimilarity(tree2, tree1);

    expect(s1).toBeCloseTo(s2);
  });
});
