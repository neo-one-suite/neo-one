/* @flow */
// flowlint unclear-type:off
import type BigNumber from 'bignumber.js';
import type {
  ActionJSON,
  ActionTypeJSON,
  AccountJSON,
  AssetJSON,
  AssetNameJSON,
  AssetTypeJSON,
  AttributeJSON,
  BlockJSON,
  ClaimTransactionJSON,
  ContractJSON,
  ContractTransactionJSON,
  EnrollmentTransactionJSON,
  HeaderJSON,
  Input as InputModel,
  InputJSON,
  InvocationResultJSON,
  InvocationResultSuccessJSON,
  IssueTransactionJSON,
  InvocationTransactionJSON,
  LogActionJSON,
  MinerTransactionJSON,
  NotificationActionJSON,
  OutputJSON,
  Param,
  PublishTransactionJSON,
  RegisterTransactionJSON,
  StorageItemJSON,
  TransactionJSON,
  ValidatorJSON,
  WitnessJSON,
  ContractParameterJSON,
  ContractParameterTypeJSON,
  SignatureContractParameterJSON,
  BooleanContractParameterJSON,
  IntegerContractParameterJSON,
  Hash160ContractParameterJSON,
  Hash256ContractParameterJSON,
  ByteArrayContractParameterJSON,
  PublicKeyContractParameterJSON,
  StringContractParameterJSON,
  ArrayContractParameterJSON,
  InteropInterfaceContractParameterJSON,
  VoidContractParameterJSON,
  ECPoint,
  ECPointHex,
  UInt160,
  UInt160Hex,
  UInt256,
  UInt256Hex,
  PrivateKey,
  PrivateKeyHex,
} from '@neo-one/core';

export type Action = ActionJSON;
export type ActionType = ActionTypeJSON;
export type Account = AccountJSON;
export type Asset = AssetJSON;
export type AssetName = AssetNameJSON;
export type AssetType = AssetTypeJSON;
export type Attribute = AttributeJSON;
export type Block = BlockJSON;
export type ClaimTransaction = ClaimTransactionJSON;
export type Contract = ContractJSON;
export type ContractTransaction = ContractTransactionJSON;
export type EnrollmentTransaction = EnrollmentTransactionJSON;
export type Header = HeaderJSON;
export type Input = InputJSON;
export type InvocationResult = InvocationResultJSON;
export type InvocationResultSuccess = InvocationResultSuccessJSON;
export type IssueTransaction = IssueTransactionJSON;
export type InvocationTransaction = InvocationTransactionJSON;
export type LogAction = LogActionJSON;
export type MinerTransaction = MinerTransactionJSON;
export type NotificationAction = NotificationActionJSON;
export type Output = OutputJSON;
export type PublishTransaction = PublishTransactionJSON;
export type RegisterTransaction = RegisterTransactionJSON;
export type StorageItem = StorageItemJSON;
export type Transaction = TransactionJSON;
export type Validator = ValidatorJSON;
export type Witness = WitnessJSON;
export type ContractParameter = ContractParameterJSON;
export type ContractParameterType = ContractParameterTypeJSON;
export type SignatureContractParameter = SignatureContractParameterJSON;
export type BooleanContractParameter = BooleanContractParameterJSON;
export type IntegerContractParameter = IntegerContractParameterJSON;
export type Hash160ContractParameter = Hash160ContractParameterJSON;
export type Hash256ContractParameter = Hash256ContractParameterJSON;
export type ByteArrayContractParameter = ByteArrayContractParameterJSON;
export type PublicKeyContractParameter = PublicKeyContractParameterJSON;
export type StringContractParameter = StringContractParameterJSON;
export type ArrayContractParameter = ArrayContractParameterJSON;
export type InteropInterfaceContractParameter = InteropInterfaceContractParameterJSON;
export type VoidContractParameter = VoidContractParameterJSON;

export type Hash160Like = UInt160 | UInt160Hex | Buffer | string;
export type Hash256Like = UInt256 | UInt256Hex | Buffer | string;
export type AddressLike = Hash160Like;
export type NumberLike = number | string | BigNumber;
export type PrivateKeyLike = PrivateKey | PrivateKeyHex | Buffer | string;
export type PublicKeyLike = ECPoint | ECPointHex | Buffer | string;
export type ScriptLike = Buffer | string;
export type OutputLike = {|
  address: AddressLike,
  asset: Hash256Like,
  value: NumberLike,
|};
export type WitnessLike = {|
  invocation: ScriptLike,
  verification: ScriptLike,
|};
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
export type AttributeLike =
  | {|
      usage: AttributeUsageBuffer,
      value: ScriptLike,
    |}
  | {|
      usage: AttributeUsagePublicKey,
      value: PublicKeyLike,
    |}
  | {|
      usage: AttributeUsageHash160,
      value: Hash160Like,
    |}
  | {|
      usage: AttributeUsageHash256,
      value: Hash256Like,
    |};
export type InputLike = {|
  txid: Hash256Like,
  vout: number,
|};
export type Sign = (message: string) => Promise<ScriptLike>;
export type PrivateKeyLikeOrSign =
  | PrivateKeyLike
  | {|
      sign: Sign,
      publicKey: PublicKeyLike,
    |};
export type ContractLike = {|
  script: ScriptLike,
  parameters: Array<ContractParameterType>,
  returnType: ContractParameterType,
  hasStorage: boolean,
  name: string,
  codeVersion: string,
  author: string,
  email: string,
  description: string,
|};
export type AssetLike = {|
  assetType: AssetType,
  name: string,
  amount: NumberLike,
  precision: number,
  owner: PublicKeyLike,
  admin: Hash160Like,
  issuer: Hash160Like,
|};
export type TransferLike = {|
  to: AddressLike,
  asset: Hash256Like,
  amount: NumberLike,
|};
export type ParamLike =
  | BigNumber
  | number
  | Hash160Like
  | Hash256Like
  | string
  | Buffer
  | boolean
  | Param
  | Array<$FlowFixMe>;

// All indices are inclusive
export type ActionFilter = {|
  blockIndexStart?: number,
  transactionIndexStart?: number,
  indexStart?: number,
  blockIndexStop?: number,
  transactionIndexStop?: number,
  indexStop?: number,
|};
export type BlockFilter = {|
  indexStart?: number,
  indexStop?: number,
|};
export type GetActionsFilter = {|
  blockIndexStart?: number,
  transactionIndexStart?: number,
  indexStart?: number,
  blockIndexStop?: number,
  transactionIndexStop?: number,
  indexStop?: number,
  scriptHash?: Hash160Like,
|};

export type ABIParameter =
  | {|
      name: string,
      type: ContractParameterType,
    |}
  | {|
      name: string,
      type: 'Integer',
      decimals?: number,
    |};
export type ABIReturn =
  | ContractParameterType
  | {| type: 'Integer', decimals?: number |};
export type ABIFunction = {|
  name: string,
  constant?: boolean,
  parameters?: Array<ABIParameter>,
  returnType: ABIReturn,
|};
export type ABIEvent = {|
  name: string,
  parameters: Array<ABIParameter>,
|};
export type ABI = {|
  hash: Hash160Like,
  functions: Array<ABIFunction>,
  events?: Array<ABIEvent>,
|};
export type EventParameter =
  | boolean
  | BigNumber
  | string
  | Buffer
  | Array<EventParameter>;
export type EventParameters = { [name: string]: EventParameter };
export type Event = {|
  name: string,
  parameters: EventParameters,
|};
export type ConstantFunction = (options?: {|
  params?: Array<ParamLike>,
|}) => Promise<any>;
export type BasicFunction = (options: {|
  params?: Array<ParamLike>,
  privateKey: PrivateKeyLikeOrSign,
  gas?: NumberLike,
  inputs?: Array<InputLike>,
  outputs?: Array<OutputLike>,
  attributes?: Array<AttributeLike>,
  scripts?: Array<WitnessLike>,
|}) => Promise<{| txid: string, result: any |}>;
export type Function = (options: {|
  params?: Array<ParamLike>,
  privateKey: PrivateKeyLikeOrSign,
  transfers?: Array<TransferLike>,
  attributes?: Array<AttributeLike>,
|}) => Promise<{| txid: string, result: any |}>;
export type BasicSmartContract = {|
  constant$: {
    [function: string]: ConstantFunction,
  },
  [function: string]: BasicFunction,
|};
export type SmartContract = {|
  iterActions: (filter?: ActionFilter) => AsyncIterable<Action>,
  iterEvents: (filter?: ActionFilter) => AsyncIterable<Event>,
  iterLogs: (filter?: ActionFilter) => AsyncIterable<string>,
  iterStorage: () => AsyncIterable<StorageItem>,
  constant: {
    [function: string]: ConstantFunction,
  },
  [function: string]: Function,
|};

export interface BasicClientBaseProvider<
  TBlock,
  TTransaction,
  TAccount,
  TInvocationResult: InvocationResult,
> {
  getAccount(address: string): Promise<TAccount>;
  getAsset(hash: UInt256): Promise<Asset>;
  getBlock(hashOrIndex: UInt256 | number): Promise<TBlock>;
  getBestBlockHash(): Promise<string>;
  getBlockCount(): Promise<number>;
  getContract(hash: UInt160): Promise<Contract>;
  getMemPool(): Promise<Array<string>>;
  getTransaction(hash: UInt256): Promise<TTransaction>;
  getStorage(hash: UInt160, key: Buffer): Promise<StorageItem>;
  getUnspentOutput(input: InputModel): Promise<?Output>;
  testInvokeRaw(script: Buffer): Promise<TInvocationResult>;
  sendTransactionRaw(value: Buffer): Promise<void>;
}

export interface BasicClientProvider
  extends BasicClientBaseProvider<
    Block,
    Transaction,
    Account,
    InvocationResult,
  > {}

export interface ClientProvider
  extends BasicClientBaseProvider<
    Block,
    Transaction,
    Account,
    InvocationResult,
  > {
  getOutput(input: InputModel): Promise<Output>;
  getClaimAmount(input: InputModel): Promise<BigNumber>;
  getAllStorage(hash: UInt160): Promise<Array<StorageItem>>;
  getActions(filters: {|
    ...GetActionsFilter,
    scriptHash?: UInt160,
  |}): Promise<Array<Action>>;
  testInvocation(value: Buffer): Promise<InvocationResult>;
}
