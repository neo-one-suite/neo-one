// tslint:disable deprecation
import {
  ABI,
  ABIDefault,
  ABIDefaultType,
  ABIEvent,
  ABIFunction,
  ABIParameter,
  ABIReturn,
  AddressABI,
  AddressABIParameter,
  AddressABIReturn,
  AddressString,
  ArrayABI,
  BooleanABI,
  BooleanABIParameter,
  BooleanABIReturn,
  BufferABI,
  BufferABIParameter,
  BufferABIReturn,
  BufferString,
  ClientAddressContractParameter,
  ClientArrayContractParameter,
  ClientBooleanContractParameter,
  ClientBufferContractParameter,
  ClientContractParameter,
  ClientHash256ContractParameter,
  ClientIntegerContractParameter,
  ClientInteropInterfaceContractParameter,
  ClientPublicKeyContractParameter,
  ClientSignatureContractParameter,
  ClientStringContractParameter,
  ClientVoidContractParameter,
  ForwardValue,
  ForwardValueABI,
  ForwardValueABIParameter,
  ForwardValueABIReturn,
  Hash256ABI,
  Hash256ABIParameter,
  Hash256ABIReturn,
  Hash256String,
  IntegerABI,
  IntegerABIParameter,
  IntegerABIReturn,
  Param,
  PrivateKeyString,
  PublicKeyABI,
  PublicKeyABIParameter,
  PublicKeyABIReturn,
  PublicKeyString,
  RawAction,
  RawActionBase,
  RawCallReceipt,
  RawInvocationResult,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RawInvokeReceipt,
  RawLog,
  RawNotification,
  Return,
  ScriptBuilderParam,
  SenderAddressABIDefault,
  SignatureABI,
  SignatureABIParameter,
  SignatureABIReturn,
  StringABI,
  StringABIParameter,
  StringABIReturn,
  TransactionReceipt,
  VoidABI,
  VoidABIParameter,
  VoidABIReturn,
} from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { RawSourceMap } from 'source-map';

export interface Peer {
  readonly address: string;
  readonly port: number;
}

export {
  ABI,
  ABIDefault,
  ABIDefaultType,
  ABIEvent,
  ABIFunction,
  ABIParameter,
  ABIReturn,
  RawAction,
  RawActionBase,
  AddressABI,
  AddressABIParameter,
  AddressABIReturn,
  AddressString,
  ArrayABI,
  BooleanABI,
  BooleanABIParameter,
  BooleanABIReturn,
  BufferABI,
  BufferABIParameter,
  BufferABIReturn,
  BufferString,
  ClientAddressContractParameter as AddressContractParameter,
  ClientArrayContractParameter as ArrayContractParameter,
  ClientBooleanContractParameter as BooleanContractParameter,
  ClientBufferContractParameter as BufferContractParameter,
  ClientContractParameter as ContractParameter,
  ClientHash256ContractParameter as Hash256ContractParameter,
  ClientIntegerContractParameter as IntegerContractParameter,
  ClientInteropInterfaceContractParameter as InteropInterfaceContractParameter,
  ClientPublicKeyContractParameter as PublicKeyContractParameter,
  ClientSignatureContractParameter as SignatureContractParameter,
  ClientStringContractParameter as StringContractParameter,
  ClientVoidContractParameter as VoidContractParameter,
  ForwardValue,
  ForwardValueABI,
  ForwardValueABIParameter,
  ForwardValueABIReturn,
  Hash256ABI,
  Hash256ABIParameter,
  Hash256ABIReturn,
  Hash256String,
  IntegerABI,
  IntegerABIParameter,
  IntegerABIReturn,
  RawLog,
  RawNotification,
  Param,
  PrivateKeyString,
  PublicKeyABI,
  PublicKeyABIParameter,
  PublicKeyABIReturn,
  PublicKeyString,
  Return,
  RawCallReceipt,
  RawInvocationResult,
  RawInvocationResultError,
  RawInvocationResultSuccess,
  RawInvokeReceipt,
  SenderAddressABIDefault,
  SignatureABI,
  SignatureABIParameter,
  SignatureABIReturn,
  StringABI,
  StringABIParameter,
  StringABIReturn,
  TransactionReceipt,
  VoidABI,
  VoidABIParameter,
  VoidABIReturn,
};

export type ContractParameterType = ClientContractParameter['type'];

export interface Account {
  readonly address: AddressString;
  readonly balances: {
    readonly [asset: string]: BigNumber;
  };
}

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
   * True if this `Contract` can use storage.
   */
  readonly storage: boolean;
  /**
   * True if this `Contract` can make dynamic invocations.
   */
  readonly dynamicInvoke: boolean;
  /**
   * True if this `Contract` accepts first-class `Asset`s and/or tokens.
   */
  readonly payable: boolean;
}

export interface StorageItem {
  /**
   * `Contract` address for this `StorageItem`
   */
  readonly address: AddressString;
  /**
   * Key of this `StorageItem`
   */
  readonly key: BufferString;
  /**
   * Value of this `StorageItem`
   */
  readonly value: BufferString;
}

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

export interface InputOutput extends Input, Output {}

export interface Witness {
  readonly invocation: BufferString;
  readonly verification: BufferString;
}

export interface RawInvocationData {
  readonly asset?: Asset;
  readonly contracts: ReadonlyArray<Contract>;
  readonly deletedContractAddresses: ReadonlyArray<AddressString>;
  readonly migratedContractAddresses: ReadonlyArray<[AddressString, AddressString]>;
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<RawAction>;
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

export interface AssetRegister {
  readonly type: AssetType;
  readonly name: string;
  readonly amount: BigNumber;
  readonly precision: number;
  readonly owner: PublicKeyString;
  readonly admin: AddressString;
  readonly issuer: AddressString;
}

export interface ContractRegister {
  readonly script: BufferString;
  readonly parameters: ReadonlyArray<ContractParameterType>;
  readonly returnType: ContractParameterType;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly storage: boolean;
  readonly dynamicInvoke: boolean;
  readonly payable: boolean;
}

export interface Transfer {
  readonly amount: BigNumber;
  readonly asset: Hash256String;
  readonly to: AddressString;
}

export interface ParamJSONArray extends ReadonlyArray<Param> {}
export type ParamJSON =
  | undefined
  | string
  | BufferString
  | AddressString
  | Hash256String
  | AddressString
  | PublicKeyString
  | boolean
  | ParamJSONArray;

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

export type NetworkType = 'main' | 'test' | string;
export interface NetworkSettings {
  readonly issueGASFee: BigNumber;
}

export interface UserAccountID {
  readonly network: NetworkType;
  readonly address: AddressString;
}

export interface UserAccount {
  readonly type: string;
  readonly id: UserAccountID;
  readonly name: string;
  readonly publicKey: PublicKeyString;
  readonly configurableName: boolean;
  readonly deletable: boolean;
}

export interface TransactionOptions {
  // tslint:disable readonly-keyword
  from?: UserAccountID;
  attributes?: ReadonlyArray<Attribute>;
  networkFee?: BigNumber;
  systemFee?: BigNumber;
  monitor?: Monitor;
  // tslint:enable readonly-keyword
}

export interface InvokeClaimTransactionOptions extends TransactionOptions {
  readonly claimAll?: boolean;
}

export interface InvokeSendTransactionOptions extends TransactionOptions {
  readonly sendFrom?: ReadonlyArray<Transfer>;
}

export interface InvokeReceiveTransactionOptions extends TransactionOptions {
  readonly sendTo?: ReadonlyArray<Omit<Transfer, 'to'>>;
}

export interface InvokeSendReceiveTransactionOptions
  extends InvokeSendTransactionOptions,
    InvokeReceiveTransactionOptions {}

export interface InvokeExecuteTransactionOptions extends TransactionOptions {
  readonly transfers?: ReadonlyArray<Transfer>;
}

export interface InvocationResultSuccess<TValue> {
  readonly state: 'HALT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly value: TValue;
}

export interface InvocationResultError {
  readonly state: 'FAULT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly message: string;
}

export type InvocationResult<TValue> = InvocationResultSuccess<TValue> | InvocationResultError;

// tslint:disable-next-line no-any
export interface InvokeReceipt<TReturn extends Return = Return, TEvent extends Event<string, any> = Event>
  extends TransactionReceipt {
  readonly result: InvocationResult<TReturn>;
  readonly events: ReadonlyArray<TEvent>;
  readonly logs: ReadonlyArray<Log>;
}

export interface PublishReceipt extends TransactionReceipt {
  readonly result: InvocationResult<Contract>;
}

export interface RegisterAssetReceipt extends TransactionReceipt {
  readonly result: InvocationResult<Asset>;
}

export interface GetOptions {
  readonly timeoutMS?: number;
  readonly monitor?: Monitor;
}

export interface PrivateNetworkSettings {
  readonly secondsPerBlock: number;
}

export interface TransactionResult<
  TTransactionReceipt extends TransactionReceipt = TransactionReceipt,
  TTransaction extends Transaction = Transaction
> {
  readonly transaction: TTransaction;
  readonly confirmed: (options?: GetOptions) => Promise<TTransactionReceipt>;
}

// Indices are inclusive start, exclusive end.
export interface BlockFilter {
  readonly indexStart?: number;
  readonly indexStop?: number;
  readonly monitor?: Monitor;
}

export interface UpdateAccountNameOptions {
  readonly id: UserAccountID;
  readonly name: string;
  readonly monitor?: Monitor;
}

export interface DataProvider {
  readonly network: NetworkType;
  readonly getAccount: (address: AddressString, monitor?: Monitor) => Promise<Account>;
  readonly getAsset: (hash: Hash256String, monitor?: Monitor) => Promise<Asset>;
  readonly getBlock: (hashOrIndex: number | Hash256String, options?: GetOptions) => Promise<Block>;
  readonly iterBlocks: (filter?: BlockFilter) => AsyncIterable<Block>;
  readonly getBestBlockHash: (monitor?: Monitor) => Promise<Hash256String>;
  readonly getBlockCount: (monitor?: Monitor) => Promise<number>;
  readonly getContract: (address: AddressString, monitor?: Monitor) => Promise<Contract>;
  readonly getMemPool: (monitor?: Monitor) => Promise<ReadonlyArray<Hash256String>>;
  readonly getTransaction: (hash: Hash256String, monitor?: Monitor) => Promise<Transaction>;
  readonly getOutput: (input: Input, monitor?: Monitor) => Promise<Output>;
  readonly getConnectedPeers: (monitor?: Monitor) => Promise<ReadonlyArray<Peer>>;
  readonly getStorage: (address: AddressString, key: BufferString, monitor?: Monitor) => Promise<StorageItem>;
  readonly iterStorage: (address: AddressString, monitor?: Monitor) => AsyncIterable<StorageItem>;
  readonly iterActionsRaw: (filterIn?: BlockFilter) => AsyncIterable<RawAction>;
  readonly call: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ) => Promise<RawCallReceipt>;
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

export interface UserAccountProvider {
  readonly type: string;
  readonly currentAccount$: Observable<UserAccount | undefined>;
  readonly accounts$: Observable<ReadonlyArray<UserAccount>>;
  readonly networks$: Observable<ReadonlyArray<NetworkType>>;

  readonly getCurrentAccount: () => UserAccount | undefined;
  readonly getAccounts: () => ReadonlyArray<UserAccount>;
  readonly getNetworks: () => ReadonlyArray<NetworkType>;

  readonly selectAccount: (id?: UserAccountID) => Promise<void>;
  readonly deleteAccount: (id: UserAccountID) => Promise<void>;
  readonly updateAccountName: (options: UpdateAccountNameOptions) => Promise<void>;
  readonly transfer: (
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<TransactionReceipt, ContractTransaction>>;
  readonly claim: (options?: TransactionOptions) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
  readonly publish: (
    contract: ContractRegister,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<PublishReceipt, InvocationTransaction>>;
  readonly publishAndDeploy: (
    contract: ContractRegister,
    abi: ABI,
    params: ReadonlyArray<Param>,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<PublishReceipt, InvocationTransaction>>;
  readonly registerAsset: (
    asset: AssetRegister,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<RegisterAssetReceipt, InvocationTransaction>>;
  readonly issue: (
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<TransactionReceipt, IssueTransaction>>;
  readonly invoke: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options?: InvokeSendReceiveTransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
  readonly invokeClaim: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    options?: InvokeClaimTransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
  readonly call: (
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ) => Promise<RawCallReceipt>;
  readonly read: (network: NetworkType) => DataProvider;
}

export interface UserAccountProviders {
  readonly [type: string]: UserAccountProvider;
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

export interface SmartContractNetworkDefinition {
  readonly address: AddressString;
}

export interface SmartContractNetworksDefinition {
  readonly [type: string]: SmartContractNetworkDefinition;
}

export interface SmartContractDefinition {
  readonly networks: SmartContractNetworksDefinition;
  readonly abi: ABI;
  readonly sourceMaps?: Promise<SourceMaps>;
}

export interface ReadSmartContractDefinition {
  readonly address: AddressString;
  readonly abi: ABI;
  readonly sourceMaps?: Promise<SourceMaps>;
}

// tslint:disable-next-line no-any
export interface SmartContract<TReadSmartContract extends ReadSmartContract<any> = ReadSmartContractAny> {
  readonly definition: SmartContractDefinition;
  readonly read: (network: NetworkType) => TReadSmartContract;
}

export interface SmartContractAny extends SmartContract {
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

// tslint:disable-next-line no-any
export interface ReadSmartContract<TEvent extends Event<string, any> = Event> {
  readonly definition: ReadSmartContractDefinition;
  readonly iterEvents: (filter?: BlockFilter) => AsyncIterable<TEvent>;
  readonly iterLogs: (filter?: BlockFilter) => AsyncIterable<Log>;
  readonly iterActions: (filter?: BlockFilter) => AsyncIterable<Action>;
  readonly iterStorage: () => AsyncIterable<StorageItem>;
  readonly convertAction: (action: RawAction) => Action;
}

export interface ReadSmartContractAny extends ReadSmartContract {
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

export interface SourceMaps {
  readonly [address: string]: RawSourceMap;
}
