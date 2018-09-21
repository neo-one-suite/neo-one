/* @hash e5155b7af16e2cd721ba78ae3790ed1e */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  ForwardValue,
  GetOptions,
  InvocationTransaction,
  InvokeReceipt,
  ReadSmartContract,
  SmartContract,
  TransactionOptions,
  TransactionResult,
  Transfer,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export type EscrowEvent = never;

export interface EscrowSmartContract extends SmartContract<EscrowReadSmartContract> {
  readonly approveReceiveTransfer: {
    (
      from: AddressString,
      amount: BigNumber,
      asset: AddressString,
      to: AddressString,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<boolean, EscrowEvent>, InvocationTransaction>>;
    readonly confirmed: {
      (
        from: AddressString,
        amount: BigNumber,
        asset: AddressString,
        to: AddressString,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<boolean, EscrowEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
  readonly forwardApproveReceiveTransferArgs: (to: AddressString) => [ForwardValue];
  readonly balanceOf: (from: AddressString, to: AddressString, asset: AddressString) => Promise<BigNumber>;
  readonly claim: {
    (
      from: AddressString,
      to: AddressString,
      asset: AddressString,
      amount: BigNumber,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<boolean, EscrowEvent>, InvocationTransaction>>;
    readonly confirmed: {
      (
        from: AddressString,
        to: AddressString,
        asset: AddressString,
        amount: BigNumber,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<boolean, EscrowEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
  readonly deploy: {
    (options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, EscrowEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (options?: TransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, EscrowEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly onRevokeSendTransfer: {
    (from: AddressString, amount: BigNumber, asset: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, EscrowEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (
        from: AddressString,
        amount: BigNumber,
        asset: AddressString,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<undefined, EscrowEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
  readonly refund: {
    (
      from: AddressString,
      to: AddressString,
      asset: AddressString,
      amount: BigNumber,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<boolean, EscrowEvent>, InvocationTransaction>>;
    readonly confirmed: {
      (
        from: AddressString,
        to: AddressString,
        asset: AddressString,
        amount: BigNumber,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<boolean, EscrowEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
}

export interface EscrowReadSmartContract extends ReadSmartContract<EscrowEvent> {
  readonly balanceOf: (from: AddressString, to: AddressString, asset: AddressString) => Promise<BigNumber>;
}
