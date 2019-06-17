import { ECPoint, UInt160, UInt256, UInt256Hex } from '@neo-one/client-common';
import { Block } from '@neo-one/node-core';
import BN from 'bn.js';
import { HeaderContext } from './HeaderContext';
import { SignatureSentContext } from './SignatureSentContext';
import { Transactions } from './types';
import { ViewChangingContext } from './ViewChangingContext';

interface RequestReceivedContextAdd {
  readonly viewNumber: number;
  readonly myIndex: number;
  readonly primaryIndex: number;
  readonly expectedView: readonly number[];
  readonly validators: readonly ECPoint[];
  readonly blockReceivedTimeSeconds: number;
  readonly transactions: Transactions;
  readonly signatures: ReadonlyArray<Buffer | undefined>;
  readonly header:
    | {
        readonly type: 'new';
        readonly previousHash: UInt256;
        readonly transactionHashes: readonly UInt256Hex[];
        readonly blockIndex: number;
        readonly nonce: BN;
        readonly timestamp: number;
        readonly nextConsensus: UInt160;
      }
    | {
        readonly type: 'existing';
        readonly block: Block;
        readonly transactionHashes: readonly UInt256Hex[];
      };
}

export class RequestReceivedContext extends HeaderContext<RequestReceivedContext> {
  public constructor({
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

  public clone({ transactions }: { readonly transactions: Transactions }): RequestReceivedContext {
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

  public cloneViewChanging({ expectedView }: { readonly expectedView: readonly number[] }): ViewChangingContext {
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

  public cloneSignatureSent({
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
      header: {
        type: 'existing',
        block: this.header,
        transactionHashes: this.transactionHashes,
      },

      signatures,
    });
  }

  public cloneExpectedView({ expectedView }: { readonly expectedView: readonly number[] }): RequestReceivedContext {
    return new RequestReceivedContext({
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
  }): RequestReceivedContext {
    return new RequestReceivedContext({
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
