/* @hash 4a15b5497f4ff197c914f4a871d746b3 */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Client,
  Event,
  ForwardOptions,
  ForwardValue,
  GetOptions,
  InvocationTransaction,
  InvokeReceipt,
  SmartContract,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export interface EscrowBalanceAvailableEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly asset: AddressString;
  readonly amount: BigNumber;
}
export interface EscrowBalanceAvailableEvent extends Event<'balanceAvailable', EscrowBalanceAvailableEventParameters> {}
export interface EscrowBalanceClaimedEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly asset: AddressString;
  readonly amount: BigNumber;
}
export interface EscrowBalanceClaimedEvent extends Event<'balanceClaimed', EscrowBalanceClaimedEventParameters> {}
export interface EscrowBalanceRefundedEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly asset: AddressString;
  readonly amount: BigNumber;
}
export interface EscrowBalanceRefundedEvent extends Event<'balanceRefunded', EscrowBalanceRefundedEventParameters> {}
export interface EscrowTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface EscrowTransferEvent extends Event<'transfer', EscrowTransferEventParameters> {}
export type EscrowEvent =
  | EscrowBalanceAvailableEvent
  | EscrowBalanceClaimedEvent
  | EscrowBalanceRefundedEvent
  | EscrowTransferEvent;

export interface EscrowSmartContract<TClient extends Client = Client> extends SmartContract<TClient, EscrowEvent> {
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
  readonly forwardApproveReceiveTransferArgs: (to: AddressString) => [ForwardOptions<EscrowEvent>, ForwardValue];
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
