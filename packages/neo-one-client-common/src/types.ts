// tslint:disable deprecation no-any
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';
import { Observable } from 'rxjs';
import { RawSourceMap } from 'source-map';
import { ECPoint, UInt160, UInt256 } from './common';

/**
 * Base58 encoded string that represents a NEO address.
 *
 * Also accepts Hash160 strings (hex encoded string prefixed by '0x') when used as a parameter to a NEO•ONE function.
 * Always the base58 encoded string form when returned from a NEO•ONE function.
 *
 * @example 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR'
 * @example '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9'
 */
export type AddressString = string;
/**
 * Hex encoded string prefixed by '0x' that represents a NEO 256 bit hash.
 *
 * Examples of `Hash256String` include `Block` hashes and `Transaction` hashes.
 *
 * @example '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c'
 */
export type Hash256String = string;
/**
 * Hex encoded string that represents a buffer.
 *
 * @example '908d323aa7f92656a77ec26e8861699ef'
 */
export type BufferString = string;
/**
 * Hex encoded string that represents a public key.
 *
 * @example '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef'
 */
export type PublicKeyString = string;
/**
 * WIF strings that represents a private key.
 *
 * Also accepts hex encoded strings when used as a parameter to a NEO•ONE function.
 * Always a WIF string when returned from a NEO•ONE function.
 *
 * @example 'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g'
 * @example '9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69'
 */
export type PrivateKeyString = string;
/**
 * Hex encoded string that represents a signature for a message.
 *
 * @example 'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67'
 */
export type SignatureString = string;
export type NetworkType = 'main' | 'test' | string;

/**
 * `Attribute` usage flag indicating the data is an arbitrary `Buffer`
 *
 * @see BufferAttribute
 */
export type BufferAttributeUsage =
  | 'DescriptionUrl'
  | 'Description'
  | 'Remark'
  | 'Remark1'
  | 'Remark2'
  | 'Remark3'
  | 'Remark4'
  | 'Remark5'
  | 'Remark6'
  | 'Remark7'
  | 'Remark8'
  | 'Remark9'
  | 'Remark10'
  | 'Remark11'
  | 'Remark12'
  | 'Remark13'
  | 'Remark14'
  | 'Remark15';
/**
 * `Attribute` usage flag indicating the data is a `PublicKey`
 *
 * @see PublicKeyAttribute
 */
export type PublicKeyAttributeUsage = 'ECDH02' | 'ECDH03';
/**
 * `Attribute` usage flag indicating the data is an `Address`
 *
 * @see AddressAttribute
 */
export type AddressAttributeUsage = 'Script';
/**
 * `Attribute` usage flag indicating the data is a `Hash256`
 *
 * @see Hash256Attribute
 */
export type Hash256AttributeUsage =
  | 'ContractHash'
  | 'Vote'
  | 'Hash1'
  | 'Hash2'
  | 'Hash3'
  | 'Hash4'
  | 'Hash5'
  | 'Hash6'
  | 'Hash7'
  | 'Hash8'
  | 'Hash9'
  | 'Hash10'
  | 'Hash11'
  | 'Hash12'
  | 'Hash13'
  | 'Hash14'
  | 'Hash15';

/**
 * `Attribute` usage flag indicates the type of the data.
 *
 * @see BufferAttributeUsage
 * @see PublicKeyAttributeUsage
 * @see AddressAttributeUsage
 * @see Hash256AttributeUsage
 */
export type AttributeUsage =
  | BufferAttributeUsage
  | AddressAttributeUsage
  | PublicKeyAttributeUsage
  | Hash256AttributeUsage;

/**
 * Base interface for `Attribute`s
 *
 * @see Attribute
 */
export interface AttributeBase {
  readonly usage: AttributeUsage;
}
/**
 * `Attribute` whose data is an arbitrary `BufferString`.
 */
export interface BufferAttribute extends AttributeBase {
  readonly usage: BufferAttributeUsage;
  readonly data: BufferString;
}
/**
 * `Attribute` whose data is a `PublicKeyString`.
 */
export interface PublicKeyAttribute extends AttributeBase {
  readonly usage: PublicKeyAttributeUsage;
  readonly data: PublicKeyString;
}
/**
 * `Attribute` whose data is a `Hash256`.
 */
export interface Hash256Attribute extends AttributeBase {
  readonly usage: Hash256AttributeUsage;
  readonly data: Hash256String;
}
/**
 * `Attribute` whose data is an `AddressString`.
 */
export interface AddressAttribute extends AttributeBase {
  readonly usage: AddressAttributeUsage;
  readonly data: AddressString;
}
/**
 * `Attribute`s are used to store additional data on `Transaction`s. Most `Attribute`s are used to store arbitrary data, whereas some, like `AddressAttribute`, have specific uses in the NEO
 * protocol.
 */
export type Attribute = BufferAttribute | PublicKeyAttribute | Hash256Attribute | AddressAttribute;

/**
 * `Input`s are a reference to an `Output` of a `Transaction` that has been persisted to the blockchain. The sum of the `value`s of the referenced `Output`s is the total amount transferred in the `Transaction`.
 */
export interface Input {
  /**
   * Hash of the `Transaction` this input references.
   */
  readonly hash: Hash256String;
  /**
   * `Output` index within the `Transaction` this input references.
   */
  readonly index: number;
}

export interface InputOutput extends Input, Output {}

/**
 * `Output`s represent the destination `Address` and amount transferred of a given `Asset`.
 *
 * The sum of the unspent `Output`s of an `Address` represent the total balance of the `Address`.
 */
export interface Output {
  /**
   * Hash of the `Asset` that was transferred.
   */
  readonly asset: Hash256String;
  /**
   * Amount transferred.
   */
  readonly value: BigNumber;
  /**
   * Destination `Address`.
   */
  readonly address: AddressString;
}

export interface Witness {
  readonly invocation: BufferString;
  readonly verification: BufferString;
}

/**
 * Base interface for all `Transaction`s
 */
export interface TransactionBase {
  readonly version: number;
  /**
   * `Hash256` of this `Transaction`.
   */
  readonly hash: Hash256String;
  /**
   * Byte size of this `Transaction`.
   */
  readonly size: number;
  /**
   * `Attribute`s attached to the `Transaction`.
   *
   * @see Attribute
   */
  readonly attributes: ReadonlyArray<Attribute>;
  /**
   * `Input`s of the `Transaction`.
   *
   * @see Input
   */
  readonly inputs: ReadonlyArray<Input>;
  /**
   * `Output`s of the `Transaction`.
   *
   * @see Output
   */
  readonly outputs: ReadonlyArray<Output>;
  readonly scripts: ReadonlyArray<Witness>;
  readonly systemFee: BigNumber;
  readonly networkFee: BigNumber;
}

export interface ConfirmedTransactionBase {
  readonly receipt: {
    readonly blockHash: Hash256String;
    readonly blockIndex: number;
    readonly index: number;
    readonly globalIndex: BigNumber;
  };
}

/**
 * Claims GAS for a set of spent `Output`s.
 */
export interface ClaimTransaction extends TransactionBase {
  readonly type: 'ClaimTransaction';
  readonly claims: ReadonlyArray<Input>;
}

export interface ConfirmedClaimTransaction extends ClaimTransaction, ConfirmedTransactionBase {}

/**
 * Transfers first class `Asset`s
 */
export interface ContractTransaction extends TransactionBase {
  readonly type: 'ContractTransaction';
}

export interface ConfirmedContractTransaction extends ContractTransaction, ConfirmedTransactionBase {}

/**
 * Enrolls a new validator for a given `PublicKey`.
 *
 * @deprecated
 */
export interface EnrollmentTransaction extends TransactionBase {
  readonly type: 'EnrollmentTransaction';
  readonly publicKey: PublicKeyString;
}

export interface ConfirmedEnrollmentTransaction extends EnrollmentTransaction, ConfirmedTransactionBase {}

/**
 * Issues new currency of a first-class `Asset`.
 */
export interface IssueTransaction extends TransactionBase {
  readonly type: 'IssueTransaction';
}

export interface ConfirmedIssueTransaction extends IssueTransaction, ConfirmedTransactionBase {}

/**
 * Runs a script in the NEO VM.
 */
export interface InvocationTransaction extends TransactionBase {
  readonly type: 'InvocationTransaction';
  readonly script: BufferString;
  readonly gas: BigNumber;
}

export interface ConfirmedInvocationTransaction extends InvocationTransaction, ConfirmedTransactionBase {
  readonly invocationData: RawInvocationData;
}

/**
 * First `Transaction` in each block which contains the `Block` rewards for the consensus node that produced the `Block`.
 */
export interface MinerTransaction extends TransactionBase {
  readonly type: 'MinerTransaction';
  readonly nonce: number;
}

export interface ConfirmedMinerTransaction extends MinerTransaction, ConfirmedTransactionBase {}

/**
 * Registers a new `Contract`
 *
 * @deprecated Replaced by `Client#publish`
 */
export interface PublishTransaction extends TransactionBase {
  readonly type: 'PublishTransaction';
  readonly contract: Contract;
}

export interface ConfirmedPublishTransaction extends PublishTransaction, ConfirmedTransactionBase {}

/**
 * Registers a new first class `Asset`
 *
 * @deprecated Replaced by `Client#registerAsset`
 */
export interface RegisterTransaction extends TransactionBase {
  readonly type: 'RegisterTransaction';
  readonly asset: {
    readonly type: AssetType;
    readonly name: string;
    readonly amount: BigNumber;
    readonly precision: number;
    readonly owner: PublicKeyString;
    readonly admin: AddressString;
  };
}

export interface ConfirmedRegisterTransaction extends RegisterTransaction, ConfirmedTransactionBase {}

export interface StateTransaction extends TransactionBase {
  readonly type: 'StateTransaction';
}

export interface ConfirmedStateTransaction extends StateTransaction, ConfirmedTransactionBase {}

export type Transaction =
  | MinerTransaction
  | IssueTransaction
  | ClaimTransaction
  | EnrollmentTransaction
  | RegisterTransaction
  | ContractTransaction
  | PublishTransaction
  | StateTransaction
  | InvocationTransaction;
export type ConfirmedTransaction =
  | ConfirmedMinerTransaction
  | ConfirmedIssueTransaction
  | ConfirmedClaimTransaction
  | ConfirmedEnrollmentTransaction
  | ConfirmedRegisterTransaction
  | ConfirmedContractTransaction
  | ConfirmedPublishTransaction
  | ConfirmedStateTransaction
  | ConfirmedInvocationTransaction;

export interface Header {
  /**
   * NEO blockchain version
   */
  readonly version: number;
  /**
   * `Block` hash
   */
  readonly hash: Hash256String;
  readonly previousBlockHash: Hash256String;
  readonly merkleRoot: Hash256String;
  /**
   * `Block` time persisted
   */
  readonly time: number;
  /**
   * `Block` index
   */
  readonly index: number;
  readonly nonce: string;
  /**
   * Next consensus address.
   */
  readonly nextConsensus: AddressString;
  readonly script: Witness;
  readonly size: number;
}

export interface Block extends Header {
  /**
   * `Transaction`s contained in the `Block`.
   */
  readonly transactions: ReadonlyArray<ConfirmedTransaction>;
}

/**
 * Receipt of a confirmed `Transaction` which contains data about the confirmation such as the `Block` index and the index of the `Transaction` within the block.
 */
export interface TransactionReceipt {
  /**
   * `Block` index of the `Transaction` for this receipt.
   */
  readonly blockIndex: number;
  /**
   * `Block` hash of the `Transaction` for this receipt.
   */
  readonly blockHash: Hash256String;
  /**
   * Transaction index of the `Transaction` within the `Block` for this receipt.
   */
  readonly transactionIndex: number;
}

export interface TransactionResult<
  TTransactionReceipt extends TransactionReceipt = TransactionReceipt,
  TTransaction extends Transaction = Transaction
> {
  readonly transaction: TTransaction;
  readonly confirmed: (options?: GetOptions) => Promise<TTransactionReceipt>;
}

/**
 * Common `InvocationResult` properties.
 */
export interface InvocationResultBase {
  /**
   * GAS consumed by the operation. This is the total GAS consumed after the free GAS is subtracted.
   */
  readonly gasConsumed: BigNumber;
  /**
   * The total GAS cost before subtracting the free GAS.
   */
  readonly gasCost: BigNumber;
}

/**
 * Result of a successful invocation.
 */
export interface InvocationResultSuccess<TValue> extends InvocationResultBase {
  /**
   * Indicates a successful invocation.
   */
  readonly state: 'HALT';
  /**
   * The return value of the invocation.
   */
  readonly value: TValue;
}

/**
 * Result of a failed invocation.
 */
export interface InvocationResultError extends InvocationResultBase {
  /**
   * Indicates a failed invocation.
   */
  readonly state: 'FAULT';
  /**
   * Failure reason.
   */
  readonly message: string;
}

export type InvocationResult<TValue> = InvocationResultSuccess<TValue> | InvocationResultError;

/**
 * The receipt for a smart contract method invocation.
 */
export interface InvokeReceipt<TReturn extends Return = Return, TEvent extends Event<string, any> = Event>
  extends TransactionReceipt {
  /**
   * The result of the invocation.
   */
  readonly result: InvocationResult<TReturn>;
  /**
   * The events emitted by the smart contract during the invocation.
   */
  readonly events: ReadonlyArray<TEvent>;
  /**
   * The logs emitted by the smart contract during the invocation.
   */
  readonly logs: ReadonlyArray<Log>;
  /**
   * The original, unprocessed, raw invoke receipt. The `RawInvokeReceipt` is transformed into this object (the `InvokeReceipt`) using the `ABI` to parse out the `Event`s and `InvocationResult`.
   */
  readonly raw: RawInvokeReceipt;
}

export interface Transfer {
  readonly amount: BigNumber;
  readonly asset: Hash256String;
  readonly to: AddressString;
}

/**
 * Uniquely identifies a `UserAccount` by its address and the network its used on.
 */
export interface UserAccountID {
  /**
   * Network that this address is used on.
   */
  readonly network: NetworkType;
  /**
   * The NEO address.
   */
  readonly address: AddressString;
}

/**
 * `UserAccount` is the base abstraction on which all of the @neo-one/client APIs work with.
 */
export interface UserAccount {
  /**
   * Uniquely identifies a `UserAccount` by its address and the network its used on.
   */
  readonly id: UserAccountID;
  /**
   * The name to use when displaying this account in a user-facing UI. Can be a user configured name or just the address.
   */
  readonly name: string;
  /**
   * The public key for the address.
   */
  readonly publicKey: PublicKeyString;
}

export interface UserAccountProvider {
  /**
   * An `Observable` that emits the currently selected `UserAccount`
   */
  readonly currentUserAccount$: Observable<UserAccount | undefined>;
  /**
   * An `Observable` that emits the available `UserAccount`s
   */
  readonly userAccounts$: Observable<ReadonlyArray<UserAccount>>;
  /**
   * An `Observable` that emits the available networks this `UserAccountProvider` knows how to function with.
   */
  readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  /**
   * @returns the currently selected `UserAccount` or `undefined` if one is not selected.
   */
  readonly getCurrentUserAccount: () => UserAccount | undefined;
  /**
   * @returns the available `UserAccount`s
   */
  readonly getUserAccounts: () => ReadonlyArray<UserAccount>;
  /**
   * @returns the available networks this `UserAccountProvider` knows how to function with.
   */
  readonly getNetworks: () => ReadonlyArray<NetworkType>;
  /**
   * Set the given `UserAccountID` as the selected `UserAccount`.
   *
   * If the `UserAccountProvider` does not support programatically selecting a `UserAccountID`, it should only ever expose one available `UserAccount` and manage selecting other `UserAccount`s outside of the application.
   */
  readonly selectUserAccount: (id?: UserAccountID) => Promise<void>;
  /**
   * Optional support for deleting a `UserAccount`
   */
  readonly deleteUserAccount?: (id: UserAccountID) => Promise<void>;
  /**
   * Optional support for updating the name of a `UserAccount`
   */
  readonly updateUserAccountName?: (options: UpdateAccountNameOptions) => Promise<void>;
  /**
   * @returns the current `Block` height.
   */
  readonly getBlockCount: (network: NetworkType, monitor?: Monitor) => Promise<number>;
  /**
   * @returns `Account` for the specified network and address. Note that the provided network and address may not correspond to one of the available `UserAccount`s.
   */
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
  /**
   * @returns `AsyncIterable` of `Block`s on the argument `network`.
   */
  readonly iterBlocks: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<Block>;
  /**
   * While this method could be implemented simply as a function of `iterBlocks`, `iterActionsRaw` is provided in case the `UserAccountProvider` has a more efficient way of iterating over actions.
   *
   * @returns `AsyncIterable` over all actions emitted by the given `network`, filtered by the given `filter`.
   */
  readonly iterActionsRaw?: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<RawAction>;
  /**
   * Transfers native assets.
   */
  readonly transfer: (
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<TransactionReceipt, InvocationTransaction>>;
  /**
   * Claim all claimable GAS.
   */
  readonly claim: (options?: TransactionOptions) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
  /**
   * Invoke the specified `method` with the given `params` on `contract`.
   *
   * `paramsZipped` contains the original parameters before processing with the ABI and are typically suitable for displaying to a user.
   *
   * `verify` will be true if the transaction should trigger verification for the `contract`
   *
   * `options` may specify additional native asset transfers to include with the transaction (either to or from the contract address).
   */
  readonly invoke: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options?: InvokeSendUnsafeReceiveTransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
  /**
   * Relays a transaction that is the first step of a two-step send process. The `Transfer`'s `to` property represents the ultimate destination of the funds, but this transaction will be constructed such that those funds are marked for transfer, not actually transferred.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  readonly invokeSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    transfer: Transfer,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
  /**
   * Relays a transaction that is the second step of a two-step send process. The `hash` is the transaction hash of the first step in the process and is used to determine the amount to transfer to the `from` address.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  readonly invokeCompleteSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
  /**
   * Refunds native assets that were not processed by the contract. The `hash` is the transaction hash that should be refunded and is used to construct the transfers for this transaction.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  readonly invokeRefundAssets: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
  /**
   * Claims GAS. Currently only supports claiming all unclaimed GAS to the contract address.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  readonly invokeClaim: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
  /**
   * Invokes the constant `method` on `contract` with `params` on `network`.
   */
  readonly call: (
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ) => Promise<RawCallReceipt>;
}

export interface UserAccountProviders<TUserAccountProvider extends UserAccountProvider> {
  readonly [type: string]: TUserAccountProvider;
}

export interface PrivateNetworkSettings {
  readonly secondsPerBlock: number;
}

export interface DeveloperProvider {
  readonly network: NetworkType;
  readonly runConsensusNow: (monitor?: Monitor) => Promise<void>;
  readonly updateSettings: (options: Partial<PrivateNetworkSettings>, monitor?: Monitor) => Promise<void>;
  readonly getSettings: (monitor?: Monitor) => Promise<PrivateNetworkSettings>;
  readonly fastForwardOffset: (seconds: number, monitor?: Monitor) => Promise<void>;
  readonly fastForwardToTime: (seconds: number, monitor?: Monitor) => Promise<void>;
  readonly reset: (monitor?: Monitor) => Promise<void>;
}

export interface Account {
  readonly address: AddressString;
  readonly balances: {
    readonly [asset: string]: BigNumber;
  };
}

export interface EventParameters {
  readonly [name: string]: Param | undefined;
}
export interface Event<TName extends string = string, TEventParameters = EventParameters> extends RawActionBase {
  readonly type: 'Event';
  readonly name: TName;
  readonly parameters: TEventParameters;
}

export interface Log extends RawActionBase {
  readonly type: 'Log';
  readonly message: string;
}

export type Action = Event | Log;

/**
 * Network specific smart contract configuration
 */
export interface SmartContractNetworkDefinition {
  /**
   * `AddressString` of the smart contract on the network.
   */
  readonly address: AddressString;
}

/**
 * Configuration for the smart contract by network.
 */
export interface SmartContractNetworksDefinition {
  /**
   * Network specific smart contract configuration
   */
  readonly [networkType: string]: SmartContractNetworkDefinition;
}

/**
 * Used to generate the smart contract APIs.
 */
export interface SmartContractDefinition {
  /**
   * Configuration for the smart contract by network.
   */
  readonly networks: SmartContractNetworksDefinition;
  /**
   * `ABI` of the smart contract
   */
  readonly abi: ABI;
  /**
   * `SourceMaps` associated with the smart contract.
   */
  readonly sourceMaps?: Promise<SourceMaps>;
}

export interface SmartContractReadOptions {
  /**
   * The network to read the smart contract data for. By default this is the network of the currently selected user account.
   */
  readonly network?: string;
}

export interface SmartContractIterOptions extends SmartContractReadOptions {
  /**
   * Filters the iterated events and/or logs to those that match the provided `BlockFilter` object.
   */
  readonly filter?: BlockFilter;
}

export interface BlockFilter {
  /**
   * The inclusive start index for the first block to include. Leaving `undefined` means start from the beginning of the blockchain, i.e. index 0.
   */
  readonly indexStart?: number;
  /**
   * The exclsuive end index for the block to start at. Leaving `undefined` means continue indefinitely, waiting for new blocks to come in.
   */
  readonly indexStop?: number;
  /**
   * The `Monitor` to use for tracking all asynchronous calls made in the process of pulling data.
   */
  readonly monitor?: Monitor;
}

export interface GetOptions {
  readonly timeoutMS?: number;
  readonly monitor?: Monitor;
}

export interface TransactionOptions {
  // tslint:disable readonly-keyword
  /**
   * The `UserAccount` that the transaction is "from", i.e. the one that will be used for native asset transfers, claims, and signing the transaction.
   *
   * If unspecified, the currently selected `UserAccount` is used as the `from` address.
   *
   * DApp developers will typically want to leave this unspecified.
   */
  from?: UserAccountID;
  /**
   * Additional attributes to include with the transaction.
   */
  attributes?: ReadonlyArray<Attribute>;
  /**
   * An optional network fee to include with the transaction.
   */
  networkFee?: BigNumber;
  /**
   * A maximum system fee to include with the transaction. Note that this is a maximum, the client APIs will automatically calculate and add a system fee to the transaction up to the value specified here.
   *
   * Leaving `systemFee` `undefined` is equivalent to `new BigNumber(0)`, i.e. no system fee.
   *
   * A `systemFee` of `-1`, i.e. `new BigNumber(-1)` indicates no limit on the fee. This is typically used only during development.
   */
  systemFee?: BigNumber;
  /**
   * The `Monitor` to use for tracking and logging all asynchronous calls made during the transaction.
   */
  monitor?: Monitor;
  // tslint:enable readonly-keyword
}

// tslint:disable-next-line no-any
export interface ForwardOptions<TEvent extends Event<string, any> = Event> {
  readonly events?: ReadonlyArray<ABIEvent>;
  readonly __tag?: TEvent;
}

export interface InvokeSendUnsafeTransactionOptions extends TransactionOptions {
  readonly sendFrom?: ReadonlyArray<Transfer>;
}

export interface InvokeReceiveTransactionOptions extends TransactionOptions {
  readonly sendTo?: ReadonlyArray<Omit<Transfer, 'to'>>;
}

export interface InvokeSendUnsafeReceiveTransactionOptions
  extends InvokeSendUnsafeTransactionOptions,
    InvokeReceiveTransactionOptions {}

export interface UpdateAccountNameOptions {
  readonly id: UserAccountID;
  readonly name: string;
  readonly monitor?: Monitor;
}

/**
 * Common properties of all `ABIReturn` specifications.
 *
 * @see ABIReturn
 */
export interface ABIReturnBase {
  /**
   * `true` if the value can be `undefined`
   */
  readonly optional?: boolean;
  /**
   * `true` if the smart contract expects this value to be forwarded by another smart contract.
   */
  readonly forwardedValue?: boolean;
}

/**
 * `Address` return type.
 *
 * @see ABIReturn
 * @see AddressString
 */
export interface AddressABIReturn extends ABIReturnBase {
  readonly type: 'Address';
}
/**
 * `Array` return type.
 */
export interface ArrayABIReturn extends ABIReturnBase {
  readonly type: 'Array';
  /**
   * Value type of the `Array`.
   */
  readonly value: ABIReturn;
}
/**
 * `boolean` return type.
 *
 * @see ABIReturn
 */
export interface BooleanABIReturn extends ABIReturnBase {
  readonly type: 'Boolean';
}
/**
 * `Buffer` return type.
 *
 * @see ABIReturn
 * @see BufferString
 */
export interface BufferABIReturn extends ABIReturnBase {
  readonly type: 'Buffer';
}
/**
 * `ForwardValue` return type.
 */
export interface ForwardValueABIReturn extends ABIReturnBase {
  readonly type: 'ForwardValue';
}
/**
 * `Hash256` return type.
 *
 * @see ABIReturn
 * @see Hash256String
 */
export interface Hash256ABIReturn extends ABIReturnBase {
  readonly type: 'Hash256';
}
/**
 * `Fixed<decimals>` return type. `decimals` indicates to the client APIs how many decimals the integer represents.
 *
 * @see Fixed<Decimals>
 */
export interface IntegerABIReturn extends ABIReturnBase {
  readonly type: 'Integer';
  /**
   * Number of decimals values of this type represent.
   */
  readonly decimals: number;
}
/**
 * `Map` return type.
 */
export interface MapABIReturn extends ABIReturnBase {
  readonly type: 'Map';
  /**
   * Key type of the `Map`.
   */
  readonly key: ABIReturn;
  /**
   * Value type of the `Map`.
   */
  readonly value: ABIReturn;
}
/**
 * `Object` return type.
 */
export interface ObjectABIReturn extends ABIReturnBase {
  readonly type: 'Object';
  /**
   * Properties of the `Object`.
   */
  readonly properties: { readonly [key: string]: ABIReturn };
}
/**
 * `PublicKey` return type.
 *
 * @see ABIReturn
 * @see PublicKeyString
 */
export interface PublicKeyABIReturn extends ABIReturnBase {
  readonly type: 'PublicKey';
}
/**
 * `Signature` return type.
 *
 * @see ABIReturn
 * @see SignatureString
 */
export interface SignatureABIReturn extends ABIReturnBase {
  readonly type: 'Signature';
}
/**
 * `string` return type.
 *
 * @see ABIReturn
 */
export interface StringABIReturn extends ABIReturnBase {
  readonly type: 'String';
}
/**
 * `void` return type.
 */
export interface VoidABIReturn extends ABIReturnBase {
  readonly type: 'Void';
}

/**
 * Default value is the `Transaction` sender `Address`
 */
export interface SenderAddressABIDefault {
  readonly type: 'sender';
}

/**
 * Default value for the constructor/deploy parameter.
 */
export type ABIDefault = SenderAddressABIDefault;
export type ABIDefaultType = ABIDefault['type'];

/**
 * Base interface for all `ABIParameter`s
 */
export interface ABIParameterBase {
  /**
   * Name of the parameter.
   */
  readonly name: string;
  /**
   * Runtime default value.
   */
  readonly default?: ABIDefault;
  /**
   * Represents a rest parameter.
   */
  readonly rest?: boolean;
}

/**
 * `Address` parameter type.
 *
 * @see ABIParameter
 * @see AddressABIReturn
 * @see AddressString
 */
export interface AddressABIParameter extends ABIParameterBase, AddressABIReturn {}
/**
 * `Array` parameter type.
 *
 * @see ABIParameter
 * @see ArrayABIReturn
 */
export interface ArrayABIParameter extends ABIParameterBase, ArrayABIReturn {}
/**
 * `boolean` parameter type.
 *
 * @see ABIParameter
 * @see BooleanABIReturn
 */
export interface BooleanABIParameter extends ABIParameterBase, BooleanABIReturn {}
/**
 * `Buffer` parameter type.
 *
 * @see ABIParameter
 * @see BufferABIReturn
 * @see BufferString
 */
export interface BufferABIParameter extends ABIParameterBase, BufferABIReturn {}
/**
 * `Hash256` parameter type.
 *
 * @see ABIParameter
 * @see Hash256ABIReturn
 * @see Hash256String
 */
export interface Hash256ABIParameter extends ABIParameterBase, Hash256ABIReturn {}
/**
 * `Fixed<decimals>` parameter type. `decimals` indicates to the client APIs how many decimals the integer represents.
 *
 * @see ABIParameter
 * @see IntegerABIReturn
 * @see Fixed<Decimals>
 */
export interface IntegerABIParameter extends ABIParameterBase, IntegerABIReturn {}
/**
 * `ForwardValue` parameter type.
 *
 * @see ABIParameter
 * @see ForwardValueABIReturn
 */
export interface ForwardValueABIParameter extends ABIParameterBase, ForwardValueABIReturn {}
/**
 * `Map` parameter type.
 *
 * @see ABIParameter
 * @see MapABIReturn
 */
export interface MapABIParameter extends ABIParameterBase, MapABIReturn {}
/**
 * `Object` parameter type.
 *
 * @see ABIParameter
 * @see ObjectABIReturn
 */
export interface ObjectABIParameter extends ABIParameterBase, ObjectABIReturn {}
/**
 * `PublicKey` parameter type.
 *
 * @see ABIParameter
 * @see PublicKeyABIReturn
 * @see PublicKeyString
 */
export interface PublicKeyABIParameter extends ABIParameterBase, PublicKeyABIReturn {}
/**
 * `Signature` parameter type.
 *
 * @see ABIParameter
 * @see SignatureABIReturn
 * @see SignatureString
 */
export interface SignatureABIParameter extends ABIParameterBase, SignatureABIReturn {}
/**
 * `string` parameter type.
 *
 * @see ABIParameter
 * @see StringABIReturn
 */
export interface StringABIParameter extends ABIParameterBase, StringABIReturn {}
/**
 * `void` parameter type.
 *
 * @see ABIParameter
 * @see VoidABIReturn
 */
export interface VoidABIParameter extends ABIParameterBase, VoidABIReturn {}

/**
 * Return type specification of a function in the `ABI` of a smart contract.
 */
export type ABIReturn =
  | SignatureABIReturn
  | BooleanABIReturn
  | AddressABIReturn
  | Hash256ABIReturn
  | BufferABIReturn
  | PublicKeyABIReturn
  | StringABIReturn
  | ArrayABIReturn
  | MapABIReturn
  | ObjectABIReturn
  | VoidABIReturn
  | IntegerABIReturn
  | ForwardValueABIReturn;
/**
 * Parameter specification of a function or event in the `ABI` of a smart contract.
 */
export type ABIParameter =
  | SignatureABIParameter
  | BooleanABIParameter
  | AddressABIParameter
  | Hash256ABIParameter
  | BufferABIParameter
  | PublicKeyABIParameter
  | StringABIParameter
  | ArrayABIParameter
  | MapABIParameter
  | ObjectABIParameter
  | VoidABIParameter
  | IntegerABIParameter
  | ForwardValueABIParameter;

export type ArrayABI = ArrayABIParameter | ArrayABIReturn;
export type MapABI = MapABIParameter | MapABIReturn;
export type ObjectABI = ObjectABIParameter | ObjectABIReturn;
export type SignatureABI = SignatureABIParameter | SignatureABIReturn;
export type BooleanABI = BooleanABIParameter | BooleanABIReturn;
export type AddressABI = AddressABIParameter | AddressABIReturn;
export type Hash256ABI = Hash256ABIParameter | Hash256ABIReturn;
export type BufferABI = BufferABIParameter | BufferABIReturn;
export type PublicKeyABI = PublicKeyABIParameter | PublicKeyABIReturn;
export type StringABI = StringABIParameter | StringABIReturn;
export type VoidABI = VoidABIParameter | VoidABIReturn;
export type IntegerABI = IntegerABIParameter | IntegerABIReturn;
export type ForwardValueABI = ForwardValueABIParameter | ForwardValueABIReturn;

/**
 * Function specification in the `ABI` of a smart contract.
 */
export interface ABIFunction {
  /**
   * Name of the function
   */
  readonly name: string;
  /**
   * Parameters of the function.
   */
  readonly parameters?: ReadonlyArray<ABIParameter>;
  /**
   * Return type of the function.
   */
  readonly returnType: ABIReturn;
  /**
   * `true` if the function is constant or read-only.
   */
  readonly constant?: boolean;
  /**
   * `true` if the function is used for sending native assets with a two-phase send.
   */
  readonly send?: boolean;
  /**
   * `true` if the function is used for sending native assets.
   */
  readonly sendUnsafe?: boolean;
  /**
   * `true` if the function is used for receiving native assets.
   */
  readonly receive?: boolean;
  /**
   * `true` if the function is used for claiming GAS.
   */
  readonly claim?: boolean;
  /**
   * `true` if the function is used for refunding native assets.
   */
  readonly refundAssets?: boolean;
  /**
   * `true` if the function is used for the second phase of a send.
   */
  readonly completeSend?: boolean;
}

/**
 * Event specification in the `ABI` of a smart contract.
 */
export interface ABIEvent {
  /**
   * Name of the event.
   */
  readonly name: string;
  /**
   * Parameters of the event.
   */
  readonly parameters: ReadonlyArray<ABIParameter>;
}

/**
 * Full specification of the functions and events of a smart contract. Used by the client APIs to generate the smart contract interface.
 *
 * See the [Smart Contract APIs](https://neo-one.io/docs/smart-contract-apis) chapter of the main guide for more information.
 */
export interface ABI {
  /**
   * Specification of the smart contract functions.
   */
  readonly functions: ReadonlyArray<ABIFunction>;
  /**
   * Specification of the smart contract events.
   */
  readonly events?: ReadonlyArray<ABIEvent>;
}

declare const OpaqueTagSymbol: unique symbol;
export interface ForwardValue {
  readonly name: string;
  readonly converted: ScriptBuilderParam | undefined;
  readonly param: Param | undefined;
  readonly [OpaqueTagSymbol]: unique symbol;
}

export interface ScriptBuilderParamArray extends Array<ScriptBuilderParam | undefined> {}
export interface ScriptBuilderParamMap extends Map<ScriptBuilderParam | undefined, ScriptBuilderParam | undefined> {}
export interface ScriptBuilderParamObject {
  readonly [key: string]: ScriptBuilderParam;
}
export type ScriptBuilderParam =
  | BN
  | number
  | UInt160
  | UInt256
  | ECPoint
  | string
  | Buffer
  | boolean
  | ScriptBuilderParamArray
  | ScriptBuilderParamMap
  | ScriptBuilderParamObject;

export interface ParamArray extends ReadonlyArray<Param> {}
export interface ParamMap extends ReadonlyMap<Param, Param> {}
export interface ParamObject {
  readonly [key: string]: Param;
}
/**
 * Valid parameter types for a smart contract method.
 */
export type Param =
  | undefined
  | BigNumber
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ParamArray
  | ParamMap
  | ParamObject
  | ForwardValue;
export interface ReturnArray extends ReadonlyArray<Return> {}
export interface ReturnMap extends ReadonlyMap<Return, Return> {}
export interface ReturnObject {
  readonly [key: string]: Return;
}
/**
 * Possible return types for a smart contract method.
 */
export type Return =
  | undefined
  | BigNumber
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ReturnArray
  | ReturnMap
  | ReturnObject
  | ContractParameter;

export type AssetType = 'Credit' | 'Duty' | 'Governing' | 'Utility' | 'Currency' | 'Share' | 'Invoice' | 'Token';

/**
 * Attributes of a first class asset.
 *
 * Users will typically only interact with the NEO and GAS `Asset`s.
 *
 * @example
 *
 * const asset = readClient.getAsset(Hash256.NEO);
 * const neoAmount = asset.amount;
 *
 */
export interface Asset {
  /**
   * `Hash256String` of this `Asset`.
   */
  readonly hash: Hash256String;
  /**
   * Type of the `Asset`
   *
   * @see AssetType
   */
  readonly type: AssetType;
  readonly name: string;
  /**
   * Total possible supply of the `Asset`
   */
  readonly amount: BigNumber;
  /**
   * Amount currently available of the `Asset`
   */
  readonly available: BigNumber;
  /**
   * Precision (number of decimal places) of the `Asset`
   */
  readonly precision: number;
  /**
   * Owner of the `Asset`.
   */
  readonly owner: PublicKeyString;
  /**
   * Admin of the `Asset`.
   */
  readonly admin: AddressString;
  /**
   * Issuer of the `Asset`.
   */
  readonly issuer: AddressString;
  readonly expiration: number;
  readonly frozen: boolean;
}

export interface Contract {
  readonly version: number;
  /**
   * `AddressString` of this `Contract`.
   */
  readonly address: AddressString;
  /**
   * `Contract` code.
   */
  readonly script: BufferString;
  /**
   * Expected parameters of this `Contract`
   */
  readonly parameters: ReadonlyArray<ContractParameterType>;
  /**
   * Return type of this `Contract`
   */
  readonly returnType: ContractParameterType;
  /**
   * Name of this `Contract`. For informational purposes only.
   */
  readonly name: string;
  /**
   * Version of this `Contract`. For informational purposes only.
   */
  readonly codeVersion: string;
  /**
   * Author of this `Contract`. For informational purposes only.
   */
  readonly author: string;
  /**
   * Email of this `Contract`. For informational purposes only.
   */
  readonly email: string;
  /**
   * Description of this `Contract`. For informational purposes only.
   */
  readonly description: string;
  /**
   * `true` if this `Contract` can use storage.
   */
  readonly storage: boolean;
  /**
   * `true` if this `Contract` can make dynamic invocations.
   */
  readonly dynamicInvoke: boolean;
  /**
   * `true` if this `Contract` accepts first-class `Asset`s and/or tokens.
   */
  readonly payable: boolean;
}

/* BEGIN LOW-LEVEL API */

/**
 * Invocation stack item for a `Signature`.
 *
 * @see ContractParameter
 * @see SignatureString
 */
export interface SignatureContractParameter {
  readonly type: 'Signature';
  readonly value: SignatureString;
}

/**
 * Invocation stack item for a `boolean`.
 *
 * @see ContractParameter
 */
export interface BooleanContractParameter {
  readonly type: 'Boolean';
  readonly value: boolean;
}

/**
 * Invocation stack item for a `BN`.
 *
 * Note that unlike most of the client APIs, we use a `BN` instead of a `BigNumber` here to indicate that this is an integer value.
 * For example, an `IntegerContractParameter` that represents a NEO value of 10 would be a `new BN(10_00000000)`.
 *
 * @see ContractParameter
 */
export interface IntegerContractParameter {
  readonly type: 'Integer';
  readonly value: BN;
}

/**
 * Invocation stack item for an `Address`.
 *
 * @see ContractParameter
 * @see AddressString
 */
export interface AddressContractParameter {
  readonly type: 'Address';
  readonly value: AddressString;
}

/**
 * Invocation stack item for a `Hash256`.
 *
 * @see ContractParameter
 * @see Hash256String
 */
export interface Hash256ContractParameter {
  readonly type: 'Hash256';
  readonly value: Hash256String;
}

/**
 * Invocation stack item for a `Buffer`.
 *
 * @see ContractParameter
 * @see BufferString
 */
export interface BufferContractParameter {
  readonly type: 'Buffer';
  readonly value: BufferString;
}

/**
 * Invocation stack item for a `PublicKey`.
 *
 * @see ContractParameter
 * @see PublicKeyString
 */
export interface PublicKeyContractParameter {
  readonly type: 'PublicKey';
  readonly value: PublicKeyString;
}

/**
 * Invocation stack item for a `string`.
 *
 * @see ContractParameter
 */
export interface StringContractParameter {
  readonly type: 'String';
  readonly value: string;
}

/**
 * Invocation stack item for an `Array`.
 *
 * @see ContractParameter
 */
export interface ArrayContractParameter {
  readonly type: 'Array';
  readonly value: ReadonlyArray<ContractParameter>;
}

/**
 * Invocation stack item for a `Map`.
 *
 * @see ContractParameter
 */
export interface MapContractParameter {
  readonly type: 'Map';
  readonly value: ReadonlyArray<[ContractParameter, ContractParameter]>;
}

/**
 * Invocation stack item for anything other than the other valid contract parameters.
 *
 * Examples include the `Block` builtin. If these builtins remain on the stack after invocation, for example, as a return value, then they will be serialized as this empty interface.
 *
 * @see ContractParameter
 */
export interface InteropInterfaceContractParameter {
  readonly type: 'InteropInterface';
}

/**
 * Invocation stack item for `void`.
 *
 * @see ContractParameter
 */
export interface VoidContractParameter {
  readonly type: 'Void';
}

/**
 * `ContractParameter`s are the serialized stack items of an invocation. These are typically the raw results of an invocation, but they may appear in other raw contexts.
 *
 * Low-level API for advanced usage only.
 */
export type ContractParameter =
  | SignatureContractParameter
  | BooleanContractParameter
  | IntegerContractParameter
  | AddressContractParameter
  | Hash256ContractParameter
  | BufferContractParameter
  | PublicKeyContractParameter
  | StringContractParameter
  | ArrayContractParameter
  | MapContractParameter
  | InteropInterfaceContractParameter
  | VoidContractParameter;

export type ContractParameterType = ContractParameter['type'];

/**
 * Raw result of a successful invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawInvocationResultSuccess {
  readonly state: 'HALT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly stack: ReadonlyArray<ContractParameter>;
}

/**
 * Raw result of a failed invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawInvocationResultError {
  readonly state: 'FAULT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly stack: ReadonlyArray<ContractParameter>;
  readonly message: string;
}

/**
 * Raw result of an invocation.
 *
 * Low-level API for advanced usage only.
 */
export type RawInvocationResult = RawInvocationResultSuccess | RawInvocationResultError;

/**
 * Raw action emitted during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawActionBase {
  readonly version: number;
  readonly blockIndex: number;
  readonly blockHash: Hash256String;
  readonly transactionIndex: number;
  readonly transactionHash: Hash256String;
  readonly index: number;
  readonly globalIndex: BigNumber;
  readonly address: AddressString;
}

/**
 * Raw notification emitted during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawNotification extends RawActionBase {
  readonly type: 'Notification';
  readonly args: ReadonlyArray<ContractParameter>;
}

/**
 * Raw log emitted during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawLog extends RawActionBase {
  readonly type: 'Log';
  readonly message: string;
}

/**
 * Raw action emitted during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export type RawAction = RawNotification | RawLog;

/**
 * Raw receipt of an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawCallReceipt {
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<RawAction>;
}

/**
 * Raw receipt of an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawInvokeReceipt extends TransactionReceipt {
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<RawAction>;
}

/**
 * Smart contract source maps.
 */
export interface SourceMaps {
  /**
   * `RawSourceMap` for the contract at `address`
   */
  readonly [address: string]: RawSourceMap;
}

export interface JSONRPCErrorResponse {
  readonly code: number;
  readonly message: string;
  // tslint:disable-next-line no-any
  readonly data?: any;
}

export interface VerifyScriptResult {
  readonly failureMessage?: string;
  readonly address: AddressString;
  readonly witness: Witness;
  readonly actions: ReadonlyArray<RawAction>;
}

export interface VerifyTransactionResult {
  readonly verifications: ReadonlyArray<VerifyScriptResult>;
}

export interface RelayTransactionResult {
  readonly transaction: Transaction;
  readonly verifyResult?: VerifyTransactionResult;
}

export interface RawInvocationData {
  readonly asset?: Asset;
  readonly contracts: ReadonlyArray<Contract>;
  readonly deletedContractAddresses: ReadonlyArray<AddressString>;
  readonly migratedContractAddresses: ReadonlyArray<[AddressString, AddressString]>;
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<RawAction>;
}

export interface ParamJSONArray extends ReadonlyArray<Param> {}
export type ParamJSON =
  | undefined
  | string
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ParamJSONArray;

export interface NetworkSettings {
  readonly issueGASFee: BigNumber;
}

export interface Peer {
  readonly address: string;
  readonly port: number;
}

/* END LOW-LEVEL API */
