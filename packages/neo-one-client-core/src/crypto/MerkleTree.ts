// tslint:disable readonly-keyword no-object-mutation no-array-mutation
import { makeErrorWithCode } from '@neo-one/utils';
import { common, UInt256 } from '../common';
import { crypto } from './crypto';

export const InvalidMerkleTreeException = makeErrorWithCode(
  'INVALID_MERKLE_TREE',
  () => 'Invalid Merkle tree. (no nodes found)',
);

class MerkleTreeNode {
  public readonly hash: UInt256;
  public leftChild: MerkleTreeNode | undefined;
  public rightChild: MerkleTreeNode | undefined;
  public parent: MerkleTreeNode | undefined;

  public constructor({
    hash,
    leftChild,
    rightChild,
    parent,
  }: {
    readonly hash: UInt256;
    readonly leftChild?: MerkleTreeNode;
    readonly rightChild?: MerkleTreeNode;
    readonly parent?: MerkleTreeNode;
  }) {
    this.hash = hash;
    this.leftChild = leftChild;
    this.rightChild = rightChild;
    this.parent = parent;
  }

  public clone(parent?: MerkleTreeNode): MerkleTreeNode {
    const self = new MerkleTreeNode({
      hash: this.hash,
      parent,
    });

    if (this.leftChild !== undefined) {
      self.leftChild = this.leftChild.clone(self);
    }
    if (this.rightChild !== undefined) {
      self.rightChild = this.rightChild.clone(self);
    }

    return self;
  }
}

const build = (leavesIn: ReadonlyArray<MerkleTreeNode>): MerkleTreeNode => {
  const leaves = leavesIn;
  if (leaves.length === 0) {
    throw new InvalidMerkleTreeException();
  }
  if (leaves.length === 1) {
    return leaves[0];
  }

  const parents = [];
  const length = Math.floor((leaves.length + 1) / 2);
  // tslint:disable-next-line no-loop-statement
  for (let i = 0; i < length; i += 1) {
    const leftChild = leaves[i * 2];

    const rightChild = i * 2 + 1 === leaves.length ? leftChild : leaves[i * 2 + 1];
    const node = new MerkleTreeNode({
      hash: crypto.hash256(
        Buffer.concat([common.uInt256ToBuffer(leftChild.hash), common.uInt256ToBuffer(rightChild.hash)]),
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

const trim = (node: MerkleTreeNode, index: number, depth: number, flags: ReadonlyArray<boolean>) => {
  const { leftChild, rightChild } = node;
  if (depth === 1 || leftChild === undefined) {
    return;
  }

  if (depth === 2) {
    if (!flags[index * 2] && !flags[index * 2 + 1]) {
      node.leftChild = undefined;
      node.rightChild = undefined;
    }
  } else if (rightChild !== undefined) {
    trim(leftChild, index * 2, depth - 1, flags);
    trim(rightChild, index * 2 + 1, depth - 1, flags);
    if (leftChild.leftChild === undefined && rightChild.rightChild === undefined) {
      node.leftChild = undefined;
      node.rightChild = undefined;
    }
  }
};

const depthFirstSearchWorker = (node: MerkleTreeNode, mutableHashes: UInt256[]): void => {
  const { leftChild, rightChild } = node;
  if (leftChild === undefined || rightChild === undefined) {
    mutableHashes.push(node.hash);
  } else {
    depthFirstSearchWorker(leftChild, mutableHashes);
    depthFirstSearchWorker(rightChild, mutableHashes);
  }
};

const depthFirstSearch = (node: MerkleTreeNode): ReadonlyArray<UInt256> => {
  const mutableHashes: UInt256[] = [];
  depthFirstSearchWorker(node, mutableHashes);

  return mutableHashes;
};

export class MerkleTree {
  public static computeRoot(hashes: ReadonlyArray<UInt256>): UInt256 {
    const tree = new this(hashes);

    return tree.root.hash;
  }

  public readonly root: MerkleTreeNode;
  public readonly depth: number;

  public constructor(hashesOrNode: ReadonlyArray<UInt256> | MerkleTreeNode) {
    this.root = Array.isArray(hashesOrNode)
      ? build(hashesOrNode.map((hash) => new MerkleTreeNode({ hash })))
      : (hashesOrNode as MerkleTreeNode);
    this.depth = 1;
    // tslint:disable-next-line no-loop-statement no-let
    for (let node = this.root; node.leftChild !== undefined; node = node.leftChild) {
      this.depth += 1;
    }
  }

  public trim(flags: ReadonlyArray<boolean>): MerkleTree {
    const result = this.root.clone();
    trim(result, 0, this.depth, flags);

    return new MerkleTree(result);
  }

  public depthFirstSearch(): ReadonlyArray<UInt256> {
    return depthFirstSearch(this.root);
  }

  public toHashArray(): ReadonlyArray<UInt256> {
    return this.depthFirstSearch();
  }
}
