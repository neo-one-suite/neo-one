/* @hash 9bf0216eb58d507381fb12f035c11543 */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Event,
  GetOptions,
  Hash256String,
  InvocationTransaction,
  InvokeReceipt,
  InvokeReceiveTransactionOptions,
  InvokeSendTransactionOptions,
  ReadSmartContract,
  SmartContract,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export type ICOEvent = ICOTransferEvent;

export interface ICOTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface ICOTransferEvent extends Event<'transfer', ICOTransferEventParameters> {}

export interface ICOSmartContract extends SmartContract<ICOReadSmartContract> {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly deploy: {
    (
      owner?: AddressString,
      startTimeSeconds?: BigNumber,
      icoDurationSeconds?: BigNumber,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>>;
    readonly confirmed: (
      owner?: AddressString,
      startTimeSeconds?: BigNumber,
      icoDurationSeconds?: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly mintTokens: {
    (options?: InvokeReceiveTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      options?: InvokeReceiveTransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly owner: () => Promise<AddressString>;
  readonly refundAssets: {
    (transactionHash: Hash256String, options?: InvokeSendTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      transactionHash: Hash256String,
      options?: InvokeSendTransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
}

export interface ICOReadSmartContract extends ReadSmartContract<ICOEvent> {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly owner: () => Promise<AddressString>;
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
}
