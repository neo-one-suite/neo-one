import { ECPoint, UInt256 } from '@neo-one/client-common';
import { Context } from './Context';

interface ViewChangingContextAdd {
  readonly previousHash: UInt256;
  readonly blockIndex: number;
  readonly viewNumber: number;
  readonly myIndex: number;
  readonly primaryIndex: number;
  readonly expectedView: readonly number[];
  readonly validators: readonly ECPoint[];
  readonly blockReceivedTimeSeconds: number;
}

export class ViewChangingContext extends Context<ViewChangingContext> {
  public constructor({
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

  public cloneExpectedView({ expectedView }: { readonly expectedView: readonly number[] }): ViewChangingContext {
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
}
