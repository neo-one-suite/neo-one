import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { Monitor } from '@neo-one/monitor';
import { Observable } from 'rxjs';
import { Param as ScriptBuilderParam } from '@neo-one/client-core';

// A NEO address string, e.g. APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR
export type AddressString = string;
// Hex PublicKey, e.g. 02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef
export type PublicKeyString = string;
// Hex PrivateKey
export type PrivateKeyString = string;
// Hex Buffer, e.g. 02028a99826ed
export type BufferString = string;
// NEO Hash160 string, e.g. 0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9
export type Hash160String = string;
// NEO Hash256 string, e.g. 0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c
export type Hash256String = string;
// Hex Buffer, e.g. 02028a99826ed
export type SignatureString = string;

export interface Peer {
  address: string;
  port: number;
}

export type ContractParameterType =
  | 'Signature'
  | 'Boolean'
  | 'Integer'
  | 'Hash160'
  | 'Hash256'
  | 'ByteArray'
  | 'PublicKey'
  | 'String'
  | 'Array'
  | 'InteropInterface'
  | 'Void';

export interface SignatureContractParameter {
  type: 'Signature';
  value: BufferString;
}

export interface BooleanContractParameter {
  type: 'Boolean';
  value: boolean;
}

export interface IntegerContractParameter {
  type: 'Integer';
  value: BN;
}

export interface Hash160ContractParameter {
  type: 'Hash160';
  value: Hash160String;
}

export interface Hash256ContractParameter {
  type: 'Hash256';
  value: Hash256String;
}

export interface ByteArrayContractParameter {
  type: 'ByteArray';
  value: BufferString;
}

export interface PublicKeyContractParameter {
  type: 'PublicKey';
  value: PublicKeyString;
}

export interface StringContractParameter {
  type: 'String';
  value: string;
}

export interface ArrayContractParameter {
  type: 'Array';

  value: ContractParameter[];
}

export interface InteropInterfaceContractParameter {
  type: 'InteropInterface';
}

export interface VoidContractParameter {
  type: 'Void';
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
  version: number;
  blockIndex: number;
  blockHash: Hash256String;
  transactionIndex: number;
  transactionHash: Hash256String;
  index: number;
  globalIndex: BigNumber;
  scriptHash: Hash160String;
}

export interface NotificationRaw extends ActionRawBase {
  type: 'Notification';
  args: ContractParameter[];
}

export interface LogRaw extends ActionRawBase {
  type: 'Log';
  message: string;
}

export type ActionRaw = NotificationRaw | LogRaw;

export interface Account {
  address: AddressString;
  frozen: boolean;
  votes: PublicKeyString[];
  balances: {
    [asset: string]: BigNumber;
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
  hash: Hash256String;
  type: AssetType;
  name: string;
  amount: BigNumber;
  available: BigNumber;
  precision: number;
  owner: PublicKeyString;
  admin: AddressString;
  issuer: AddressString;
  expiration: number;
  frozen: boolean;
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
      usage: AttributeUsageBuffer;
      data: BufferString;
    }
  | {
      usage: AttributeUsagePublicKey;
      data: PublicKeyString;
    }
  | {
      usage: AttributeUsageHash256;
      data: Hash256String;
    };

export type Attribute =
  | AttributeArg
  | {
      usage: AttributeUsageHash160;
      data: Hash160String;
    };

export interface Contract {
  version: number;
  hash: Hash160String;
  script: BufferString;
  parameters: ContractParameterType[];
  returnType: ContractParameterType;
  name: string;
  codeVersion: string;
  author: string;
  email: string;
  description: string;
  properties: {
    storage: boolean;
    dynamicInvoke: boolean;
    payable: boolean;
  };
}

export interface RawInvocationResultSuccess {
  state: 'HALT';
  gasConsumed: BigNumber;
  gasCost: BigNumber;
  stack: ContractParameter[];
}

export interface RawInvocationResultError {
  state: 'FAULT';
  gasConsumed: BigNumber;
  gasCost: BigNumber;
  stack: ContractParameter[];
  message: string;
}

export type RawInvocationResult =
  | RawInvocationResultSuccess
  | RawInvocationResultError;

export interface StorageItem {
  hash: Hash160String;
  key: BufferString;
  value: BufferString;
}

export interface Validator {
  version: number;
  publicKey: PublicKeyString;
  registered: boolean;
  votes: BigNumber;
}

export interface Input {
  txid: Hash256String;
  vout: number;
}

export interface Output {
  asset: Hash256String;
  value: BigNumber;
  address: AddressString;
}

export interface UnspentOutput {
  asset: Hash256String;
  value: BigNumber;
  address: AddressString;
  txid: Hash256String;
  vout: number;
}

export interface Witness {
  invocation: BufferString;
  verification: BufferString;
}

export interface RawInvocationData {
  result: RawInvocationResult;
  asset?: Asset;
  contracts: Contract[];
  deletedContractHashes: Hash160String[];
  migratedContractHashes: Array<[Hash160String, Hash160String]>;
  voteUpdates: Array<[AddressString, PublicKeyString[]]>;
  actions: ActionRaw[];
}

export interface TransactionBase {
  version: number;
  txid: Hash256String;
  size: number;
  attributes: Attribute[];
  vin: Input[];
  vout: Output[];
  scripts: Witness[];
  systemFee: BigNumber;
  networkFee: BigNumber;
}

export interface ConfirmedTransactionBase {
  data: {
    blockHash: Hash256String;
    blockIndex: number;
    index: number;
    globalIndex: BigNumber;
  };
}

export interface ClaimTransaction extends TransactionBase {
  type: 'ClaimTransaction';
  claims: Input[];
}

export interface ConfirmedClaimTransaction
  extends ClaimTransaction,
    ConfirmedTransactionBase {}

export interface ContractTransaction extends TransactionBase {
  type: 'ContractTransaction';
}

export interface ConfirmedContractTransaction
  extends ContractTransaction,
    ConfirmedTransactionBase {}

export interface EnrollmentTransaction extends TransactionBase {
  type: 'EnrollmentTransaction';
  publicKey: PublicKeyString;
}

export interface ConfirmedEnrollmentTransaction
  extends EnrollmentTransaction,
    ConfirmedTransactionBase {}

export interface IssueTransaction extends TransactionBase {
  type: 'IssueTransaction';
}

export interface ConfirmedIssueTransaction
  extends IssueTransaction,
    ConfirmedTransactionBase {}

export interface InvocationTransaction extends TransactionBase {
  type: 'InvocationTransaction';
  script: BufferString;
  gas: BigNumber;
}

export interface ConfirmedInvocationTransaction
  extends InvocationTransaction,
    ConfirmedTransactionBase {
  invocationData: RawInvocationData;
}

export interface MinerTransaction extends TransactionBase {
  type: 'MinerTransaction';
  nonce: number;
}

export interface ConfirmedMinerTransaction
  extends MinerTransaction,
    ConfirmedTransactionBase {}

export interface PublishTransaction extends TransactionBase {
  type: 'PublishTransaction';
  contract: Contract;
}

export interface ConfirmedPublishTransaction
  extends PublishTransaction,
    ConfirmedTransactionBase {}

export interface RegisterTransaction extends TransactionBase {
  type: 'RegisterTransaction';
  asset: {
    type: AssetType;
    name: string;
    amount: BigNumber;
    precision: number;
    owner: PublicKeyString;
    admin: AddressString;
  };
}

export interface ConfirmedRegisterTransaction
  extends RegisterTransaction,
    ConfirmedTransactionBase {}

export interface StateDescriptor {
  type: 'Account' | 'Validator';
  key: BufferString;
  field: string;
  value: BufferString;
}

export interface StateTransaction extends TransactionBase {
  type: 'StateTransaction';
  descriptors: StateDescriptor[];
}

export interface ConfirmedStateTransaction
  extends StateTransaction,
    ConfirmedTransactionBase {}

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
  version: number;
  hash: Hash256String;
  previousBlockHash: Hash256String;
  merkleRoot: Hash256String;
  time: number;
  index: number;
  nonce: string;
  nextConsensus: AddressString;
  script: Witness;
  size: number;
}

export interface Block extends Header {
  transactions: ConfirmedTransaction[];
}

export interface AssetRegister {
  assetType: AssetType;
  name: string;
  amount: BigNumber;
  precision: number;
  owner: PublicKeyString;
  admin: AddressString;
  issuer: AddressString;
}

export interface ContractRegister {
  script: BufferString;
  parameters: ContractParameterType[];
  returnType: ContractParameterType;
  name: string;
  codeVersion: string;
  author: string;
  email: string;
  description: string;
  properties: {
    storage: boolean;
    dynamicInvoke: boolean;
    payable: boolean;
  };
}

export interface Transfer {
  amount: BigNumber;
  asset: Hash256String;
  to: AddressString;
}

export interface ParamArray extends Array<Param | null> {}
export type Param =
  | BigNumber
  | BufferString
  | Hash160String
  | Hash256String
  | AddressString
  | PublicKeyString
  | boolean
  | ParamArray;

export interface ParamJSONArray extends Array<Param | null> {}
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
  [name: string]: Param | null;
}
export interface Event extends ActionRawBase {
  type: 'Event';
  name: string;
  parameters: EventParameters;
}

export interface Log extends ActionRawBase {
  type: 'Log';
  message: string;
}

export type Action = Event | Log;

export type NetworkType = 'main' | 'test' | string;
export interface NetworkSettings {
  issueGASFee: BigNumber;
}

export interface UserAccountID {
  network: NetworkType;
  address: AddressString;
}

export interface UserAccount {
  type: string;
  id: UserAccountID;
  name: string;
  scriptHash: Hash160String;
  publicKey: PublicKeyString;
  configurableName: boolean;
  deletable: boolean;
}

export interface TransactionOptions {
  from?: UserAccountID;
  attributes?: AttributeArg[];
  networkFee?: BigNumber;
  monitor?: Monitor;
}

export interface InvokeTransactionOptions extends TransactionOptions {
  transfers?: Transfer[];
}

export interface TransactionReceipt {
  blockIndex: number;
  blockHash: Hash256String;
  transactionIndex: number;
}

export interface InvokeReceiptInternal extends TransactionReceipt {
  result: RawInvocationResult;
  actions: ActionRaw[];
}

export interface InvocationResultSuccess<TValue> {
  state: 'HALT';
  gasConsumed: BigNumber;
  gasCost: BigNumber;
  value: TValue;
}

export interface InvocationResultError {
  state: 'FAULT';
  gasConsumed: BigNumber;
  gasCost: BigNumber;
  message: string;
}

export type InvocationResult<TValue> =
  | InvocationResultSuccess<TValue>
  | InvocationResultError;

export interface InvokeReceipt extends TransactionReceipt {
  result: InvocationResult<Param | null>;
  events: Event[];
  logs: Log[];
}

export interface PublishReceipt extends TransactionReceipt {
  result: InvocationResult<Contract>;
}

export interface RegisterAssetReceipt extends TransactionReceipt {
  result: InvocationResult<Asset>;
}

export interface GetOptions {
  timeoutMS?: number;
  monitor?: Monitor;
}

export interface Options {
  secondsPerBlock: number;
}

export interface TransactionResult<TTransactionReceipt> {
  transaction: Transaction;
  confirmed: (options?: GetOptions) => Promise<TTransactionReceipt>;
}

// Indices are inclusive start, exclusive end.
export interface BlockFilter {
  indexStart?: number;
  indexStop?: number;
  monitor?: Monitor;
}

export interface UpdateAccountNameOptions {
  id: UserAccountID;
  name: string;
  monitor?: Monitor;
}

export interface DataProvider {
  readonly network: NetworkType;

  getAccount(address: AddressString, monitor?: Monitor): Promise<Account>;

  getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset>;

  getBlock(
    hashOrIndex: number | Hash256String,
    options?: GetOptions,
  ): Promise<Block>;
  iterBlocks(filter?: BlockFilter): AsyncIterable<Block>;

  getBestBlockHash(monitor?: Monitor): Promise<Hash256String>;
  getBlockCount(monitor?: Monitor): Promise<number>;

  getContract(hash: Hash160String, monitor?: Monitor): Promise<Contract>;

  getMemPool(monitor?: Monitor): Promise<Hash256String[]>;

  getTransaction(hash: Hash256String, monitor?: Monitor): Promise<Transaction>;

  getValidators(monitor?: Monitor): Promise<Validator[]>;

  getConnectedPeers(monitor?: Monitor): Promise<Peer[]>;

  getStorage(
    hash: Hash160String,
    key: BufferString,
    monitor?: Monitor,
  ): Promise<StorageItem>;
  iterStorage(
    hash: Hash160String,
    monitor?: Monitor,
  ): AsyncIterable<StorageItem>;
  iterActionsRaw(filterIn?: BlockFilter): AsyncIterable<ActionRaw>;
  call(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    monitor?: Monitor,
  ): Promise<RawInvocationResult>;
}

export interface DeveloperProvider {
  readonly network: NetworkType;

  runConsensusNow(monitor?: Monitor): Promise<void>;
  updateSettings(options: Options, monitor?: Monitor): Promise<void>;
  fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void>;
  fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void>;
  reset(monitor?: Monitor): Promise<void>;
}

export interface UserAccountProvider {
  readonly type: string;
  readonly currentAccount$: Observable<UserAccount | null>;
  readonly accounts$: Observable<UserAccount[]>;
  readonly networks$: Observable<NetworkType[]>;

  getCurrentAccount(): UserAccount | null;
  getAccounts(): UserAccount[];
  getNetworks(): NetworkType[];

  selectAccount(id?: UserAccountID): Promise<void>;
  deleteAccount(id: UserAccountID): Promise<void>;
  updateAccountName(options: UpdateAccountNameOptions): Promise<void>;

  transfer(
    transfers: Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;

  claim(
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;

  publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>>;

  registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>>;

  issue(
    transfers: Transfer[],
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;

  invoke(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    paramsZipped: Array<[string, Param | null]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
  ): Promise<TransactionResult<InvokeReceiptInternal>>;
  call(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    options?: TransactionOptions,
  ): Promise<RawInvocationResult>;

  read(network: NetworkType): DataProvider;
}

export interface UserAccountProviders {
  [type: string]: UserAccountProvider;
}

export interface SignatureABIReturn {
  type: 'Signature';
}
export interface BooleanABIReturn {
  type: 'Boolean';
}
export interface Hash160ABIReturn {
  type: 'Hash160';
}
export interface Hash256ABIReturn {
  type: 'Hash256';
}
export interface ByteArrayABIReturn {
  type: 'ByteArray';
}
export interface PublicKeyABIReturn {
  type: 'PublicKey';
}
export interface StringABIReturn {
  type: 'String';
}
export interface InteropInterfaceABIReturn {
  type: 'InteropInterface';
}
export interface VoidABIReturn {
  type: 'Void';
}
export interface IntegerABIReturn {
  type: 'Integer';
  decimals: number;
}

export interface SignatureABIParameter {
  name: string;
  type: 'Signature';
}
export interface BooleanABIParameter {
  name: string;
  type: 'Boolean';
}
export interface Hash160ABIParameter {
  name: string;
  type: 'Hash160';
}
export interface Hash256ABIParameter {
  name: string;
  type: 'Hash256';
}
export interface ByteArrayABIParameter {
  name: string;
  type: 'ByteArray';
}
export interface PublicKeyABIParameter {
  name: string;
  type: 'PublicKey';
}
export interface StringABIParameter {
  name: string;
  type: 'String';
}
export interface InteropInterfaceABIParameter {
  name: string;
  type: 'InteropInterface';
}
export interface VoidABIParameter {
  name: string;
  type: 'Void';
}
export interface IntegerABIParameter {
  name: string;
  type: 'Integer';
  decimals: number;
}

export type ABIReturn =
  | SignatureABIReturn
  | BooleanABIReturn
  | Hash160ABIReturn
  | Hash256ABIReturn
  | ByteArrayABIReturn
  | PublicKeyABIReturn
  | StringABIReturn
  | { type: 'Array'; value: ABIReturn }
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
  | { name: string; type: 'Array'; value: ABIReturn }
  | InteropInterfaceABIParameter
  | VoidABIParameter
  | IntegerABIParameter;

export type ArrayABI =
  | { type: 'Array'; value: ABIReturn }
  | { name: string; type: 'Array'; value: ABIReturn };
export type SignatureABI = SignatureABIParameter | SignatureABIReturn;
export type BooleanABI = BooleanABIParameter | BooleanABIReturn;
export type Hash160ABI = Hash160ABIParameter | Hash160ABIReturn;
export type Hash256ABI = Hash256ABIParameter | Hash256ABIReturn;
export type ByteArrayABI = ByteArrayABIParameter | ByteArrayABIReturn;
export type PublicKeyABI = PublicKeyABIParameter | PublicKeyABIReturn;
export type StringABI = StringABIParameter | StringABIReturn;
export type InteropInterfaceABI =
  | InteropInterfaceABIParameter
  | InteropInterfaceABIReturn;
export type VoidABI = VoidABIParameter | VoidABIReturn;
export type IntegerABI = IntegerABIParameter | IntegerABIReturn;

export interface ABIFunction {
  name: string;
  constant?: boolean;
  parameters?: ABIParameter[];
  verify?: boolean;
  returnType: ABIReturn;
}

export interface ABIEvent {
  name: string;
  parameters: ABIParameter[];
}

export interface ABI {
  functions: ABIFunction[];
  events?: ABIEvent[];
}

export interface SmartContractNetworkDefinition {
  hash: Hash160String;
}

export interface SmartContractNetworksDefinition {
  [type: string]: SmartContractNetworkDefinition;
}

export interface SmartContractDefinition {
  networks: SmartContractNetworksDefinition;
  abi: ABI;
}

export interface SmartContract {
  [key: string]: any;
}

export interface ReadSmartContract {
  iterEvents: (filter?: BlockFilter) => AsyncIterable<Event>;
  iterLogs: (filter?: BlockFilter) => AsyncIterable<Log>;
  iterActions: (filter?: BlockFilter) => AsyncIterable<Action>;
  iterStorage: () => AsyncIterable<StorageItem>;
  iterActionsRaw: (filter?: BlockFilter) => AsyncIterable<ActionRaw>;
  convertAction: (action: ActionRaw) => Action;
  [key: string]: any;
}
