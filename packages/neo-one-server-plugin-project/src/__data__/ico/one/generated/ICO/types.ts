// tslint:disable
import {
  BufferString,
  Event,
  Hash160String,
  InvokeReceipt,
  ReadSmartContract,
  SmartContract,
  TransactionResult,
} from '@neo-one/client';

export type ICOEvent = ICOTransferEvent | ICORefundEvent | ICOTraceEvent | ICOErrorEvent | ICOConsole_logEvent;

export interface ICOTransferEventParameters {
  readonly from: Hash160String | undefined;
  readonly to: Hash160String | undefined;
  readonly amount: number;
}
export interface ICOTransferEvent extends Event<'transfer', ICOTransferEventParameters> {}
export interface ICORefundEventParameters {}
export interface ICORefundEvent extends Event<'refund', ICORefundEventParameters> {}
export interface ICOTraceEventParameters {
  readonly line: number;
}
export interface ICOTraceEvent extends Event<'trace', ICOTraceEventParameters> {}
export interface ICOErrorEventParameters {
  readonly line: number;
  readonly message: string;
}
export interface ICOErrorEvent extends Event<'error', ICOErrorEventParameters> {}
export interface ICOConsole_logEventParameters {
  readonly line: number;
  readonly args: BufferString;
}
export interface ICOConsole_logEvent extends Event<'console.log', ICOConsole_logEventParameters> {}

export interface ICOSmartContract extends SmartContract<ICOReadSmartContract> {
  readonly amountPerNEO: () => Promise<number>;
  readonly balanceOf: (address: Hash160String) => Promise<number>;
  readonly decimals: () => Promise<number>;
  readonly deploy: (
    owner?: Hash160String,
    startTimeSeconds?: number,
    icoDurationSeconds?: number,
  ) => TransactionResult<InvokeReceipt<boolean, ICOEvent>>;
  readonly icoDurationSeconds: () => Promise<number>;
  readonly mintTokens: () => TransactionResult<InvokeReceipt<boolean, ICOEvent>>;
  readonly name: () => Promise<string>;
  readonly owner: () => Promise<Hash160String>;
  readonly remaining: () => Promise<number>;
  readonly startTimeSeconds: () => Promise<number>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<number>;
  readonly transfer: (
    from: Hash160String,
    to: Hash160String,
    amount: number,
  ) => TransactionResult<InvokeReceipt<boolean, ICOEvent>>;
}

export interface ICOReadSmartContract extends ReadSmartContract<ICOEvent> {
  readonly amountPerNEO: () => Promise<number>;
  readonly balanceOf: (address: Hash160String) => Promise<number>;
  readonly decimals: () => Promise<number>;
  readonly icoDurationSeconds: () => Promise<number>;
  readonly name: () => Promise<string>;
  readonly owner: () => Promise<Hash160String>;
  readonly remaining: () => Promise<number>;
  readonly startTimeSeconds: () => Promise<number>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<number>;
}
