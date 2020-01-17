import BN from 'bn.js';
import { OpInvokeArgs } from '../constants';
import { StackItem } from '../stackItem';
import { NativeContractBase } from './NativeContractBase';

export interface ContractMethodMetadataAdd {
  readonly delegate: (options: OpInvokeArgs) => Promise<StackItem>;
  readonly price: BN;
}

export interface ContractMethodMetadataBase {
  readonly delegate: (contract: NativeContractBase) => (options: OpInvokeArgs) => Promise<StackItem>;
  readonly price: BN;
}

export class ContractMethodMetadata {
  public readonly delegate: (options: OpInvokeArgs) => Promise<StackItem>;
  public readonly price: BN;

  public constructor({ delegate, price }: ContractMethodMetadataAdd) {
    this.delegate = delegate;
    this.price = price;
  }
}
