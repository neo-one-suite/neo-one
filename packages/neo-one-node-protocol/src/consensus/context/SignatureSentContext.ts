import { HeaderContext } from './HeaderContext';
import { RequestSentContext } from './RequestSentContext';
import { Type } from './types';

export class SignatureSentContext extends HeaderContext<SignatureSentContext> {
  public clone({
    type,
    primaryIndex,
    viewNumber,
  }: {
    readonly type: Type;
    readonly primaryIndex: number;
    readonly viewNumber: number;
  }): SignatureSentContext {
    return new SignatureSentContext({
      type,
      viewNumber,
      myIndex: this.myIndex,
      primaryIndex,
      expectedView: this.expectedView,
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

  public cloneExpectedView({ expectedView }: { readonly expectedView: ReadonlyArray<number> }): SignatureSentContext {
    return new SignatureSentContext({
      type: this.type,
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

  public cloneSignatures({
    signatures,
  }: {
    readonly signatures: ReadonlyArray<Buffer | undefined>;
  }): SignatureSentContext {
    return new SignatureSentContext({
      type: this.type,
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

  public cloneRequestSent(): RequestSentContext {
    return new RequestSentContext({
      viewNumber: this.viewNumber,
      myIndex: this.myIndex,
      primaryIndex: this.primaryIndex,
      expectedView: this.expectedView,
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
}
