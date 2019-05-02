import { ECPoint, UInt160, UInt256, UInt256Hex } from '@neo-one/client-common';
import { Block } from '@neo-one/node-core';
import BN from 'bn.js';
import { HeaderContext } from './HeaderContext';
import { Transactions } from './types';

interface RequestSentContextAdd {
  readonly viewNumber: number;
  readonly myIndex: number;
  readonly primaryIndex: number;
  readonly expectedView: readonly number[];
  readonly validators: readonly ECPoint[];
  readonly blockReceivedTimeSeconds: number;
  readonly transactions: Transactions;
  readonly signatures: readonly (Buffer | undefined)[];
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

export class RequestSentContext extends HeaderContext<RequestSentContext> {
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
  }: RequestSentContextAdd) {
    super({
      type: 'primary',
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

  public cloneExpectedView({ expectedView }: { readonly expectedView: readonly number[] }): RequestSentContext {
    return new RequestSentContext({
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

  public cloneSignatures({ signatures }: { readonly signatures: readonly (Buffer | undefined)[] }): RequestSentContext {
    return new RequestSentContext({
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
