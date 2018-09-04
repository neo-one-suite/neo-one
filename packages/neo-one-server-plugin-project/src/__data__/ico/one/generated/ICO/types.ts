/* @hash 8a5cd2b88fbdfc8d6284a100768d67d0 */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Event,
  InvocationTransaction,
  InvokeReceipt,
  InvokeReceiveTransactionOptions,
  ReadSmartContract,
  SmartContract,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export type ICOEvent = ICOTransferEvent | ICORefundEvent;

export interface ICOTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface ICOTransferEvent extends Event<'transfer', ICOTransferEventParameters> {}
export interface ICORefundEventParameters {}
export interface ICORefundEvent extends Event<'refund', ICORefundEventParameters> {}

export interface ICOSmartContract extends SmartContract<ICOReadSmartContract> {
  readonly amountPerNEO: () => Promise<BigNumber>;
  readonly deploy: (
    owner?: AddressString,
    startTimeSeconds?: BigNumber,
    icoDurationSeconds?: BigNumber,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>>;
  readonly icoDurationSeconds: () => Promise<BigNumber>;
  readonly mintTokens: (
    options?: InvokeReceiveTransactionOptions,
  ) => Promise<TransactionResult<InvokeReceipt<boolean, ICOEvent>, InvocationTransaction>>;
  readonly owner: () => Promise<AddressString>;
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
