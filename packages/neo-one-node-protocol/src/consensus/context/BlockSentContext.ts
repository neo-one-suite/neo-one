import { Context } from './Context';

export class BlockSentContext extends Context<BlockSentContext> {
  public cloneExpectedView({ expectedView }: { readonly expectedView: ReadonlyArray<number> }): BlockSentContext {
    return new BlockSentContext({
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
