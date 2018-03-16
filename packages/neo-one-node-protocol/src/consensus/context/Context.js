/* @flow */
import { type ECPoint, type UInt256, common } from '@neo-one/client-core';

import type BlockSentContext from './BlockSentContext';
import type InitialContext from './InitialContext';
import type { Type } from './types';

export type ContextAdd = {|
  type: Type,
  previousHash: UInt256,
  blockIndex: number,
  viewNumber: number,
  myIndex: number,
  primaryIndex: number,
  expectedView: Array<number>,
  validators: Array<ECPoint>,
  blockReceivedTimeSeconds: number,
|};

export default class Context {
  version: number;
  type: Type;
  previousHash: UInt256;
  blockIndex: number;
  viewNumber: number;
  myIndex: number;
  primaryIndex: number;
  expectedView: Array<number>;
  validators: Array<ECPoint>;
  blockReceivedTimeSeconds: number;

  constructor({
    type,
    previousHash,
    blockIndex,
    viewNumber,
    myIndex,
    primaryIndex,
    expectedView,
    validators,
    blockReceivedTimeSeconds,
  }: ContextAdd) {
    this.version = 0;
    this.type = type;
    this.previousHash = previousHash;
    this.blockIndex = blockIndex;
    this.viewNumber = viewNumber;
    this.myIndex = myIndex;
    this.primaryIndex = primaryIndex;
    this.expectedView = expectedView;
    this.validators = validators;
    this.blockReceivedTimeSeconds = blockReceivedTimeSeconds;
  }

  get M(): number {
    return Math.floor(
      this.validators.length - (this.validators.length - 1) / 3,
    );
  }

  // eslint-disable-next-line
  cloneInitial(options: {|
    type: Type,
    previousHash?: UInt256,
    blockIndex?: number,
    viewNumber: number,
    myIndex?: number,
    primaryIndex: number,
    expectedView?: Array<number>,
    validators?: Array<ECPoint>,
    blockReceivedTimeSeconds?: number,
  |}): InitialContext {
    throw new Error('Monkey patched');
  }

  cloneBlockSent(): BlockSentContext {
    throw new Error('Monkey patched');
  }

  // eslint-disable-next-line
  cloneExpectedView(options: {| expectedView: Array<number> |}): this {
    throw new Error('Not Implemented');
  }

  toJSON(): Object {
    return {
      class: this.constructor.name,
      version: this.version,
      type: this.type,
      previousHash: common.uInt256ToString(this.previousHash),
      blockIndex: this.blockIndex,
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      primaryIndex: this.primaryIndex,
      expectedView: [...this.expectedView],
      validators: this.validators.map(validator =>
        common.ecPointToString(validator),
      ),
      blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
    };
  }
}
