import { describe, it, expect } from 'vitest';

import { Tree, createTree } from '../createTree';

describe('simple trees', () => {
  it('two peaks, same height', () => {
    const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const tree = createTree({ x, y }) as Tree;

    expect(tree.center).toBe(5);
    expect(tree.sum).toBe(2);

    const left = tree.left as Tree;
    expect(left).not.toBe(null);
    expect(left.center).toBe(3);
    expect(left.sum).toBe(1);
    expect(left.left).toStrictEqual(null);
    expect(left.right).toStrictEqual(null);

    const right = tree.right as Tree;
    expect(right).not.toBe(null);
    expect(right.center).toBe(7);
    expect(right.sum).toBe(1);
    expect(right.left).toStrictEqual(null);
    expect(right.right).toStrictEqual(null);
  });

  it('two peaks, same height (higher)', () => {
    const x = new Array(101);
    const y = new Array(101);
    for (let i = 0; i < 101; i++) {
      x[i] = i;
      y[i] = 0;
    }
    y[20] = 20;
    y[80] = 20;

    const tree = createTree({ x, y }) as Tree;

    expect(tree.center).toBe(50);
    expect(tree.sum).toBe(40);

    const left = tree.left as Tree;
    expect(left).not.toBe(null);
    expect(left.center).toBe(20);
    expect(left.sum).toBe(20);
    expect(left.left).toStrictEqual(null);
    expect(left.right).toStrictEqual(null);

    const right = tree.right as Tree;
    expect(right).not.toBe(null);
    expect(right.center).toBe(80);
    expect(right.sum).toBe(20);
    expect(right.left).toStrictEqual(null);
    expect(right.right).toStrictEqual(null);
  });
});
