/* @hash 755127932cfaf65c9bea19b8dbfa4f5b */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Client,
  Event,
  ForwardValue,
  GetOptions,
  InvocationTransaction,
  InvokeReceipt,
  SmartContract,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export interface TokenTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface TokenTransferEvent extends Event<'transfer', TokenTransferEventParameters> {}
export interface TokenApproveSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface TokenApproveSendTransferEvent
  extends Event<'approveSendTransfer', TokenApproveSendTransferEventParameters> {}
export interface TokenRevokeSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface TokenRevokeSendTransferEvent
  extends Event<'revokeSendTransfer', TokenRevokeSendTransferEventParameters> {}
export type TokenEvent = TokenTransferEvent | TokenApproveSendTransferEvent | TokenRevokeSendTransferEvent;

export interface TokenSmartContract<TClient extends Client = Client> extends SmartContract<TClient, TokenEvent> {
  readonly approveReceiveTransfer: {
    (from: AddressString, amount: BigNumber, asset: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (
        from: AddressString,
        amount: BigNumber,
        asset: AddressString,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
  readonly approveSendTransfer: {
    (from: AddressString, to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (from: AddressString, to: AddressString, amount: BigNumber, options?: TransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly approvedTransfer: (from: AddressString, to: AddressString) => Promise<BigNumber>;
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly deploy: {
    (options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (options?: TransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly issue: {
    (to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (to: AddressString, amount: BigNumber, options?: TransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly name: () => Promise<string>;
  readonly onRevokeSendTransfer: {
    (from: AddressString, amount: BigNumber, asset: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (
        from: AddressString,
        amount: BigNumber,
        asset: AddressString,
        options?: TransactionOptions & GetOptions,
      ): Promise<InvokeReceipt<undefined, TokenEvent> & { readonly transaction: InvocationTransaction }>;
    };
  };
  readonly revokeSendTransfer: {
    (from: AddressString, to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (from: AddressString, to: AddressString, amount: BigNumber, options?: TransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
  readonly transfer: {
    (
      from: AddressString,
      to: AddressString,
      amount: BigNumber,
      options?: TransactionOptions,
      ...approveArgs: ForwardValue[]
    ): Promise<TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>>;
    (from: AddressString, to: AddressString, amount: BigNumber, ...approveArgs: ForwardValue[]): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (
        from: AddressString,
        to: AddressString,
        amount: BigNumber,
        options?: TransactionOptions & GetOptions,
        ...approveArgs: ForwardValue[]
      ): Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
      (from: AddressString, to: AddressString, amount: BigNumber, ...approveArgs: ForwardValue[]): Promise<
        InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }
      >;
    };
  };
}
