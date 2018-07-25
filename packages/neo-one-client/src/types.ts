import { ContractParameterTypeJSON, Param as ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { Observable } from 'rxjs';
import { RawSourceMap } from 'source-map';

// A NEO address string, e.g. APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR
export type AddressString = string;
// Hex PublicKey, e.g. 02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef
export type PublicKeyString = string;
// Hex PrivateKey
export type PrivateKeyString = string;
// Hex Buffer, e.g. cef0c0fdcfe7838eff6ff104f9cdec2922297537
export type BufferString = string;
// NEO Hash160 string, e.g. 0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9
export type Hash160String = string;
// NEO Hash256 string, e.g. 0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c
export type Hash256String = string;
// Hex Buffer, e.g. 02028a99826ed
export type SignatureString = string;

export interface Peer {
  readonly address: string;
  readonly port: number;
}

export type ContractParameterType = ContractParameterTypeJSON;

export interface SignatureContractParameter {
  readonly type: 'Signature';
  readonly value: BufferString;
}

export interface BooleanContractParameter {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export interface IntegerContractParameter {
  readonly type: 'Integer';
  readonly value: BN;
}

export interface Hash160ContractParameter {
  readonly type: 'Hash160';
  readonly value: Hash160String;
}

export interface Hash256ContractParameter {
  readonly type: 'Hash256';
  readonly value: Hash256String;
}

export interface ByteArrayContractParameter {
  readonly type: 'ByteArray';
  readonly value: BufferString;
}

export interface PublicKeyContractParameter {
  readonly type: 'PublicKey';
  readonly value: PublicKeyString;
}

export interface StringContractParameter {
  readonly type: 'String';
  readonly value: string;
}

export interface ArrayContractParameter {
  readonly type: 'Array';

  readonly value: ReadonlyArray<ContractParameter>;
}

export interface InteropInterfaceContractParameter {
  readonly type: 'InteropInterface';
}

export interface VoidContractParameter {
  readonly type: 'Void';
}

export type ContractParameter =
  | SignatureContractParameter
  | BooleanContractParameter
  | IntegerContractParameter
  | Hash160ContractParameter
  | Hash256ContractParameter
  | ByteArrayContractParameter
  | PublicKeyContractParameter
  | StringContractParameter
  | ArrayContractParameter
  | InteropInterfaceContractParameter
  | VoidContractParameter;

export interface ActionRawBase {
  readonly version: number;
  readonly blockIndex: number;
  readonly blockHash: Hash256String;
  readonly transactionIndex: number;
  readonly transactionHash: Hash256String;
  readonly index: number;
  readonly globalIndex: BigNumber;
  readonly scriptHash: Hash160String;
}

export interface NotificationRaw extends ActionRawBase {
  readonly type: 'Notification';
  readonly args: ReadonlyArray<ContractParameter>;
}

export interface LogRaw extends ActionRawBase {
  readonly type: 'Log';
  readonly message: string;
}

export type ActionRaw = NotificationRaw | LogRaw;

export interface Account {
  readonly address: AddressString;
  readonly frozen: boolean;
  readonly votes: ReadonlyArray<PublicKeyString>;
  readonly balances: {
    readonly [asset: string]: BigNumber;
  };
}

export type AssetType =
  | 'CreditFlag'
  | 'DutyFlag'
  | 'GoverningToken'
  | 'UtilityToken'
  | 'Currency'
  | 'Share'
  | 'Invoice'
  | 'Token';

export interface Asset {
  readonly hash: Hash256String;
  readonly type: AssetType;
  readonly name: string;
  readonly amount: BigNumber;
  readonly available: BigNumber;
  readonly precision: number;
  readonly owner: PublicKeyString;
  readonly admin: AddressString;
  readonly issuer: AddressString;
  readonly expiration: number;
  readonly frozen: boolean;
}

export type AttributeUsageBuffer =
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

export type AttributeUsagePublicKey = 'ECDH02' | 'ECDH03';
export type AttributeUsageHash160 = 'Script';
export type AttributeUsageHash256 =
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

export type AttributeArg =
  | {
      readonly usage: AttributeUsageBuffer;
      readonly data: BufferString;
    }
  | {
      readonly usage: AttributeUsagePublicKey;
      readonly data: PublicKeyString;
    }
  | {
      readonly usage: AttributeUsageHash256;
      readonly data: Hash256String;
    };

export type Attribute =
  | AttributeArg
  | {
      readonly usage: AttributeUsageHash160;
      readonly data: Hash160String;
    };

export interface Contract {
  readonly version: number;
  readonly hash: Hash160String;
  readonly script: BufferString;
  readonly parameters: ReadonlyArray<ContractParameterType>;
  readonly returnType: ContractParameterType;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly properties: {
    readonly storage: boolean;
    readonly dynamicInvoke: boolean;
    readonly payable: boolean;
  };
}

export interface RawInvocationResultSuccess {
  readonly state: 'HALT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly stack: ReadonlyArray<ContractParameter>;
}

export interface RawInvocationResultError {
  readonly state: 'FAULT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly stack: ReadonlyArray<ContractParameter>;
  readonly message: string;
}

export type RawInvocationResult = RawInvocationResultSuccess | RawInvocationResultError;

export interface StorageItem {
  readonly hash: Hash160String;
  readonly key: BufferString;
  readonly value: BufferString;
}

export interface Validator {
  readonly version: number;
  readonly publicKey: PublicKeyString;
  readonly registered: boolean;
  readonly votes: BigNumber;
}

export interface Input {
  readonly txid: Hash256String;
  readonly vout: number;
}

export interface Output {
  readonly asset: Hash256String;
  readonly value: BigNumber;
  readonly address: AddressString;
}

export interface UnspentOutput extends Input, Output {}

export interface Witness {
  readonly invocation: BufferString;
  readonly verification: BufferString;
}

export interface RawInvocationData {
  readonly result: RawInvocationResult;
  readonly asset?: Asset;
  readonly contracts: ReadonlyArray<Contract>;
  readonly deletedContractHashes: ReadonlyArray<Hash160String>;
  readonly migratedContractHashes: ReadonlyArray<[Hash160String, Hash160String]>;
  readonly voteUpdates: ReadonlyArray<[AddressString, ReadonlyArray<PublicKeyString>]>;
  readonly actions: ReadonlyArray<ActionRaw>;
}

export interface TransactionBase {
  readonly version: number;
  readonly txid: Hash256String;
  readonly size: number;
  readonly attributes: ReadonlyArray<Attribute>;
  readonly vin: ReadonlyArray<Input>;
  readonly vout: ReadonlyArray<Output>;
  readonly scripts: ReadonlyArray<Witness>;
  readonly systemFee: BigNumber;
  readonly networkFee: BigNumber;
}

export interface ConfirmedTransactionBase {
  readonly data: {
    readonly blockHash: Hash256String;
    readonly blockIndex: number;
    readonly index: number;
    readonly globalIndex: BigNumber;
  };
}

export interface ClaimTransaction extends TransactionBase {
  readonly type: 'ClaimTransaction';
  readonly claims: ReadonlyArray<Input>;
}

export interface ConfirmedClaimTransaction extends ClaimTransaction, ConfirmedTransactionBase {}

export interface ContractTransaction extends TransactionBase {
  readonly type: 'ContractTransaction';
}

export interface ConfirmedContractTransaction extends ContractTransaction, ConfirmedTransactionBase {}

export interface EnrollmentTransaction extends TransactionBase {
  readonly type: 'EnrollmentTransaction';
  readonly publicKey: PublicKeyString;
}

export interface ConfirmedEnrollmentTransaction extends EnrollmentTransaction, ConfirmedTransactionBase {}

export interface IssueTransaction extends TransactionBase {
  readonly type: 'IssueTransaction';
}

export interface ConfirmedIssueTransaction extends IssueTransaction, ConfirmedTransactionBase {}

export interface InvocationTransaction extends TransactionBase {
  readonly type: 'InvocationTransaction';
  readonly script: BufferString;
  readonly gas: BigNumber;
}

export interface ConfirmedInvocationTransaction extends InvocationTransaction, ConfirmedTransactionBase {
  readonly invocationData: RawInvocationData;
}

export interface MinerTransaction extends TransactionBase {
  readonly type: 'MinerTransaction';
  readonly nonce: number;
}

export interface ConfirmedMinerTransaction extends MinerTransaction, ConfirmedTransactionBase {}

export interface PublishTransaction extends TransactionBase {
  readonly type: 'PublishTransaction';
  readonly contract: Contract;
}

export interface ConfirmedPublishTransaction extends PublishTransaction, ConfirmedTransactionBase {}

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

export interface StateDescriptor {
  readonly type: 'Account' | 'Validator';
  readonly key: BufferString;
  readonly field: string;
  readonly value: BufferString;
}

export interface StateTransaction extends TransactionBase {
  readonly type: 'StateTransaction';
  readonly descriptors: ReadonlyArray<StateDescriptor>;
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
  readonly version: number;
  readonly hash: Hash256String;
  readonly previousBlockHash: Hash256String;
  readonly merkleRoot: Hash256String;
  readonly time: number;
  readonly index: number;
  readonly nonce: string;
  readonly nextConsensus: AddressString;
  readonly script: Witness;
  readonly size: number;
}

export interface Block extends Header {
  readonly transactions: ReadonlyArray<ConfirmedTransaction>;
}

export interface AssetRegister {
  readonly assetType: AssetType;
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
  readonly properties: {
    readonly storage: boolean;
    readonly dynamicInvoke: boolean;
    readonly payable: boolean;
  };
}

export interface Transfer {
  readonly amount: BigNumber;
  readonly asset: Hash256String;
  readonly to: AddressString;
}

export interface ParamArray extends Array<Param | undefined> {}
export type Param =
  | BigNumber
  | BufferString
  | Hash160String
  | Hash256String
  | AddressString
  | PublicKeyString
  | boolean
  | ParamArray;

export interface ParamJSONArray extends Array<Param | undefined> {}
export type ParamJSON =
  | string
  | BufferString
  | Hash160String
  | Hash256String
  | AddressString
  | PublicKeyString
  | boolean
  | ParamJSONArray;

export interface EventParameters {
  readonly [name: string]: Param | undefined;
}
export interface Event extends ActionRawBase {
  readonly type: 'Event';
  readonly name: string;
  readonly parameters: EventParameters;
}

export interface Log extends ActionRawBase {
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
  readonly scriptHash: Hash160String;
  readonly publicKey: PublicKeyString;
  readonly configurableName: boolean;
  readonly deletable: boolean;
}

export interface TransactionOptions {
  readonly from?: UserAccountID;
  readonly attributes?: ReadonlyArray<AttributeArg>;
  readonly networkFee?: BigNumber;
  readonly monitor?: Monitor;
}

export interface InvokeTransactionOptions extends TransactionOptions {
  readonly transfers?: ReadonlyArray<Transfer>;
}

export interface TransactionReceipt {
  readonly blockIndex: number;
  readonly blockHash: Hash256String;
  readonly transactionIndex: number;
}

export interface RawInvokeReceipt extends TransactionReceipt {
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<ActionRaw>;
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

export interface InvokeReceipt extends TransactionReceipt {
  readonly result: InvocationResult<Param | undefined>;
  readonly events: ReadonlyArray<Event>;
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

export interface Options {
  readonly secondsPerBlock: number;
}

export interface TransactionResult<TTransactionReceipt, TTransaction extends Transaction = Transaction> {
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
  readonly getContract: (hash: Hash160String, monitor?: Monitor) => Promise<Contract>;
  readonly getMemPool: (monitor?: Monitor) => Promise<ReadonlyArray<Hash256String>>;
  readonly getTransaction: (hash: Hash256String, monitor?: Monitor) => Promise<Transaction>;
  readonly getOutput: (input: Input, monitor?: Monitor) => Promise<Output>;
  readonly getValidators: (monitor?: Monitor) => Promise<ReadonlyArray<Validator>>;
  readonly getConnectedPeers: (monitor?: Monitor) => Promise<ReadonlyArray<Peer>>;
  readonly getStorage: (hash: Hash160String, key: BufferString, monitor?: Monitor) => Promise<StorageItem>;
  readonly iterStorage: (hash: Hash160String, monitor?: Monitor) => AsyncIterable<StorageItem>;
  readonly iterActionsRaw: (filterIn?: BlockFilter) => AsyncIterable<ActionRaw>;
  readonly call: (
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ) => Promise<RawInvocationResult>;
}

export interface DeveloperProvider {
  readonly network: NetworkType;
  readonly runConsensusNow: (monitor?: Monitor) => Promise<void>;
  readonly updateSettings: (options: Options, monitor?: Monitor) => Promise<void>;
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
  readonly execute: (
    script: BufferString,
    options?: InvokeTransactionOptions,
    sourceMap?: RawSourceMap,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
  readonly transfer: (
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<TransactionReceipt>>;

  readonly claim: (options?: TransactionOptions) => Promise<TransactionResult<TransactionReceipt>>;

  readonly publish: (
    contract: ContractRegister,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<PublishReceipt>>;

  readonly registerAsset: (
    asset: AssetRegister,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<RegisterAssetReceipt>>;

  readonly issue: (
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<TransactionReceipt>>;

  readonly invoke: (
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
    sourceMap?: RawSourceMap,
  ) => Promise<TransactionResult<RawInvokeReceipt>>;
  readonly call: (
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    options?: TransactionOptions,
  ) => Promise<RawInvocationResult>;

  readonly read: (network: NetworkType) => DataProvider;
}

export interface UserAccountProviders {
  readonly [type: string]: UserAccountProvider;
}

export interface SignatureABIReturn {
  readonly type: 'Signature';
}
export interface BooleanABIReturn {
  readonly type: 'Boolean';
}
export interface Hash160ABIReturn {
  readonly type: 'Hash160';
}
export interface Hash256ABIReturn {
  readonly type: 'Hash256';
}
export interface ByteArrayABIReturn {
  readonly type: 'ByteArray';
}
export interface PublicKeyABIReturn {
  readonly type: 'PublicKey';
}
export interface StringABIReturn {
  readonly type: 'String';
}
export interface InteropInterfaceABIReturn {
  readonly type: 'InteropInterface';
}
export interface VoidABIReturn {
  readonly type: 'Void';
}
export interface IntegerABIReturn {
  readonly type: 'Integer';
  readonly decimals: number;
}

export interface SignatureABIParameter {
  readonly name: string;
  readonly type: 'Signature';
}
export interface BooleanABIParameter {
  readonly name: string;
  readonly type: 'Boolean';
}
export interface Hash160ABIParameter {
  readonly name: string;
  readonly type: 'Hash160';
}
export interface Hash256ABIParameter {
  readonly name: string;
  readonly type: 'Hash256';
}
export interface ByteArrayABIParameter {
  readonly name: string;
  readonly type: 'ByteArray';
}
export interface PublicKeyABIParameter {
  readonly name: string;
  readonly type: 'PublicKey';
}
export interface StringABIParameter {
  readonly name: string;
  readonly type: 'String';
}
export interface InteropInterfaceABIParameter {
  readonly name: string;
  readonly type: 'InteropInterface';
}
export interface VoidABIParameter {
  readonly name: string;
  readonly type: 'Void';
}
export interface IntegerABIParameter {
  readonly name: string;
  readonly type: 'Integer';
  readonly decimals: number;
}

export type ABIReturn =
  | SignatureABIReturn
  | BooleanABIReturn
  | Hash160ABIReturn
  | Hash256ABIReturn
  | ByteArrayABIReturn
  | PublicKeyABIReturn
  | StringABIReturn
  | { readonly type: 'Array'; readonly value: ABIReturn }
  | InteropInterfaceABIReturn
  | VoidABIReturn
  | IntegerABIReturn;
export type ABIParameter =
  | SignatureABIParameter
  | BooleanABIParameter
  | Hash160ABIParameter
  | Hash256ABIParameter
  | ByteArrayABIParameter
  | PublicKeyABIParameter
  | StringABIParameter
  | { readonly name: string; readonly type: 'Array'; readonly value: ABIReturn }
  | InteropInterfaceABIParameter
  | VoidABIParameter
  | IntegerABIParameter;

export type ArrayABI =
  | { readonly type: 'Array'; readonly value: ABIReturn }
  | { readonly name: string; readonly type: 'Array'; readonly value: ABIReturn };
export type SignatureABI = SignatureABIParameter | SignatureABIReturn;
export type BooleanABI = BooleanABIParameter | BooleanABIReturn;
export type Hash160ABI = Hash160ABIParameter | Hash160ABIReturn;
export type Hash256ABI = Hash256ABIParameter | Hash256ABIReturn;
export type ByteArrayABI = ByteArrayABIParameter | ByteArrayABIReturn;
export type PublicKeyABI = PublicKeyABIParameter | PublicKeyABIReturn;
export type StringABI = StringABIParameter | StringABIReturn;
export type InteropInterfaceABI = InteropInterfaceABIParameter | InteropInterfaceABIReturn;
export type VoidABI = VoidABIParameter | VoidABIReturn;
export type IntegerABI = IntegerABIParameter | IntegerABIReturn;

export interface ABIFunction {
  readonly name: string;
  readonly constant?: boolean;
  readonly parameters?: ReadonlyArray<ABIParameter>;
  readonly verify?: boolean;
  readonly returnType: ABIReturn;
}

export interface ABIEvent {
  readonly name: string;
  readonly parameters: ReadonlyArray<ABIParameter>;
}

export interface ABI {
  readonly functions: ReadonlyArray<ABIFunction>;
  readonly events?: ReadonlyArray<ABIEvent>;
}

export interface SmartContractNetworkDefinition {
  readonly hash: Hash160String;
}

export interface SmartContractNetworksDefinition {
  readonly [type: string]: SmartContractNetworkDefinition;
}

export interface SmartContractDefinition {
  readonly networks: SmartContractNetworksDefinition;
  readonly abi: ABI;
  readonly sourceMap?: RawSourceMap;
}

export interface ReadSmartContractDefinition {
  readonly hash: Hash160String;
  readonly abi: ABI;
  readonly sourceMap?: RawSourceMap;
}

export interface SmartContract {
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

export interface ReadSmartContract {
  readonly iterEvents: (filter?: BlockFilter) => AsyncIterable<Event>;
  readonly iterLogs: (filter?: BlockFilter) => AsyncIterable<Log>;
  readonly iterActions: (filter?: BlockFilter) => AsyncIterable<Action>;
  readonly iterStorage: () => AsyncIterable<StorageItem>;
  readonly iterActionsRaw: (filter?: BlockFilter) => AsyncIterable<ActionRaw>;
  readonly convertAction: (action: ActionRaw) => Action;
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}
