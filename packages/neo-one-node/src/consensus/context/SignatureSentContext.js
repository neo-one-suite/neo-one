/* @flow */
import HeaderContext from './HeaderContext';
import RequestSentContext from './RequestSentContext';
import type { Type } from './types';

export default class SignatureSentContext extends HeaderContext {
  clone({
    type,
    primaryIndex,
    viewNumber,
  }: {|
    type: Type,
    primaryIndex: number,
    viewNumber: number,
  |}): SignatureSentContext {
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

  cloneExpectedView({ expectedView }: {| expectedView: Array<number> |}): this {
    return new this.constructor({
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

  cloneSignatures({ signatures }: {| signatures: Array<?Buffer> |}): this {
    return new this.constructor({
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

  cloneRequestSent(): RequestSentContext {
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
