import { Context } from './Context';

export class InitialContext extends Context<InitialContext> {
  public cloneExpectedView({ expectedView }: { readonly expectedView: readonly number[] }): InitialContext {
    return new InitialContext({
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
