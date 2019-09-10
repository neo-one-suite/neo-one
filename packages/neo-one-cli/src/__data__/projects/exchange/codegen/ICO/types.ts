/* @hash 8b95758943c21aea9e5a6b028f96b9c0 */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Client,
  Event,
  GetOptions,
  InvocationTransaction,
  InvokeReceipt,
  InvokeReceiveTransactionOptions,
  InvokeSendUnsafeTransactionOptions,
  SmartContract,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export interface ICOTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface ICOTransferEvent extends Event<'transfer', ICOTransferEventParameters> {}
export interface ICOApproveSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface ICOApproveSendTransferEvent
  extends Event<'approveSendTransfer', ICOApproveSendTransferEventParameters> {}
export interface ICORevokeSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface ICORevokeSendTransferEvent extends Event<'revokeSendTransfer', ICORevokeSendTransferEventParameters> {}
export type ICOEvent = ICOTransferEvent | ICOApproveSendTransferEvent | ICORevokeSendTransferEvent;

export interface ICOSmartContract<TClient extends Client = Client> extends SmartContract<TClient, ICOEvent> {
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
      TransactionResult<InvokeReceipt<undefined, ICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      options?: InvokeReceiveTransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly owner: () => Promise<AddressString>;
  readonly refundAssets: {
    (options?: InvokeSendUnsafeTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, ICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      options?: InvokeSendUnsafeTransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
}

export interface ICOMigrationSmartContract {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly deploy: (
    owner?: AddressString | Promise<AddressString>,
    startTimeSeconds?: BigNumber | Promise<BigNumber>,
    icoDurationSeconds?: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly mintTokens: (
    options?: InvokeReceiveTransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  readonly owner: () => Promise<AddressString>;
  readonly refundAssets: (
    options?: InvokeSendUnsafeTransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ICOEvent> & { readonly transaction: InvocationTransaction }>;
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
}
