/* @hash 76900619feb62adc7898a536b654717e */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  BufferString,
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

export interface ICOSmartContract extends SmartContract<ICOReadSmartContract> {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly deploy: {
    (
      owner?: AddressString,
      startTimeSeconds?: BigNumber,
      icoDurationSeconds?: BigNumber,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>>;
    readonly confirmed: {
      (
        owner?: AddressString,
        startTimeSeconds?: BigNumber,
        icoDurationSeconds?: BigNumber,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly mintTokens: {
    (options?: InvokeReceiveTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (options?: InvokeReceiveTransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly owner: () => Promise<AddressString>;
  readonly refundAssets: {
    (transactionHash: Hash256String, options?: InvokeSendTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (transactionHash: Hash256String, options?: InvokeSendTransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
  readonly upgrade: {
    (
      script: BufferString,
      parameterList: BufferString,
      returnType: BigNumber,
      properties: BigNumber,
      contractName: string,
      codeVersion: string,
      author: string,
      email: string,
      description: string,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>>;
    readonly confirmed: {
      (
        script: BufferString,
        parameterList: BufferString,
        returnType: BigNumber,
        properties: BigNumber,
        contractName: string,
        codeVersion: string,
        author: string,
        email: string,
        description: string,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<boolean, ICOEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
}

export interface ICOReadSmartContract extends ReadSmartContract<ICOEvent> {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly owner: () => Promise<AddressString>;
  readonly remaining: () => Promise<BigNumber>;
  readonly startTimeSeconds: () => Promise<BigNumber>;
}
