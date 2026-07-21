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

test('from and to wider than the data on both sides', () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

  // The window extends beyond both ends of x; accumulation must stay in bounds
  // and the tree is identical to the one built over the natural x range.
  expect(createTree({ x, y }, { from: -10, to: 20 })).toStrictEqual({
    sum: 2,
    center: 5,
    left: { sum: 1, center: 3, left: null, right: null },
    right: { sum: 1, center: 7, left: null, right: null },
  });
});

test('to larger than the maximum x keeps the points up to the end', () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

  // from sits between the two peaks, to is far past the last point.
  expect(createTree({ x, y }, { from: 5, to: 100 })).toStrictEqual({
    sum: 1,
    center: 7,
    left: null,
    right: null,
  });
});

test('from beyond the last point returns null', () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

  expect(createTree({ x, y }, { from: 50, to: 60 })).toBeNull();
});

test('a window entirely beyond the data returns null', () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

  expect(createTree({ x, y }, { from: 100, to: 200 })).toBeNull();
  expect(createTree({ x, y }, { from: -200, to: -100 })).toBeNull();
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
