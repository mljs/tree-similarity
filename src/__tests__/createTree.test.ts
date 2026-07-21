import { expect, test } from 'vitest';

import type { Tree } from '../createTree.ts';
import { createTree } from '../createTree.ts';

test('two peaks, same height', () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  const tree = createTree({ x, y }) as Tree;

  expect(tree.center).toBe(5);
  expect(tree.sum).toBe(2);

  const left = tree.left as Tree;

  expect(left).not.toBeNull();
  expect(left.center).toBe(3);
  expect(left.sum).toBe(1);
  expect(left.left).toBeNull();
  expect(left.right).toBeNull();

  const right = tree.right as Tree;

  expect(right).not.toBeNull();
  expect(right.center).toBe(7);
  expect(right.sum).toBe(1);
  expect(right.left).toBeNull();
  expect(right.right).toBeNull();
});

test('two peaks, same height (higher)', () => {
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

  expect(left).not.toBeNull();
  expect(left.center).toBe(20);
  expect(left.sum).toBe(20);
  expect(left.left).toBeNull();
  expect(left.right).toBeNull();

  const right = tree.right as Tree;

  expect(right).not.toBeNull();
  expect(right.center).toBe(80);
  expect(right.sum).toBe(20);
  expect(right.left).toBeNull();
  expect(right.right).toBeNull();
});
