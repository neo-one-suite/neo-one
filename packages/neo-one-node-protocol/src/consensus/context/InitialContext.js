/* @flow */
import Context from './Context';

export default class InitialContext extends Context {
  cloneExpectedView({ expectedView }: {| expectedView: Array<number> |}): this {
    return new this.constructor({
      type: this.type,
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
