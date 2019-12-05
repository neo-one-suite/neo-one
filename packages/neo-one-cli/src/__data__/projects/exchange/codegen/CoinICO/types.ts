/* @hash 54c80006770301fdd48e7cfa29de9dbd */
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

export interface CoinICOTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface CoinICOTransferEvent extends Event<'transfer', CoinICOTransferEventParameters> {}
export interface CoinICOApproveSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface CoinICOApproveSendTransferEvent
  extends Event<'approveSendTransfer', CoinICOApproveSendTransferEventParameters> {}
export interface CoinICORevokeSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface CoinICORevokeSendTransferEvent
  extends Event<'revokeSendTransfer', CoinICORevokeSendTransferEventParameters> {}
export type CoinICOEvent = CoinICOTransferEvent | CoinICOApproveSendTransferEvent | CoinICORevokeSendTransferEvent;

export interface CoinICOSmartContract<TClient extends Client = Client> extends SmartContract<TClient, CoinICOEvent> {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly deploy: {
    (
      owner?: AddressString,
      startTimeSeconds?: BigNumber,
      icoDurationSeconds?: BigNumber,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<boolean, CoinICOEvent>, InvocationTransaction>>;
    readonly confirmed: (
      owner?: AddressString,
      startTimeSeconds?: BigNumber,
      icoDurationSeconds?: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, CoinICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly mintTokens: {
    (options?: InvokeReceiveTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, CoinICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      options?: InvokeReceiveTransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, CoinICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly owner: () => Promise<AddressString>;
  readonly refundAssets: {
    (options?: InvokeSendUnsafeTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, CoinICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      options?: InvokeSendUnsafeTransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, CoinICOEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
}

export interface CoinICOMigrationSmartContract {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly deploy: (
    owner?: AddressString | Promise<AddressString>,
    startTimeSeconds?: BigNumber | Promise<BigNumber>,
    icoDurationSeconds?: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, CoinICOEvent> & { readonly transaction: InvocationTransaction }>;
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly mintTokens: (
    options?: InvokeReceiveTransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, CoinICOEvent> & { readonly transaction: InvocationTransaction }>;
  readonly owner: () => Promise<AddressString>;
  readonly refundAssets: (
    options?: InvokeSendUnsafeTransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, CoinICOEvent> & { readonly transaction: InvocationTransaction }>;
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
}
