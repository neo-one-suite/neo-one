// tslint:disable
import {
  AddressString,
  BufferString,
  Event,
  InvokeReceipt,
  InvokeTransactionOptions,
  ReadSmartContract,
  SmartContract,
  TransactionResult,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export type TokenEvent = TokenTransferEvent | TokenTraceEvent | TokenErrorEvent | TokenConsoleLogEvent;

export interface TokenTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface TokenTransferEvent extends Event<'transfer', TokenTransferEventParameters> {}
export interface TokenTraceEventParameters {
  readonly line: BigNumber;
}
export interface TokenTraceEvent extends Event<'trace', TokenTraceEventParameters> {}
export interface TokenErrorEventParameters {
  readonly line: BigNumber;
  readonly message: string;
}
export interface TokenErrorEvent extends Event<'error', TokenErrorEventParameters> {}
export interface TokenConsoleLogEventParameters {
  readonly line: BigNumber;
  readonly args: BufferString;
}
export interface TokenConsoleLogEvent extends Event<'console.log', TokenConsoleLogEventParameters> {}

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
