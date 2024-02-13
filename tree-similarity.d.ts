import { DataXY } from "cheminfo-types";

export interface Tree {
  sum: number;
  center: number;
  /**
   * left and right have the same structure than the parent,
   * or are null if they are leaves
   */
  left: Tree | null;
  right: Tree | null;
}

export interface CreateTreeOptions {
  /**
   * low limit of the tree
   * @default x[0]
   */
  from?: number
  /**
   * high limit of the tree
   * @default x.at(-1)
   */
  to?: number
  /**
   * minimal sum value to accept a node
   * @default 0.01 
   */ 
  threshold?: number;
  /**
   * minimal window width to create a node
   * @default 0.16
   */
  minWindow?: number
}

export interface TreeSimilarityOptions {
  alpha?: number;
  beta?: number;
  gamma?: number;
}

export function createTree(
  dataXY: DataXY,
  options: CreateTreeOptions = {},
): Tree

export function treeSimilarity(
  tree1: Tree,
  tree2: Tree,
  options: TreeSimilarityOptions = {},
): number;
  
export function compressTree(
  tree: Tree,
  options: { fixed?: number }
)