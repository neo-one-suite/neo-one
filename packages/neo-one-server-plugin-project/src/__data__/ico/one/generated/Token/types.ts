/* @hash 47ddae4a5f22a896d4963ddcec2cf288 */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Event,
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
import BigNumber from 'bignumber.js';

export type TokenEvent = TokenTransferEvent;

export interface TokenTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface TokenTransferEvent extends Event<'transfer', TokenTransferEventParameters> {}

export interface TokenSmartContract extends SmartContract<TokenReadSmartContract> {
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly deploy: {
    (options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly issue: {
    (to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      to: AddressString,
      amount: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly name: () => Promise<string>;
  readonly refundAssets: {
    (transactionHash: Hash256String, options?: InvokeSendTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      transactionHash: Hash256String,
      options?: InvokeSendTransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
  readonly transfer: {
    (from: AddressString, to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      to: AddressString,
      amount: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  };
}

export interface TokenReadSmartContract extends ReadSmartContract<TokenEvent> {
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly name: () => Promise<string>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
}
