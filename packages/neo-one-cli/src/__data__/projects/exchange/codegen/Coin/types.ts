/* @hash 2e74dd7bd230bb0fa2257db29d05b500 */
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

export interface CoinTransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface CoinTransferEvent extends Event<'transfer', CoinTransferEventParameters> {}
export interface CoinApproveSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface CoinApproveSendTransferEvent
  extends Event<'approveSendTransfer', CoinApproveSendTransferEventParameters> {}
export interface CoinRevokeSendTransferEventParameters {
  readonly from: AddressString;
  readonly to: AddressString;
  readonly amount: BigNumber;
}
export interface CoinRevokeSendTransferEvent
  extends Event<'revokeSendTransfer', CoinRevokeSendTransferEventParameters> {}
export type CoinEvent = CoinTransferEvent | CoinApproveSendTransferEvent | CoinRevokeSendTransferEvent;

export interface CoinSmartContract<TClient extends Client = Client> extends SmartContract<TClient, CoinEvent> {
  readonly approveReceiveTransfer: {
    (from: AddressString, amount: BigNumber, asset: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, CoinEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      amount: BigNumber,
      asset: AddressString,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly approveSendTransfer: {
    (from: AddressString, to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, CoinEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      to: AddressString,
      amount: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly approvedTransfer: (from: AddressString, to: AddressString) => Promise<BigNumber>;
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly deploy: {
    (options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, CoinEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly issue: {
    (to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, CoinEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      to: AddressString,
      amount: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly name: () => Promise<string>;
  readonly onRevokeSendTransfer: {
    (from: AddressString, amount: BigNumber, asset: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, CoinEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      amount: BigNumber,
      asset: AddressString,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly revokeSendTransfer: {
    (from: AddressString, to: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, CoinEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      to: AddressString,
      amount: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
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
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? CoinEvent | T : CoinEvent>,
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
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? CoinEvent | T : CoinEvent>,
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
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? CoinEvent | T : CoinEvent> & {
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
        InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? CoinEvent | T : CoinEvent> & {
          readonly transaction: InvocationTransaction;
        }
      >;
    };
  };
}

export interface CoinMigrationSmartContract {
  readonly approveReceiveTransfer: (
    from: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    asset: AddressString | Promise<AddressString>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  readonly approveSendTransfer: (
    from: AddressString | Promise<AddressString>,
    to: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  readonly approvedTransfer: (
    from: AddressString | Promise<AddressString>,
    to: AddressString | Promise<AddressString>,
  ) => Promise<BigNumber>;
  readonly balanceOf: (address: AddressString | Promise<AddressString>) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly deploy: (
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  readonly issue: (
    to: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  readonly name: () => Promise<string>;
  readonly onRevokeSendTransfer: (
    from: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    asset: AddressString | Promise<AddressString>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, CoinEvent> & { readonly transaction: InvocationTransaction }>;
  readonly revokeSendTransfer: (
    from: AddressString | Promise<AddressString>,
    to: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, CoinEvent> & { readonly transaction: InvocationTransaction }>;
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
      InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? CoinEvent | T : CoinEvent> & {
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
      InvokeReceipt<boolean, TForwardOptions extends ForwardOptions<infer T> ? CoinEvent | T : CoinEvent> & {
        readonly transaction: InvocationTransaction;
      }
    >;
  };
}
