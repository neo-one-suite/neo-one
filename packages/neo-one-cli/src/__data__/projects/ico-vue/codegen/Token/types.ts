/* @hash 42fc669f6a4783cc65d07d56271354f8 */
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
    readonly confirmed: (
      from: AddressString,
      amount: BigNumber,
      asset: AddressString,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly approveSendTransfer: {
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
  readonly approvedTransfer: (from: AddressString, to: AddressString) => Promise<BigNumber>;
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
  readonly onRevokeSendTransfer: {
    (from: AddressString, amount: BigNumber, asset: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, TokenEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      amount: BigNumber,
      asset: AddressString,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly revokeSendTransfer: {
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
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
  readonly transfer: {
    <TForwardOptions extends ForwardOptions<any>>(
      from: AddressString,
      to: AddressString,
      amount: BigNumber,
      forwardOptions?: TForwardOptions,
      ...approveArgs: ForwardValue[]
    ): Promise<
      TransactionResult<
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? TokenEvent | T : TokenEvent>,
        InvocationTransaction
      >
    >;
    <TForwardOptions extends ForwardOptions<any>>(
      from: AddressString,
      to: AddressString,
      amount: BigNumber,
      options?: TransactionOptions,
      forwardOptions?: TForwardOptions,
      ...approveArgs: ForwardValue[]
    ): Promise<
      TransactionResult<
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? TokenEvent | T : TokenEvent>,
        InvocationTransaction
      >
    >;
    readonly confirmed: {
      <TForwardOptions extends ForwardOptions<any>>(
        from: AddressString,
        to: AddressString,
        amount: BigNumber,
        forwardOptions?: TForwardOptions,
        ...approveArgs: ForwardValue[]
      ): Promise<
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? TokenEvent | T : TokenEvent> & {
          readonly transaction: InvocationTransaction;
        }
      >;
      <TForwardOptions extends ForwardOptions<any>>(
        from: AddressString,
        to: AddressString,
        amount: BigNumber,
        options?: TransactionOptions & GetOptions,
        forwardOptions?: TForwardOptions,
        ...approveArgs: ForwardValue[]
      ): Promise<
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? TokenEvent | T : TokenEvent> & {
          readonly transaction: InvocationTransaction;
        }
      >;
    };
  };
}

export interface TokenMigrationSmartContract {
  readonly approveReceiveTransfer: (
    from: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    asset: AddressString | Promise<AddressString>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  readonly approveSendTransfer: (
    from: AddressString | Promise<AddressString>,
    to: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  readonly approvedTransfer: (
    from: AddressString | Promise<AddressString>,
    to: AddressString | Promise<AddressString>,
  ) => Promise<BigNumber>;
  readonly balanceOf: (address: AddressString | Promise<AddressString>) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly deploy: (
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  readonly issue: (
    to: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  readonly name: () => Promise<string>;
  readonly onRevokeSendTransfer: (
    from: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    asset: AddressString | Promise<AddressString>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  readonly revokeSendTransfer: (
    from: AddressString | Promise<AddressString>,
    to: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, TokenEvent> & { readonly transaction: InvocationTransaction }>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
  readonly transfer: {
    <TForwardOptions extends ForwardOptions<any>>(
      from: AddressString | Promise<AddressString>,
      to: AddressString | Promise<AddressString>,
      amount: BigNumber | Promise<BigNumber>,
      forwardOptions?: TForwardOptions,
      ...approveArgs: (ForwardValue | Promise<ForwardValue>)[]
    ): Promise<
      InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? TokenEvent | T : TokenEvent> & {
        readonly transaction: InvocationTransaction;
      }
    >;
    <TForwardOptions extends ForwardOptions<any>>(
      from: AddressString | Promise<AddressString>,
      to: AddressString | Promise<AddressString>,
      amount: BigNumber | Promise<BigNumber>,
      options?: TransactionOptions & GetOptions,
      forwardOptions?: TForwardOptions,
      ...approveArgs: (ForwardValue | Promise<ForwardValue>)[]
    ): Promise<
      InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? TokenEvent | T : TokenEvent> & {
        readonly transaction: InvocationTransaction;
      }
    >;
  };
}
