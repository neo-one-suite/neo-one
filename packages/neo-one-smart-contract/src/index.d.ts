/// <reference path="./global.d.ts" />

declare const OpaqueTagSymbol: unique symbol;

/**
 * `Buffer` that represents a NEO address.
 *
 * Stored as a script hash (Hash160) internally.
 */
export interface Address extends Buffer {
  readonly [OpaqueTagSymbol]: unique symbol;
}
export interface AddressConstructor {
  /**
   * Creates an `Address` from a literal string. Accepts either a NEO address or a script hash.
   *
   * @example ```
const accountAddress = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
```
   * @example ```
const contractAddress = Address.from('​​​​​0xcef0c0fdcfe7838eff6ff104f9cdec2922297537​​​​​');
```
   * @param value Literal string for an `Address`.
   * @returns `Address` for the specified `value`
   */
  readonly from: (value: string) => Address;
  /**
   * Verifies that the `Transaction` was signed by the `address`.
   *
   * Smart contracts should invoke this function before taking actions on `Address`es, like transferring tokens, that require the permission of the `Address`.
   *
   * @returns true if `Address` approved this `Transaction`
   */
  readonly verifySender: (address: Address) => boolean;
  /**
   * Returns an object representing a contract at `address` with the given type `T`.
   *
   * `T` is checked for validity and `getSmartContract` will report an error during compilation if the interface is invalid.
   *
   * @example ```
interface TransferContract {
  transfer(from: Address, to: Address, value: Fixed<8>): boolean;
}
const contractAddress = Address.from('​​​​​0xcef0c0fdcfe7838eff6ff104f9cdec2922297537​​​​​');
const contract = Address.getSmartContract<TransferContract>(contractAddress);
const from = Address.from('ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s');
const to = Address.from('AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx');
contract.transfer(from, to, 10);
```
   * @param hash `Address` of the smart contract
   * @returns an object representing the underlying smart contract
   */
  readonly getSmartContract: <T>(hash: T extends IsValidSmartContract<T> ? Address : never) => T;
}
export const Address: AddressConstructor;

/**
 * `Buffer` that represents a NEO 256 bit hash.
 *
 * Examples of `Hash256` include `Block` hashes and `Transaction` hashes.
 */
export interface Hash256 extends Buffer {
  readonly [OpaqueTagSymbol]: unique symbol;
}
export interface Hash256Constructor {
  /**
   * Creates a `Hash256` from a literal string.
   *
   * @example ```
const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
```
   * @param value Literal string for a `Hash256`.
   * @returns `Hash256` for the specified `value`
   */
  readonly from: (value: string) => Hash256;
  /**
   * The `Hash256` for the NEO `Asset`.
   */
  readonly NEO: Hash256;
  /**
   * The `Hash256` for the GAS `Asset`.
   */
  readonly GAS: Hash256;
}
export const Hash256: Hash256Constructor;

/**
 * `Buffer` that represents a public key.
 */
export interface PublicKey extends Buffer {
  readonly [OpaqueTagSymbol]: unique symbol;
}
export interface PublicKeyConstructor {
  /**
   * Creates a `PublicKey` from a literal string.
   *
   * @example ```
const publicKey = PublicKey.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef');
```
   * @param value Literal string for a `PublicKey`.
   * @returns `PublicKey` for the specified `value`
   */
  readonly from: (value: string) => PublicKey;
}
export const PublicKey: PublicKeyConstructor;

interface FixedTag<T extends number> {
  readonly __decimals: T;
}
/**
 * Integer which represents a number with the specified decimals.
 */
export type Fixed<Decimals extends number> = number | (number & FixedTag<Decimals>);
/**
 * Integer that represents a number with 0 decimals.
 */
export type Integer = Fixed<0>;
/**
 * Integer that represents a number with 8 decimals.
 */
export type Fixed8 = Fixed<8>;

export enum TransactionType {
  /**
   * The first `Transaction` in each block which contains the `Block` rewards for the consensus node that produced the `Block`.
   *
   * @see {@link MinerTransaction}
   */
  Miner = 0x00,
  /**
   * Issues new currency of a first-class `Asset`.
   *
   * @see {@link IssueTransaction}
   */
  Issue = 0x01,
  /**
   * Claims GAS for a set of spent `Output`s.
   *
   * @see {@link ClaimTransaction}
   */
  Claim = 0x02,
  /**
   * Enrolls a new validator for a given `PublicKey`.
   *
   * @see {@link EnrollmentTransaction}
   * @deprecated
   */
  Enrollment = 0x20,
  /**
   * Registers a new first class `Asset`
   *
   * @see {@link RegisterTransaction}
   * @deprecated Replaced by `registerAsset`
   */
  Register = 0x40,
  /**
   * Transfers first class `Asset`s
   *
   * @see {@link ContractTransaction}
   */
  Contract = 0x80,
  State = 0x90,
  /**
   * Registers a new `Contract`
   *
   * @see {@link PublishTransaction}
   * @deprecated Replaced by `publish`
   */
  Publish = 0xd0,
  /**
   * Runs a script in the NEO VM.
   *
   * @see {@link InvocationTransaction}
   */
  Invocation = 0xd1,
}

/**
 * `Attribute` usage flag indicates the type of the data.
 *
 * @see {@link BufferAttributeUsage}
 * @see {@link PublicKeyAttributeUsage}
 * @see {@link AddressAttributeUsage}
 * @see {@link Hash256AttributeUsage}
 */
export enum AttributeUsage {
  ContractHash = 0x00,
  ECDH02 = 0x02,
  ECDH03 = 0x03,
  Script = 0x20,
  Vote = 0x30,
  DescriptionUrl = 0x81,
  Description = 0x90,
  Hash1 = 0xa1,
  Hash2 = 0xa2,
  Hash3 = 0xa3,
  Hash4 = 0xa4,
  Hash5 = 0xa5,
  Hash6 = 0xa6,
  Hash7 = 0xa7,
  Hash8 = 0xa8,
  Hash9 = 0xa9,
  Hash10 = 0xaa,
  Hash11 = 0xab,
  Hash12 = 0xac,
  Hash13 = 0xad,
  Hash14 = 0xae,
  Hash15 = 0xaf,
  Remark = 0xf0,
  Remark1 = 0xf1,
  Remark2 = 0xf2,
  Remark3 = 0xf3,
  Remark4 = 0xf4,
  Remark5 = 0xf5,
  Remark6 = 0xf6,
  Remark7 = 0xf7,
  Remark8 = 0xf8,
  Remark9 = 0xf9,
  Remark10 = 0xfa,
  Remark11 = 0xfb,
  Remark12 = 0xfc,
  Remark13 = 0xfd,
  Remark14 = 0xfe,
  Remark15 = 0xff,
}

/**
 * `Attribute` usage flag indicating the data is an arbitrary `Buffer`
 *
 * @see {@link BufferAttribute}
 */
export type BufferAttributeUsage =
  | AttributeUsage.DescriptionUrl
  | AttributeUsage.Description
  | AttributeUsage.Remark
  | AttributeUsage.Remark1
  | AttributeUsage.Remark2
  | AttributeUsage.Remark3
  | AttributeUsage.Remark4
  | AttributeUsage.Remark5
  | AttributeUsage.Remark6
  | AttributeUsage.Remark7
  | AttributeUsage.Remark8
  | AttributeUsage.Remark9
  | AttributeUsage.Remark10
  | AttributeUsage.Remark11
  | AttributeUsage.Remark12
  | AttributeUsage.Remark13
  | AttributeUsage.Remark14
  | AttributeUsage.Remark15;
/**
 * `Attribute` usage flag indicating the data is a `PublicKey`
 *
 * @see {@link PublicKeyAttribute}
 */
export type PublicKeyAttributeUsage = AttributeUsage.ECDH02 | AttributeUsage.ECDH03;
/**
 * `Attribute` usage flag indicating the data is an `Address`
 *
 * @see {@link AddressAttribute}
 */
export type AddressAttributeUsage = AttributeUsage.Script;
/**
 * `Attribute` usage flag indicating the data is a `Hash256`
 *
 * @see {@link Hash256Attribute}
 */
export type Hash256AttributeUsage =
  | AttributeUsage.ContractHash
  | AttributeUsage.Vote
  | AttributeUsage.Hash1
  | AttributeUsage.Hash2
  | AttributeUsage.Hash3
  | AttributeUsage.Hash4
  | AttributeUsage.Hash5
  | AttributeUsage.Hash6
  | AttributeUsage.Hash7
  | AttributeUsage.Hash8
  | AttributeUsage.Hash9
  | AttributeUsage.Hash10
  | AttributeUsage.Hash11
  | AttributeUsage.Hash12
  | AttributeUsage.Hash13
  | AttributeUsage.Hash14
  | AttributeUsage.Hash15;

/**
 * Base interface for `Attribute`s
 *
 * @see {@link Attribute}
 */
export interface AttributeBase {
  readonly usage: AttributeUsage;
  readonly data: Buffer;
}
export interface AttributeBaseConstructor {}
export const AttributeBase: AttributeBaseConstructor;

/**
 * `Attribute` whose data is an arbitrary `Buffer`.
 */
export interface BufferAttribute extends AttributeBase {
  readonly usage: BufferAttributeUsage;
  readonly data: Buffer;
}
/**
 * `Attribute` whose data is a `PublicKey`.
 */
export interface PublicKeyAttribute extends AttributeBase {
  readonly usage: PublicKeyAttributeUsage;
  readonly data: PublicKey;
}
/**
 * `Attribute` whose data is an `Address`.
 */
export interface AddressAttribute extends AttributeBase {
  readonly usage: AddressAttributeUsage;
  readonly data: Address;
}
/**
 * `Attribute` whose data is a `Hash256`.
 */
export interface Hash256Attribute extends AttributeBase {
  readonly usage: Hash256AttributeUsage;
  readonly data: Hash256;
}

/**
 * `Attribute`s are used to store additional data on `Transaction`s. Most `Attribute`s are used to store arbitrary data, whereas some, like `AddressAttribute`, have specific uses in the NEO
 * protocol.
 */
export type Attribute = BufferAttribute | PublicKeyAttribute | AddressAttribute | Hash256Attribute;

/**
 * `Output`s represent the destination `Address` and amount transferred of a given `Asset`.
 *
 * The sum of the unspent `Output`s of an `Address` represent the total balance of the `Address`.
 */
export interface Output {
  /**
   * The destination `Address`.
   */
  readonly address: Address;
  /**
   * The hash of the `Asset` that was transferred.
   */
  readonly asset: Hash256;
  /**
   * The amount transferred.
   */
  readonly value: Fixed8;
}
export interface OutputConstructor {}
export const Output: OutputConstructor;

/**
 * `Input`s are a reference to an `Output` of a `Transaction` that has been persisted to the blockchain. The sum of the `value`s of the referenced `Output`s is the total amount transferred in the `Transaction`.
 */
export interface Input {
  /**
   * The hash of the `Transaction` this input references.
   */
  readonly hash: Hash256;
  /**
   * The `Output` index within the `Transaction` this input references.
   */
  readonly index: Integer;
}
export interface InputConstructor {}
export const Input: InputConstructor;

/**
 * The base interface for all `Transaction`s
 */
export interface TransactionBase {
  /**
   * The `Hash256` of this `Transaction`.
   */
  readonly hash: Hash256;
  /**
   * The type of the `Transaction`
   * @see {@link TransactionType}
   */
  readonly type: TransactionType;
  /**
   * `Attribute`s attached to the `Transaction`.
   *
   * @see {@link Attribute}
   */
  readonly attributes: Attribute[];
  /**
   * `Output`s of the `Transaction`.
   *
   * @see {@link Output}
   */
  readonly outputs: Output[];
  /**
   * `Input`s of the `Transaction`.
   *
   * @see {@link Input}
   */
  readonly inputs: Input[];
  /**
   * The corresponding `Output`s for the Inputs of the `Transaction`.
   *
   * @see {@link Output}
   */
  readonly references: Output[];
  /**
   * `Output`s which have not been spent.
   *
   * @see {@link Output}
   */
  readonly unspentOutputs: Output[];
}
export interface TransactionBaseConstructor {}
export const TransactionBase: TransactionBaseConstructor;
/**
 * The first `Transaction` in each block which contains the Block rewards for the consensus node that produced the block.
 */
export interface MinerTransaction extends TransactionBase {
  readonly type: TransactionType.Miner;
}
/**
 * Issues new currency of a first-class `Asset`.
 */
export interface IssueTransaction extends TransactionBase {
  readonly type: TransactionType.Issue;
}
/**
 * Claims GAS for a set of spent `Output`s.
 */
export interface ClaimTransaction extends TransactionBase {
  readonly type: TransactionType.Claim;
}
/**
 * Enrolls a new validator for a given `PublicKey`.
 *
 * @deprecated
 */
export interface EnrollmentTransaction extends TransactionBase {
  readonly type: TransactionType.Enrollment;
}
/**
 * Registers a new first class `Asset`
 *
 * @deprecated Replaced by `registerAsset`
 */
export interface RegisterTransaction extends TransactionBase {
  readonly type: TransactionType.Register;
}
/**
 * `Transaction` that transfers first class `Asset`s
 */
export interface ContractTransaction extends TransactionBase {
  readonly type: TransactionType.Contract;
}
export interface StateTransaction extends TransactionBase {
  readonly type: TransactionType.State;
}
/**
 * Registers a new `Contract`
 *
 * @deprecated Replaced by `publish`
 */
export interface PublishTransaction extends TransactionBase {
  readonly type: TransactionType.Publish;
}
/**
 * `Transaction` which runs a script in the NEO VM.
 */
export interface InvocationTransaction extends TransactionBase {
  readonly type: TransactionType.Invocation;
  /**
   * The code that was executed in NEO VM.
   */
  readonly script: Buffer;
}
/**
 * `Transaction`s are persisted to the blockchain and represent various functionality like transferring first class assets or executing smart contracts.
 *
 * Smart contracts are executed within an `InvocationTransaction`.
 *
 * @example ```
const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
const transaction = Transaction.for(transactionHash);
const transactionOutputs = transaction.outputs;
```
 */
export type Transaction =
  | MinerTransaction
  | IssueTransaction
  | ClaimTransaction
  | EnrollmentTransaction
  | RegisterTransaction
  | ContractTransaction
  | StateTransaction
  | PublishTransaction
  | InvocationTransaction;
export interface TransactionConstructor {
  /**
   * @returns `Transaction` for the specified `hash`.
   */
  readonly for: (hash: Hash256) => Transaction;
}
export const Transaction: TransactionConstructor;

/**
 * Balance and vote information for an `Address`.
 *
 * @example ```
const address = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
const account = Account.for(address);
const neoBalance = account.getBalance(Hash256.NEO);
```
 */
export interface Account {
  /**
   * The `Address` of this `Account`.
   */
  readonly hash: Address;
  /**
   * Retrieve the balance for a first class `Asset`.
   */
  readonly getBalance: (asset: Hash256) => Fixed8;
}
export interface AccountConstructor {
  /**
   * @returns `Account` for the specified `address`.
   */
  readonly for: (address: Address) => Account;
}
export const Account: AccountConstructor;

export enum AssetType {
  Credit = 0x40,
  Duty = 0x80,
  /**
   * Reserved for the NEO `Asset`.
   */
  Governing = 0x00,
  /**
   * Reserved for the GAS `Asset`.
   */
  Utility = 0x01,
  Currency = 0x08,
  Share = 0x90,
  Invoice = 0x98,
  Token = 0x60,
}

/**
 * Attributes of a first class asset.
 *
 * Smart contract authors will typically only interact with the NEO and GAS `Asset`s.
 *
 * @example ```
const asset = Asset.for(Hash256.NEO);
const neoAmount = asset.amount;
```
 */
export interface Asset {
  /**
   * The `Hash256` of this `Asset`.
   */
  readonly hash: Hash256;
  /**
   * The type of the `Asset`
   * @see {@link AssetType}
   */
  readonly type: AssetType;
  /**
   * The total possible supply of the `Asset`
   */
  readonly amount: Fixed8;
  /**
   * The amount currently available of the `Asset`
   */
  readonly available: Fixed8;
  /**
   * The precision (number of decimal places) of the `Asset`
   */
  readonly precision: Integer;
  /**
   * The owner of the `Asset`.
   */
  readonly owner: PublicKey;
  /**
   * The admin of the `Asset`.
   */
  readonly admin: Address;
  /**
   * The issuer of the `Asset`.
   */
  readonly issuer: Address;
}
export interface AssetConstructor {
  /**
   * @returns `Asset` for the specified `hash`.
   */
  readonly for: (hash: Hash256) => Asset;
}
export const Asset: AssetConstructor;

/**
 * Attributes of a smart contract deployed to the blockchain.
 *
 * @example ```
const contractAddress = Address.from('​​​​​0xcef0c0fdcfe7838eff6ff104f9cdec2922297537​​​​​');
const contract = Contract.for(contractAddress);
const contractScript = contract.script;
```
 */
export interface Contract {
  /**
   * `Contract` code.
   */
  readonly script: Buffer;
  /**
   * Flag that indicates if the `Contract` supports receiving `Asset`s and NEP-5 tokens.
   */
  readonly payable: boolean;
}
export interface ContractConstructor {
  /**
   * Returns undefined if a `Contract` does not exist at `address`.
   *
   * @returns `Contract` for the specified `address.
   */
  readonly for: (address: Address) => Contract | undefined;
}
export const Contract: ContractConstructor;

/**
 * Attributes of a `Block` persisted to the blockchain. `Header` includes all information except the `Transaction`s.
 *
 * @example ```
const blockHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
const header = Header.for(blockHash);
```
 */
export interface Header {
  /**
   * `Block` hash
   */
  readonly hash: Hash256;
  /**
   * NEO blockchain version
   */
  readonly version: Integer;
  /**
   * Previous `Block` hash.
   */
  readonly previousHash: Hash256;
  /**
   * `Block` index
   */
  readonly index: Integer;
  readonly merkleRoot: Hash256;
  /**
   * `Block` time persisted
   */
  readonly time: Integer;
  /**
   * Next consensus address.
   */
  readonly nextConsensus: Address;
}
export interface HeaderConstructor {
  /**
   * Accepts either the `Hash256` or the index of the `Block`;
   *
   * @returns `Header` for the specified `hashOrIndex`.
   */
  readonly for: (hashOrIndex: Hash256 | Integer) => Header;
}
export const Header: HeaderConstructor;
/**
 * Attributes of a `Block` persisted to the blockchain.
 *
 * @example ```
const genesisBlock = Block.for(0);
```
 */
export interface Block extends Header {
  readonly transactions: Transaction[];
}
export interface BlockConstructor {
  /**
   * Accepts either the `Hash256` or the index of the `Block`;
   *
   * @returns `Header` for the specified `hashOrIndex`.
   */
  readonly for: (hashOrIndex: Hash256 | Integer) => Block;
}
export const Block: BlockConstructor;

export type SerializableKey =
  | undefined
  | number
  | string
  | boolean
  | Buffer
  | Array<undefined | number | string | boolean | Buffer>;
interface SerializableValueArray extends Array<SerializableValue> {}
export type SerializableValue = undefined | number | string | boolean | Buffer | SerializableValueArray;

/**
 * Persistent smart contract storage. When used as a `SmartContract` property the prefix is automatically set to the property name.
 *
 * @example ```
class Token implements SmartContract {
  private readonly balances = new MapStorage<Address, Fixed<8>>();

  // Note this is not how one should implement token transfer and is meant for illustration purposes only.
  public transfer(from: Address, to: Address, amount: Fixed<8>): boolean {
    const fromBalance = this.balances.get(from);
    const toBalance = this.balances.get(to);
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, toBalance + amount);
    return true;
  }
}
```
 */
export interface MapStorage<K extends SerializableKey, V extends SerializableValue> {
  /**
   * Retrieve `key` from storage.
   *
   * @returns `V` or undefined if the key does not exist.
   */
  readonly get: (key: K) => V | undefined;
  /**
   * Set `key` to `value` in storage.
   */
  readonly set: (key: K, v: V) => void;
  /**
   * Delete `key` from storage.
   */
  readonly delete: (key: K) => void;
}
export interface MapStorageConstructor {
  /**
   * Constructs a new `MapStorage` instance. When used as a `SmartContract` property the `prefix` is automatically set to the property name. Otherwise, `prefix` is mandatory and should be unique within a smart contract.
   */
  new <K extends SerializableKey, V extends SerializableValue>(prefix?: Buffer): MapStorage<K, V>;
}
export const MapStorage: MapStorageConstructor;

/**
 * Persistent smart contract set storage. When used as a `SmartContract` property the prefix is automatically set to the property name.
 *
 * @example ```
class ICO implements SmartContract {
  private readonly whitelistedAddresses = new SetStorage<Address>();

  // Note this is not how one should implement token transfer and is meant for illustration purposes only.
  public isWhitelisted(adress: Address): boolean {
    return this.whitelistedAddresses.has(address);
  }
}
```
 */
export interface SetStorage<V extends SerializableKey> {
  /**
   * @returns true if `value` exists in storage.
   */
  readonly has: (value: V) => boolean;
  /**
   * Add `value` to storage.
   */
  readonly add: (value: V) => void;
  /**
   * Delete `value` from storage.
   */
  readonly delete: (value: V) => void;
}
export interface SetStorageConstructor {
  /**
   * Constructs a new `SetStorage` instance. When used as a `SmartContract` property the `prefix` is automatically set to the property name. Otherwise, `prefix` is mandatory and should be unique within a smart contract.
   */
  new <K extends SerializableKey>(prefix?: Buffer): SetStorage<K>;
}
export const SetStorage: SetStorageConstructor;

export interface BlockchainConstructor {
  /**
   * The time of the current `Block`.
   *
   * During execution, this is the timestamp of the `Block` that this `Transaction` will be included in.
   * During verification, this is the timestamp of the latest `Block` + 15 seconds which represents the earliest possible timestamp of the `Block` that this `Transaction` will be included in.
   */
  readonly currentBlockTime: number;
  /**
   * The index of the latest `Block` persisted to the blockchain.
   */
  readonly currentHeight: number;
  /**
   * `InvocationTransaction` this smart contract is executed in.
   */
  readonly currentTransaction: InvocationTransaction;
}
/**
 * Information about the current state of the blockchain and the current execution.
 */
export const Blockchain: BlockchainConstructor;

export interface SmartContractValueArray extends Array<SmartContractValue> {}
type SmartContractValue =
  | void
  | undefined
  | number
  | Fixed<any>
  | string
  | boolean
  | Buffer
  | Address
  | Hash256
  | PublicKey
  | SmartContractValueArray;
type Parameters<T extends Function> = T extends (...args: infer U) => any ? U : never;
type ReturnType<T extends Function> = T extends (...args: any[]) => infer R ? R : never;
type IsValidSmartContract<T> = {
  [K in keyof T]: T[K] extends Function
    ? Parameters<T[K]> extends SmartContractValue[]
      ? ReturnType<T[K]> extends SmartContractValue ? T[K] : never
      : never
    : never
};

export function createEventNotifier(name: string): () => void;
export function createEventNotifier<A0>(name: string, arg0Name: string): (arg0: A0) => void;
export function createEventNotifier<A0, A1>(
  name: string,
  arg0Name: string,
  arg1Name: string,
): (arg0: A0, arg1: A1) => void;
export function createEventNotifier<A0, A1, A2>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
): (arg0: A0, arg1: A1, arg2: A2) => void;
export function createEventNotifier<A0, A1, A2, A3>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
): (arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void;
export function createEventNotifier<A0, A1, A2, A3, A4>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
): (arg0: A0, arg1: A1, arg2: A2, arg3: A3, arg4: A4) => void;
/**
 * Creates an event notifier for `SmartContract` notifications.
 *
 * Must be explicitly typed and contain string literals for the event name and argument names.
 *
 * @example ```
const notifyTransfer = createEventNotifier<Address, Address, Fixed<8>>('transfer', 'from', 'to', 'amount');

const from = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
const to = Address.from('AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx');
notifyTransfer(from, to, 200);
```
 *
 * @param name Event name
 * @param argName Event argument name
 */
export function createEventNotifier<A0, A1, A2, A3, A4, A5>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
  arg5Name: string,
): (arg0: A0, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => void;

/**
 * An object with string literals for the contract properties to be used in deployment.
 */
export interface ContractProperties {
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly payable: boolean;
}
/**
 * Marks a class as a `SmartContract`.
 */
export interface SmartContract {
  /**
   * The owner of the `SmartContract`
   */
  owner: Address;
  /**
   * The properties used for deployment of the `SmartContract`
   */
  readonly properties: ContractProperties;
}

/**
 * Marks a `SmartContract` method to be verified before execution.
 */
export function verify(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
/**
 * Marks a `SmartContract` method as constant.
 */
export function constant(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
