import { common, ECPoint, UInt256 } from '@neo-one/client-common';
import { Type } from './types';

export interface ContextAdd {
  readonly type: Type;
  readonly previousHash: UInt256;
  readonly blockIndex: number;
  readonly viewNumber: number;
  readonly myIndex: number;
  readonly primaryIndex: number;
  readonly expectedView: ReadonlyArray<number>;
  readonly validators: ReadonlyArray<ECPoint>;
  readonly blockReceivedTimeSeconds: number;
}

// tslint:disable-next-line no-any
export class Context<TTHis extends Context<TTHis> = Context<any>> {
  public readonly version: number;
  public readonly type: Type;
  public readonly previousHash: UInt256;
  public readonly blockIndex: number;
  public readonly viewNumber: number;
  public readonly myIndex: number;
  public readonly primaryIndex: number;
  public readonly expectedView: ReadonlyArray<number>;
  public readonly validators: ReadonlyArray<ECPoint>;
  public readonly blockReceivedTimeSeconds: number;

  public constructor({
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

  public get M(): number {
    return Math.floor(this.validators.length - (this.validators.length - 1) / 3);
  }

  public cloneExpectedView(_options: { readonly expectedView: ReadonlyArray<number> }): TTHis {
    throw new Error('Not Implemented');
  }

  public toJSON(): object {
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
      validators: this.validators.map((validator) => common.ecPointToString(validator)),

      blockReceivedTimeSeconds: this.blockReceivedTimeSeconds,
    };
  }
}
