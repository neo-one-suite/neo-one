/* @flow */
import { CustomError } from '@neo-one/utils';

import common, { type UInt256 } from '../common';
import crypto from './crypto';

class InvalidMerkleTreeException extends CustomError {
  code: string;

  constructor() {
    super('Invalid Merkle tree.');
    this.code = 'INVALID_MERKLE_TREE';
  }
}

class MerkleTreeNode {
  hash: UInt256;
  leftChild: ?MerkleTreeNode;
  rightChild: ?MerkleTreeNode;
  parent: ?MerkleTreeNode;

  constructor({
    hash,
    leftChild,
    rightChild,
    parent,
  }: {|
    hash: UInt256,
    leftChild?: MerkleTreeNode,
    rightChild?: MerkleTreeNode,
    parent?: MerkleTreeNode,
  |}) {
    this.hash = hash;
    this.leftChild = leftChild;
    this.rightChild = rightChild;
    this.parent = parent;
  }

  clone(parent?: MerkleTreeNode): MerkleTreeNode {
    const self = new MerkleTreeNode({
      hash: this.hash,
      parent,
    });
    if (this.leftChild != null) {
      self.leftChild = this.leftChild.clone(self);
    }
    if (this.rightChild != null) {
      self.rightChild = this.rightChild.clone(self);
    }
    return self;
  }
}

const build = (leavesIn: Array<MerkleTreeNode>) => {
  const leaves = leavesIn;
  if (leaves.length === 0) {
    throw new InvalidMerkleTreeException();
  }
  if (leaves.length === 1) {
    return leaves[0];
  }

  const parents = [];
  const length = Math.floor((leaves.length + 1) / 2);
  for (let i = 0; i < length; i += 1) {
    const leftChild = leaves[i * 2];

    let rightChild;
    if (i * 2 + 1 === leaves.length) {
      rightChild = leftChild;
    } else {
      rightChild = leaves[i * 2 + 1];
    }
    const node = new MerkleTreeNode({
      hash: crypto.hash256(
        Buffer.concat([
          common.uInt256ToBuffer(leftChild.hash),
          common.uInt256ToBuffer(rightChild.hash),
        ]),
      ),
      leftChild,
      rightChild,
    });
    parents[i] = node;
    leaves[i * 2].parent = node;

    if (i * 2 + 1 !== leaves.length) {
      leaves[i * 2 + 1].parent = node;
    }
  }

  return build(parents);
};

const trim = (
  node: MerkleTreeNode,
  index: number,
  depth: number,
  flags: Array<boolean>,
) => {
  const { leftChild, rightChild } = node;
  if (depth === 1 || leftChild == null) {
    return;
  }

  if (depth === 2) {
    if (!flags[index * 2] && !flags[index * 2 + 1]) {
      // eslint-disable-next-line
      node.leftChild = null;
      // eslint-disable-next-line
      node.rightChild = null;
    }
  } else if (rightChild != null) {
    trim(leftChild, index * 2, depth - 1, flags);
    trim(rightChild, index * 2 + 1, depth - 1, flags);
    if (leftChild.leftChild == null && rightChild.rightChild == null) {
      // eslint-disable-next-line
      node.leftChild = null;
      // eslint-disable-next-line
      node.rightChild = null;
    }
  }
};

const _depthFirstSearch = (
  node: MerkleTreeNode,
  hashes: Array<UInt256>,
): void => {
  const { leftChild, rightChild } = node;
  if (leftChild == null || rightChild == null) {
    hashes.push(node.hash);
  } else {
    _depthFirstSearch(leftChild, hashes);
    _depthFirstSearch(rightChild, hashes);
  }
};

const depthFirstSearch = (node: MerkleTreeNode): Array<UInt256> => {
  const hashes = [];
  _depthFirstSearch(node, hashes);
  return hashes;
};

export default class MerkleTree {
  root: MerkleTreeNode;
  depth: number;

  constructor(hashesOrNode: Array<UInt256> | MerkleTreeNode) {
    this.root = Array.isArray(hashesOrNode)
      ? build(hashesOrNode.map(hash => new MerkleTreeNode({ hash })))
      : hashesOrNode;
    this.depth = 1;
    for (let node = this.root; node.leftChild != null; node = node.leftChild) {
      this.depth += 1;
    }
  }

  trim(flags: Array<boolean>): MerkleTree {
    const result = this.root.clone();
    trim(result, 0, this.depth, flags);
    return new MerkleTree(result);
  }

  depthFirstSearch(): Array<UInt256> {
    return depthFirstSearch(this.root);
  }

  toHashArray(): Array<UInt256> {
    return this.depthFirstSearch();
  }

  static computeRoot(hashes: Array<UInt256>) {
    const tree = new this(hashes);
    return tree.root.hash;
  }
}
