/* @flow */
import type BN from 'bn.js';
import {
  type Block,
  type ECPoint,
  type UInt160,
  type UInt256,
  type UInt256Hex,
} from '@neo-one/client-core';

import HeaderContext from './HeaderContext';
import type { Transactions } from './types';

type RequestSentContextAdd = {|
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

export default class RequestSentContext extends HeaderContext {
  constructor({
    viewNumber,
    myIndex,
    primaryIndex,
    expectedView,
    validators,
    blockReceivedTimeSeconds,
    transactions,
    signatures,
    header,
  }: RequestSentContextAdd) {
    super({
      type: 'primary',
      viewNumber,
      myIndex,
      primaryIndex,
      expectedView,
      validators,
      blockReceivedTimeSeconds,
      transactions,
      signatures,
      header,
    });
  }

  cloneExpectedView({ expectedView }: {| expectedView: Array<number> |}): this {
    return new this.constructor({
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      primaryIndex: this.primaryIndex,
      expectedView,
      validators: this.validators,
      blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
      transactions: this.transactions,
      signatures: this.signatures,
      header: {
        type: 'existing',
        block: this.header,
        transactionHashes: this.transactionHashes,
      },
    });
  }

  cloneSignatures({ signatures }: {| signatures: Array<?Buffer> |}): this {
    return new this.constructor({
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      primaryIndex: this.primaryIndex,
      expectedView: this.expectedView,
      validators: this.validators,
      blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
      transactions: this.transactions,
      signatures,
      header: {
        type: 'existing',
        block: this.header,
        transactionHashes: this.transactionHashes,
      },
    });
  }
}
