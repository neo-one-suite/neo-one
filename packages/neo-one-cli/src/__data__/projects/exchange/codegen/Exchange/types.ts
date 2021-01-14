/* @hash 3555ebc02381102d8fba532cc5e0ab40 */
// tslint:disable
/* eslint-disable */
import {
  AddressString,
  Client,
  Event,
  GetOptions,
  Hash256String,
  InvocationTransaction,
  InvokeReceipt,
  SmartContract,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client';
import BigNumber from 'bignumber.js';

export interface ExchangeDepositedEventParameters {
  readonly address: AddressString;
  readonly assetID: AddressString;
  readonly amount: BigNumber;
}
export interface ExchangeDepositedEvent extends Event<'deposited', ExchangeDepositedEventParameters> {}
export interface ExchangeWithdrawnEventParameters {
  readonly address: AddressString;
  readonly assetID: AddressString;
  readonly amount: BigNumber;
}
export interface ExchangeWithdrawnEvent extends Event<'withdrawn', ExchangeWithdrawnEventParameters> {}
export interface ExchangeOfferCreatedEventParameters {
  readonly makerAddress: AddressString;
  readonly offerAssetID: AddressString;
  readonly offerAmount: BigNumber;
  readonly wantAssetID: AddressString;
  readonly wantAmount: BigNumber;
  readonly offerHash: Hash256String;
}
export interface ExchangeOfferCreatedEvent extends Event<'offerCreated', ExchangeOfferCreatedEventParameters> {}
export interface ExchangeOfferCancelledEventParameters {
  readonly offerHash: Hash256String;
}
export interface ExchangeOfferCancelledEvent extends Event<'offerCancelled', ExchangeOfferCancelledEventParameters> {}
export interface ExchangeBurntEventParameters {
  readonly filler: AddressString;
  readonly takerFeeAssetID: AddressString;
  readonly takerFeeAmount: BigNumber;
}
export interface ExchangeBurntEvent extends Event<'burnt', ExchangeBurntEventParameters> {}
export interface ExchangeOfferFilledEventParameters {
  readonly filler: AddressString;
  readonly offerHash: Hash256String;
  readonly amountToFill: BigNumber;
  readonly offerAssetID: AddressString;
  readonly offerAmount: BigNumber;
  readonly wantAssetID: AddressString;
  readonly wantAmount: BigNumber;
  readonly amountToTake: BigNumber;
}
export interface ExchangeOfferFilledEvent extends Event<'offerFilled', ExchangeOfferFilledEventParameters> {}
export type ExchangeEvent =
  | ExchangeDepositedEvent
  | ExchangeWithdrawnEvent
  | ExchangeOfferCreatedEvent
  | ExchangeOfferCancelledEvent
  | ExchangeBurntEvent
  | ExchangeOfferFilledEvent;

export interface ExchangeSmartContract<TClient extends Client = Client> extends SmartContract<TClient, ExchangeEvent> {
  readonly balanceOf: (address: AddressString, assetID: AddressString) => Promise<BigNumber>;
  readonly cancelOffer: {
    (maker: AddressString, offerHash: Hash256String, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, ExchangeEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      maker: AddressString,
      offerHash: Hash256String,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly deploy: {
    (owner?: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<boolean, ExchangeEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      owner?: AddressString,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<boolean, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly depositNEP17: {
    (from: AddressString, assetID: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, ExchangeEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      assetID: AddressString,
      amount: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly feeAddress: () => Promise<AddressString>;
  readonly fillOffer: {
    (
      filler: AddressString,
      offerHash: Hash256String,
      amountToTake: BigNumber,
      takerFeeAssetID: AddressString,
      takerFeeAmount: BigNumber,
      burnTakerFee: boolean,
      makerFeeAmount: BigNumber,
      burnMakerFee: boolean,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<undefined, ExchangeEvent>, InvocationTransaction>>;
    readonly confirmed: (
      filler: AddressString,
      offerHash: Hash256String,
      amountToTake: BigNumber,
      takerFeeAssetID: AddressString,
      takerFeeAmount: BigNumber,
      burnTakerFee: boolean,
      makerFeeAmount: BigNumber,
      burnMakerFee: boolean,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly getOffer: (
    offerHash: Hash256String,
  ) => Promise<
    | {
        readonly maker: AddressString;
        readonly offerAssetID: AddressString;
        readonly offerAmount: BigNumber;
        readonly wantAssetID: AddressString;
        readonly wantAmount: BigNumber;
        readonly makerFeeAssetID: AddressString;
        readonly makerFeeAvailableAmount: BigNumber;
        readonly nonce: string;
      }
    | undefined
  >;
  readonly makeOffer: {
    (
      maker: AddressString,
      offerAssetID: AddressString,
      offerAmount: BigNumber,
      wantAssetID: AddressString,
      wantAmount: BigNumber,
      makerFeeAssetID: AddressString,
      makerFeeAvailableAmount: BigNumber,
      nonce: string,
      options?: TransactionOptions,
    ): Promise<TransactionResult<InvokeReceipt<undefined, ExchangeEvent>, InvocationTransaction>>;
    readonly confirmed: (
      maker: AddressString,
      offerAssetID: AddressString,
      offerAmount: BigNumber,
      wantAssetID: AddressString,
      wantAmount: BigNumber,
      makerFeeAssetID: AddressString,
      makerFeeAvailableAmount: BigNumber,
      nonce: string,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly owner: () => Promise<AddressString>;
  readonly setFeeAddress: {
    (feeAddress: AddressString, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, ExchangeEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      feeAddress: AddressString,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  };
  readonly withdrawNEP17: {
    (from: AddressString, assetID: AddressString, amount: BigNumber, options?: TransactionOptions): Promise<
      TransactionResult<InvokeReceipt<undefined, ExchangeEvent>, InvocationTransaction>
    >;
    readonly confirmed: (
      from: AddressString,
      assetID: AddressString,
      amount: BigNumber,
      options?: TransactionOptions & GetOptions,
    ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  };
}

export interface ExchangeMigrationSmartContract {
  readonly balanceOf: (
    address: AddressString | Promise<AddressString>,
    assetID: AddressString | Promise<AddressString>,
  ) => Promise<BigNumber>;
  readonly cancelOffer: (
    maker: AddressString | Promise<AddressString>,
    offerHash: Hash256String | Promise<Hash256String>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  readonly deploy: (
    owner?: AddressString | Promise<AddressString>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<boolean, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  readonly depositNEP17: (
    from: AddressString | Promise<AddressString>,
    assetID: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  readonly feeAddress: () => Promise<AddressString>;
  readonly fillOffer: (
    filler: AddressString | Promise<AddressString>,
    offerHash: Hash256String | Promise<Hash256String>,
    amountToTake: BigNumber | Promise<BigNumber>,
    takerFeeAssetID: AddressString | Promise<AddressString>,
    takerFeeAmount: BigNumber | Promise<BigNumber>,
    burnTakerFee: boolean | Promise<boolean>,
    makerFeeAmount: BigNumber | Promise<BigNumber>,
    burnMakerFee: boolean | Promise<boolean>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  readonly getOffer: (
    offerHash: Hash256String | Promise<Hash256String>,
  ) => Promise<
    | {
        readonly maker: AddressString;
        readonly offerAssetID: AddressString;
        readonly offerAmount: BigNumber;
        readonly wantAssetID: AddressString;
        readonly wantAmount: BigNumber;
        readonly makerFeeAssetID: AddressString;
        readonly makerFeeAvailableAmount: BigNumber;
        readonly nonce: string;
      }
    | undefined
  >;
  readonly makeOffer: (
    maker: AddressString | Promise<AddressString>,
    offerAssetID: AddressString | Promise<AddressString>,
    offerAmount: BigNumber | Promise<BigNumber>,
    wantAssetID: AddressString | Promise<AddressString>,
    wantAmount: BigNumber | Promise<BigNumber>,
    makerFeeAssetID: AddressString | Promise<AddressString>,
    makerFeeAvailableAmount: BigNumber | Promise<BigNumber>,
    nonce: string | Promise<string>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  readonly owner: () => Promise<AddressString>;
  readonly setFeeAddress: (
    feeAddress: AddressString | Promise<AddressString>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
  readonly withdrawNEP17: (
    from: AddressString | Promise<AddressString>,
    assetID: AddressString | Promise<AddressString>,
    amount: BigNumber | Promise<BigNumber>,
    options?: TransactionOptions & GetOptions,
  ) => Promise<InvokeReceipt<undefined, ExchangeEvent> & { readonly transaction: InvocationTransaction }>;
}
