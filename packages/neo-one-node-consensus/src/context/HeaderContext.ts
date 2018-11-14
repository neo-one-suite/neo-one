import { common, ECPoint, UInt160, UInt256, UInt256Hex } from '@neo-one/client-common';
import { Block, MerkleTree } from '@neo-one/node-core';
import BN from 'bn.js';
import { Context } from './Context';
import { Transactions, Type } from './types';

interface HeaderContextAdd {
  readonly type: Type;
  readonly viewNumber: number;
  readonly myIndex: number;
  readonly primaryIndex: number;
  readonly expectedView: ReadonlyArray<number>;
  readonly validators: ReadonlyArray<ECPoint>;
  readonly blockReceivedTimeSeconds: number;
  readonly transactions: Transactions;
  readonly signatures: ReadonlyArray<Buffer | undefined>;
  readonly header:
    | {
        readonly type: 'new';
        readonly previousHash: UInt256;
        readonly transactionHashes: ReadonlyArray<UInt256Hex>;
        readonly blockIndex: number;
        readonly nonce: BN;
        readonly timestamp: number;
        readonly nextConsensus: UInt160;
      }
    | {
        readonly type: 'existing';
        readonly block: Block;
        readonly transactionHashes: ReadonlyArray<UInt256Hex>;
      };
}

// tslint:disable-next-line no-any
export class HeaderContext<T extends HeaderContext<T> = HeaderContext<any>> extends Context<T> {
  public readonly transactions: Transactions;
  public readonly transactionHashes: ReadonlyArray<UInt256Hex>;
  public readonly transactionHashesSet: Set<UInt256Hex>;
  public readonly signatures: ReadonlyArray<Buffer | undefined>;
  public readonly header: Block;

  public constructor({
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
    const previousHash = header.type === 'existing' ? header.block.previousHash : header.previousHash;
    const transactionHashes = header.transactionHashes;
    const blockIndex = header.type === 'existing' ? header.block.index : header.blockIndex;
    const nonce = header.type === 'existing' ? header.block.consensusData : header.nonce;
    const timestamp = header.type === 'existing' ? header.block.timestamp : header.timestamp;
    const nextConsensus = header.type === 'existing' ? header.block.nextConsensus : header.nextConsensus;
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
        merkleRoot: MerkleTree.computeRoot(this.transactionHashes.map((hash) => common.hexToUInt256(hash))),

        timestamp,
        index: this.blockIndex,
        consensusData: nonce,
        nextConsensus,
        transactions: [],
      });
    }
  }

  public cloneSignatures(_options: { readonly signatures: ReadonlyArray<Buffer | undefined> }): T {
    throw new Error('Not Implemented');
  }

  public toJSON(): object {
    return {
      ...super.toJSON(),
      transactionHashes: this.transactionHashes.map((hash) => common.uInt256ToString(hash)),

      signatures: this.signatures.map((signature) =>
        signature === undefined ? 'undefined' : signature.toString('hex'),
      ),
    };
  }
}
