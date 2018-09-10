/* @hash 64c1b7b501b0396bfdd889959b5705bb */
// tslint:disable
/* eslint-disable */
import {
  GetOptions,
  Hash256String,
  InvocationTransaction,
  InvokeReceipt,
  InvokeSendTransactionOptions,
  ReadSmartContract,
  SmartContract,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client';

export type ContractEvent = never;

export interface ContractSmartContract extends SmartContract<ContractReadSmartContract> {
  readonly deploy: {
    (options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, ContractEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (options?: TransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, ContractEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly myFirstMethod: {
    (options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, ContractEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (options?: TransactionOptions & GetOptions): Promise<
        InvokeReceipt<undefined, ContractEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly refundAssets: {
    (transactionHash: Hash256String, options?: InvokeSendTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, ContractEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (transactionHash: Hash256String, options?: InvokeSendTransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, ContractEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
}

export interface ContractReadSmartContract extends ReadSmartContract<ContractEvent> {}
