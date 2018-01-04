/* @flow */
import { type ECPoint, type UInt256 } from '@neo-one/client-core';

import Context from './Context';

type ViewChangingContextAdd = {|
  previousHash: UInt256,
  blockIndex: number,
  viewNumber: number,
  myIndex: number,
  primaryIndex: number,
  expectedView: Array<number>,
  validators: Array<ECPoint>,
  blockReceivedTimeSeconds: number,
|};

export default class ViewChangingContext extends Context {
  constructor({
    previousHash,
    blockIndex,
    viewNumber,
    myIndex,
    primaryIndex,
    expectedView,
    validators,
    blockReceivedTimeSeconds,
  }: ViewChangingContextAdd) {
    super({
      type: 'backup',
      previousHash,
      blockIndex,
      viewNumber,
      myIndex,
      primaryIndex,
      expectedView,
      validators,
      blockReceivedTimeSeconds,
    });
  }

  cloneExpectedView({ expectedView }: {| expectedView: Array<number> |}): this {
    return new this.constructor({
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
}
