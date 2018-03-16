/* @flow */
import type BN from 'bn.js';
import {
  type ECPoint,
  type UInt160,
  type UInt256,
  type UInt256Hex,
  Block,
  MerkleTree,
  common,
} from '@neo-one/client-core';

import Context from './Context';
import type { Transactions, Type } from './types';

type HeaderContextAdd = {|
  type: Type,
  viewNumber: number,
  myIndex: number,
  primaryIndex: number,
  expectedView: Array<number>,
  validators: Array<ECPoint>,
  blockReceivedTimeSeconds: number,
  transactions: Transactions,
  signatures: Array<?Buffer>,
  header:
    | {|
        type: 'new',
        previousHash: UInt256,
        transactionHashes: Array<UInt256Hex>,
        blockIndex: number,
        nonce: BN,
        timestamp: number,
        nextConsensus: UInt160,
      |}
    | {|
        type: 'existing',
        block: Block,
        transactionHashes: Array<UInt256Hex>,
      |},
|};

export default class HeaderContext extends Context {
  transactions: Transactions;
  transactionHashes: Array<UInt256Hex>;
  transactionHashesSet: Set<UInt256Hex>;
  signatures: Array<?Buffer>;
  header: Block;

  constructor({
    type,
    viewNumber,
    myIndex,
    primaryIndex,
    expectedView,
    validators,
    blockReceivedTimeSeconds,
    transactions,
    signatures,
    header,
  }: HeaderContextAdd) {
    let previousHash;
    let transactionHashes;
    let blockIndex;
    let nonce;
    let timestamp;
    let nextConsensus;
    if (header.type === 'existing') {
      // eslint-disable-next-line
      previousHash = header.block.previousHash;
      // eslint-disable-next-line
      transactionHashes = header.transactionHashes;
      blockIndex = header.block.index;
      nonce = header.block.consensusData;
      // eslint-disable-next-line
      timestamp = header.block.timestamp;
      // eslint-disable-next-line
      nextConsensus = header.block.nextConsensus;
    } else {
      // eslint-disable-next-line
      previousHash = header.previousHash;
      // eslint-disable-next-line
      transactionHashes = header.transactionHashes;
      // eslint-disable-next-line
      blockIndex = header.blockIndex;
      // eslint-disable-next-line
      nonce = header.nonce;
      // eslint-disable-next-line
      timestamp = header.timestamp;
      // eslint-disable-next-line
      nextConsensus = header.nextConsensus;
    }
    super({
      type,
      previousHash,
      blockIndex,
      viewNumber,
      myIndex,
      primaryIndex,
      expectedView,
      validators,
      blockReceivedTimeSeconds,
    });
    this.transactions = transactions;
    this.transactionHashes = transactionHashes;
    this.transactionHashesSet = new Set(transactionHashes);
    this.signatures = signatures;
    if (header.type === 'existing') {
      this.header = header.block;
    } else {
      this.header = new Block({
        version: this.version,
        previousHash: this.previousHash,
        merkleRoot: MerkleTree.computeRoot(
          this.transactionHashes.map(hash => common.hexToUInt256(hash)),
        ),
        timestamp,
        index: this.blockIndex,
        consensusData: nonce,
        nextConsensus,
        transactions: [],
      });
    }
  }

  // eslint-disable-next-line
  cloneSignatures({ signatures }: {| signatures: Array<?Buffer> |}): this {
    throw new Error('Not Implemented');
  }

  toJSON(): Object {
    return {
      ...super.toJSON(),
      transactionHashes: this.transactionHashes.map(hash =>
        common.uInt256ToString(hash),
      ),
      signatures: this.signatures.map(
        signature => (signature == null ? 'null' : signature.toString('hex')),
      ),
    };
  }
}
