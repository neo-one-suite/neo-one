/* @hash f18e529fec9346fe9495de5c7dcf153a */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Event,
  ForwardValue,
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

export type TokenEvent = TokenTransferEvent | TokenApproveSendTransferEvent | TokenRevokeSendTransferEvent;

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

export interface TokenSmartContract extends SmartContract<TokenReadSmartContract> {
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
  readonly refundAssets: {
    (transactionHash: Hash256String, options?: InvokeSendTransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: {
      (transactionHash: Hash256String, options?: InvokeSendTransactionOptions & GetOptions): Promise<
        InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }
      >;
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

export interface TokenReadSmartContract extends ReadSmartContract<TokenEvent> {
  readonly approvedTransfer: (from: AddressString, to: AddressString) => Promise<BigNumber>;
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly name: () => Promise<string>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
}
