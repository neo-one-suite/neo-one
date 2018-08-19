// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Event,
  InvokeReceipt,
  InvokeTransactionOptions,
  ReadSmartContract,
  SmartContract,
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
  readonly deploy: (
    owner?: AddressString,
    options?: InvokeTransactionOptions,
  ) => Promise<TransactionResult<InvokeReceipt<boolean, TokenEvent>>>;
  readonly issue: (
    to: AddressString,
    amount: BigNumber,
    options?: InvokeTransactionOptions,
  ) => Promise<TransactionResult<InvokeReceipt<boolean, TokenEvent>>>;
  readonly name: () => Promise<string>;
  readonly owner: () => Promise<AddressString>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
  readonly transfer: (
    from: AddressString,
    to: AddressString,
    amount: BigNumber,
    options?: InvokeTransactionOptions,
  ) => Promise<TransactionResult<InvokeReceipt<boolean, TokenEvent>>>;
}

export interface TokenReadSmartContract extends ReadSmartContract<TokenEvent> {
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly name: () => Promise<string>;
  readonly owner: () => Promise<AddressString>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
}
