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
import SignatureSentContext from './SignatureSentContext';
import type { Transactions } from './types';
import ViewChangingContext from './ViewChangingContext';

type RequestReceivedContextAdd = {|
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

export default class RequestReceivedContext extends HeaderContext {
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
  }: RequestReceivedContextAdd) {
    super({
      type: 'backup',
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

  clone({
    transactions,
  }: {|
    transactions: Transactions,
  |}): RequestReceivedContext {
    return new RequestReceivedContext({
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      primaryIndex: this.primaryIndex,
      expectedView: this.expectedView,
      validators: this.validators,
      blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
      transactions,
      header: {
        type: 'existing',
        block: this.header,
        transactionHashes: this.transactionHashes,
      },
      signatures: this.signatures,
    });
  }

  cloneViewChanging({
    expectedView,
  }: {|
    expectedView: Array<number>,
  |}): ViewChangingContext {
    return new ViewChangingContext({
      previousHash: this.previousHash,
      blockIndex: this.blockIndex,
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      primaryIndex: this.primaryIndex,
      expectedView,
      validators: this.validators,
      blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
    });
  }

  cloneSignatureSent({
    signatures,
  }: {|
    signatures: Array<?Buffer>,
  |}): SignatureSentContext {
    return new SignatureSentContext({
      type: this.type,
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      primaryIndex: this.primaryIndex,
      expectedView: this.expectedView,
      validators: this.validators,
      blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
      transactions: this.transactions,
      header: {
        type: 'existing',
        block: this.header,
        transactionHashes: this.transactionHashes,
      },
      signatures,
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
