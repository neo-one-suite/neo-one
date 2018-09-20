// tslint:disable
/// <reference path="./global.d.ts" />

/**
 * Marks an interface or class as not implementable or extendable.
 *
 * Makes it an error to pass values that would otherwise match the shape of the interface.
 *
 * See <fill_me_in> for more info.
 */
declare const OpaqueTagSymbol0: unique symbol;

/**
 * `Buffer` that represents a NEO address.
 *
 * Stored as a script hash (Hash160) internally.
 */
export interface Address extends Buffer {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface AddressConstructor {
  /**
   * Creates an `Address` from a literal string. Accepts either a NEO address or a script hash.
   *
   * @example
   *
   * const accountAddress = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
   *
   * @example
   *
   * const contractAddress = Address.from('​​​​​0xcef0c0fdcfe7838eff6ff104f9cdec2922297537​​​​​');
   *
   * @param value Literal string for an `Address`.
   * @returns `Address` for the specified `value`
   */
  readonly from: (value: string) => Address;
  /**
   * Verifies that the invocation was directly called AND approved by `Address`.
   *
   * Smart contracts should invoke this function before taking transferring items for `Address`es, like transferring tokens, that require the permission of the `Address`.
   *
   * @example
   *
   * if (!Address.isCaller(address)) {
   *   return false;
   * }
   *
   * @returns true if `Address` approves this invocation.
   */
  readonly isCaller: (address: Address) => boolean;
  /**
   * Verifies that the `Transaction` was signed by the `address`.
   *
   * In most cases, smart contracts should instead use `Address.isCaller`.
   *
   * @example
   *
   * if (!Address.isSender(address)) {
   *   return false;
   * }
   *
   * @returns true if `Address` signed this `Transaction`
   */
  readonly isSender: (address: Address) => boolean;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Address: AddressConstructor;

/**
 * `Buffer` that represents a NEO 256 bit hash.
 *
 * Examples of `Hash256` include `Block` hashes and `Transaction` hashes.
 */
export interface Hash256 extends Buffer {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface Hash256Constructor {
  /**
   * Creates a `Hash256` from a literal string.
   *
   * @example
   *
   * const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
   *
   * @param value Literal string for a `Hash256`.
   * @returns `Hash256` for the specified `value`
   */
  readonly from: (value: string) => Hash256;
  /**
   * `Hash256` of the NEO `Asset`.
   */
  readonly NEO: Hash256;
  /**
   * `Hash256` of the GAS `Asset`.
   */
  readonly GAS: Hash256;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Hash256: Hash256Constructor;

/**
 * `Buffer` that represents a public key.
 */
export interface PublicKey extends Buffer {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface PublicKeyConstructor {
  /**
   * Creates a `PublicKey` from a literal string.
   *
   * @example
   *
   * const publicKey = PublicKey.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef');
   *
   * @param value Literal string for a `PublicKey`.
   * @returns `PublicKey` for the specified `value`
   */
  readonly from: (value: string) => PublicKey;
  readonly [OpaqueTagSymbol0]: unique symbol;
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
   * First `Transaction` in each block which contains the `Block` rewards for the consensus node that produced the `Block`.
   *
   * @see MinerTransaction
   */
  Miner = 0x00,
  /**
   * Issues new currency of a first-class `Asset`.
   *
   * @see IssueTransaction
   */
  Issue = 0x01,
  /**
   * Claims GAS for a set of spent `Output`s.
   *
   * @see ClaimTransaction
   */
  Claim = 0x02,
  /**
   * Enrolls a new validator for a given `PublicKey`.
   *
   * @see EnrollmentTransaction
   * @deprecated
   */
  Enrollment = 0x20,
  /**
   * Registers a new first class `Asset`
   *
   * @see RegisterTransaction
   * @deprecated Replaced by `Client#registerAsset`
   */
  Register = 0x40,
  /**
   * Transfers first class `Asset`s
   *
   * @see ContractTransaction
   */
  Contract = 0x80,
  State = 0x90,
  /**
   * Registers a new `Contract`
   *
   * @see PublishTransaction
   * @deprecated Replaced by `Client#publish`
   */
  Publish = 0xd0,
  /**
   * Runs a script in the NEO VM.
   *
   * @see InvocationTransaction
   */
  Invocation = 0xd1,
}

/**
 * `Attribute` usage flag indicates the type of the data.
 *
 * @see BufferAttributeUsage
 * @see PublicKeyAttributeUsage
 * @see AddressAttributeUsage
 * @see Hash256AttributeUsage
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
 * @see BufferAttribute
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
 * @see PublicKeyAttribute
 */
export type PublicKeyAttributeUsage = AttributeUsage.ECDH02 | AttributeUsage.ECDH03;
/**
 * `Attribute` usage flag indicating the data is an `Address`
 *
 * @see AddressAttribute
 */
export type AddressAttributeUsage = AttributeUsage.Script;
/**
 * `Attribute` usage flag indicating the data is a `Hash256`
 *
 * @see Hash256Attribute
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
 * @see Attribute
 */
export interface AttributeBase {
  readonly usage: AttributeUsage;
  readonly data: Buffer;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface AttributeBaseConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
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
   * Destination `Address`.
   */
  readonly address: Address;
  /**
   * Hash of the `Asset` that was transferred.
   */
  readonly asset: Hash256;
  /**
   * Amount transferred.
   */
  readonly value: Fixed8;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface OutputConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Output: OutputConstructor;

/**
 * `Input`s are a reference to an `Output` of a `Transaction` that has been persisted to the blockchain. The sum of the `value`s of the referenced `Output`s is the total amount transferred in the `Transaction`.
 */
export interface Input {
  /**
   * Hash of the `Transaction` this input references.
   */
  readonly hash: Hash256;
  /**
   * `Output` index within the `Transaction` this input references.
   */
  readonly index: Integer;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface InputConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Input: InputConstructor;

/**
 * Base interface for all `Transaction`s
 */
export interface TransactionBase {
  /**
   * `Hash256` of this `Transaction`.
   */
  readonly hash: Hash256;
  /**
   * Type of the `Transaction`
   * @see TransactionType
   */
  readonly type: TransactionType;
  /**
   * `Attribute`s attached to the `Transaction`.
   *
   * @see Attribute
   */
  readonly attributes: Attribute[];
  /**
   * `Output`s of the `Transaction`.
   *
   * @see Output
   */
  readonly outputs: Output[];
  /**
   * `Input`s of the `Transaction`.
   *
   * @see Input
   */
  readonly inputs: Input[];
  /**
   * Corresponding `Output`s for the Inputs of the `Transaction`.
   *
   * @see Output
   */
  readonly references: Output[];
  /**
   * `Output`s which have not been spent.
   *
   * @see Output
   */
  readonly unspentOutputs: Output[];
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface TransactionBaseConstructor {}
export const TransactionBase: TransactionBaseConstructor;
/**
 * First `Transaction` in each block which contains the Block rewards for the consensus node that produced the block.
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
 * @deprecated Replaced by `Client#registerAsset`
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
 * @deprecated Replaced by `Client#publish`
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
   * Code that was executed in NEO VM.
   */
  readonly script: Buffer;
}
/**
 * `Transaction`s are persisted to the blockchain and represent various functionality like transferring first class assets or executing smart contracts.
 *
 * Smart contracts are executed within an `InvocationTransaction`.
 *
 * @example
 *
 * const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
 * const transaction = Transaction.for(transactionHash);
 * const transactionOutputs = transaction.outputs;
 *
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
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Transaction: TransactionConstructor;

/**
 * Balance and vote information for an `Address`.
 *
 * @example
 *
 * const address = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
 * const account = Account.for(address);
 * const neoBalance = account.getBalance(Hash256.NEO);
 *
 */
export interface Account {
  /**
   * `Address` of this `Account`.
   */
  readonly address: Address;
  /**
   * Retrieve the balance for a first class `Asset`.
   */
  readonly getBalance: (asset: Hash256) => Fixed8;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface AccountConstructor {
  /**
   * @returns `Account` for the specified `address`.
   */
  readonly for: (address: Address) => Account;
  readonly [OpaqueTagSymbol0]: unique symbol;
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
 * @example
 *
 * const asset = Asset.for(Hash256.NEO);
 * const neoAmount = asset.amount;
 *
 */
export interface Asset {
  /**
   * `Hash256` of this `Asset`.
   */
  readonly hash: Hash256;
  /**
   * Type of the `Asset`
   * @see AssetType
   */
  readonly type: AssetType;
  /**
   * Total possible supply of the `Asset`
   */
  readonly amount: Fixed8;
  /**
   * Amount currently available of the `Asset`
   */
  readonly available: Fixed8;
  /**
   * Precision (number of decimal places) of the `Asset`
   */
  readonly precision: Integer;
  /**
   * Owner of the `Asset`.
   */
  readonly owner: PublicKey;
  /**
   * Admin of the `Asset`.
   */
  readonly admin: Address;
  /**
   * Issuer of the `Asset`.
   */
  readonly issuer: Address;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface AssetConstructor {
  /**
   * @returns `Asset` for the specified `hash`.
   */
  readonly for: (hash: Hash256) => Asset;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Asset: AssetConstructor;

/**
 * Attributes of a smart contract deployed to the blockchain.
 *
 * @example
 *
 * const contractAddress = Address.from('​​​​​0xcef0c0fdcfe7838eff6ff104f9cdec2922297537​​​​​');
 * const contract = Contract.for(contractAddress);
 * const contractScript = contract.script;
 *
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
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractConstructor {
  /**
   * Returns undefined if a `Contract` does not exist at `address`.
   *
   * @returns `Contract` for the specified `address.
   */
  readonly for: (address: Address) => Contract | undefined;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Contract: ContractConstructor;

/**
 * Attributes of a `Block` persisted to the blockchain. `Header` includes all information except the `Transaction`s.
 *
 * @example
 *
 * const blockHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
 * const header = Header.for(blockHash);
 *
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
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface HeaderConstructor {
  /**
   * Accepts either the `Hash256` or the index of the `Block`.
   *
   * @returns `Header` for the specified `hashOrIndex`.
   */
  readonly for: (hashOrIndex: Hash256 | Integer) => Header;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Header: HeaderConstructor;
/**
 * Attributes of a `Block` persisted to the blockchain.
 *
 * @example
 *
 * const genesisBlock = Block.for(0);
 *
 */
export interface Block extends Header {
  /**
   * `Transaction`s contained in the `Block`.
   */
  readonly transactions: Transaction[];
}
export interface BlockConstructor {
  /**
   * Accepts either the `Hash256` or the index of the `Block`;
   *
   * @returns `Header` for the specified `hashOrIndex`.
   */
  readonly for: (hashOrIndex: Hash256 | Integer) => Block;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const Block: BlockConstructor;

export type SerializableKeySingle = number | string | boolean | Buffer;
type SK = SerializableKeySingle;
export type SerializableKey = SK | [SK, SK] | [SK, SK, SK] | [SK, SK, SK, SK];
export interface SerializableValueArray extends ReadonlyArray<SerializableValue> {}
export interface SerializableValueMap extends ReadonlyMap<SerializableKeySingle, SerializableValue> {}
export interface SerializableValueSet extends ReadonlySet<SerializableValue> {}
export interface SerializableValueObject {
  readonly [key: string]: SerializableValue;
}
export type SerializableValue =
  | undefined
  | null
  | number
  | string
  | boolean
  | Buffer
  | SerializableValueArray
  | SerializableValueMap
  | SerializableValueSet
  | SerializableValueObject;

/**
 * Persistent smart contract set storage. Only usable as a `SmartContract` property.
 *
 * @example
 *
 * class MySmartContract extends SmartContract {
 *  private readonly pendingAddresses =
 *    ArrayStorage.for<Address>();
 *
 *  public addPendingAddress(address: Address): void {
 *    this.pendingAddresses.push(address);
 *  }
 * }
 *
 */
export interface ArrayStorage<T extends SerializableValue> extends Iterable<T> {
  readonly [Symbol.iterator]: () => IterableIterator<T>;
  /**
   * Gets the length of the array. This is a number one higher than the highest element defined in an array.
   */
  readonly length: number;
  /**
   * Executes a provided function once per each value in storage.
   * @param callback function to execute for each element.
   * @returns `undefined`
   */
  readonly forEach: (callback: (value: T, idx: number) => void) => void;
  /**
   * Appends new elements to storage, and returns the new length of the array.
   * @param items New elements to add.
   */
  readonly push: (...items: T[]) => number;
  /**
   * Removes the last element from an array and returns it.
   */
  readonly pop: () => T | undefined;
  [n: number]: T;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ArrayStorageConstructor {
  /**
   * Constructs a new `ArrayStorage` instance. Only usable as a `SmartContract` property.
   */
  for<T extends SerializableValue>(): ArrayStorage<T>;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const ArrayStorage: ArrayStorageConstructor;

type SKMapAtTwo<K extends [SK, SK], V extends SerializableValue> = {
  (prefix: K[0]): MapStorage<K[1], V>;
};
type SKMapAtThree<K extends [SK, SK, SK], V extends SerializableValue> = {
  (prefix: K[0]): MapStorage<[K[1], K[2]], V>;
  (prefix: [K[0], K[1]]): MapStorage<K[2], V>;
};
type SKMapAtFour<K extends [SK, SK, SK, SK], V extends SerializableValue> = {
  (prefix: K[0]): MapStorage<[K[1], K[2], K[3]], V>;
  (prefix: [K[0], K[1]]): MapStorage<[K[2], K[3]], V>;
  (prefix: [K[0], K[1], K[2]]): MapStorage<K[3], V>;
};

/**
 * Persistent smart contract storage. Only usable as a `SmartContract` property.
 *
 * @example
 *
 * class Token extends SmartContract {
 *  private readonly balances =
 *    MapStorage.for<Address, Fixed<8>>();
 *
 *  public transfer(
 *    from: Address,
 *    to: Address,
 *    amount: Fixed<8>,
 *  ): boolean {
 *    const fromBalance = this.balances.get(from);
 *    const toBalance = this.balances.get(to);
 *    this.balances.set(from, fromBalance - amount);
 *    this.balances.set(to, toBalance + amount);
 *    return true;
 *  }
 * }
 *
 */
export interface MapStorage<K extends SerializableKey, V extends SerializableValue> extends Iterable<[K, V]> {
  readonly [Symbol.iterator]: () => IterableIterator<[K, V]>;
  /**
   * Executes a provided function once per each key/value pair in storage.
   * @param callback function to execute for each element.
   * @returns `undefined`
   */
  readonly forEach: (callback: (value: V, key: K) => void) => void;
  /**
   * Returns a specified element from storage.
   * @param key the key of the element to return from storage.
   * @returns the element associated with the specified key or undefined if the key can't be found in storage.
   */
  readonly get: (key: K) => V | undefined;
  /**
   * Returns a boolean indicating whether an element with the specified key exists or not.
   * @param key the key of the element to test for presence in storage.
   * @returns `true` if an element with the specified key exists in storage; otherwise `false`.
   */
  readonly has: (key: K) => boolean;
  /**
   * Removes the specified element from storage.
   * @returns `true` if an element in storage existed and has been removed, or `false` if the element does not exist.
   */
  readonly delete: (key: K) => boolean;
  /**
   * Adds or updates an element with a specified key and value in storage.
   * @param key The key of the element to add to storage.
   * @param value The value of the element to add to storage.
   * @returns the `MapStorage` object.
   */
  readonly set: (key: K, value: V) => MapStorage<K, V>;
  /**
   * Returns the elements from storage with the specified prefix.
   * @param key The prefix key of desired elements from storage.
   * @returns a `MapStorage` object representing the elements associated with the specified prefix.
   */
  readonly at: K extends [SK, SK]
    ? SKMapAtTwo<K, V>
    : K extends [SK, SK, SK] ? SKMapAtThree<K, V> : K extends [SK, SK, SK, SK] ? SKMapAtFour<K, V> : never;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface MapStorageConstructor {
  /**
   * Constructs a new `MapStorage` instance. Only usable as a `SmartContract` property.
   */
  for<K extends SerializableKey, V extends SerializableValue>(): MapStorage<K, V>;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const MapStorage: MapStorageConstructor;

type SKSetAtTwo<V extends [SK, SK]> = {
  (prefix: V[0]): SetStorage<V[1]>;
};
type SKSetAtThree<V extends [SK, SK, SK]> = {
  (prefix: V[0]): SetStorage<[V[1], V[2]]>;
  (prefix: [V[0], V[1]]): SetStorage<V[2]>;
};
type SKSetAtFour<V extends [SK, SK, SK, SK]> = {
  (prefix: V[0]): SetStorage<[V[1], V[2], V[3]]>;
  (prefix: [V[0], V[1]]): SetStorage<[V[2], V[3]]>;
  (prefix: [V[0], V[1], V[2]]): SetStorage<V[3]>;
};

/**
 * Persistent smart contract set storage. Only usable as a `SmartContract` property.
 *
 * @example
 *
 * class ICO extends SmartContract {
 *  private readonly whitelistedAddresses =
 *    SetStorage.for<Address>();
 *
 *  public isWhitelisted(address: Address): boolean {
 *    return this.whitelistedAddresses.has(address);
 *  }
 * }
 *
 */
export interface SetStorage<V extends SerializableKey> extends Iterable<V> {
  readonly [Symbol.iterator]: () => IterableIterator<V>;
  /**
   * Executes a provided function once per each value in storage.
   * @param callback function to execute for each element.
   * @returns `undefined`
   */
  readonly forEach: (callback: (value: V) => void) => void;
  /**
   * Returns a boolean indicating whether an element with the specified value exists or not.
   * @param value the value to test for presence in storage.
   * @returns `true` if an element with the specified value exists in storage; otherwise `false`.
   */
  readonly has: (value: V) => boolean;
  /**
   * Removes the specified element from storage.
   * @returns `true` if an element in storage existed and has been removed, or `false` if the element does not exist.
   */
  readonly delete: (value: V) => boolean;
  /**
   * Adds an element with the specified value in storage.
   * @param value The value of the element to add to storage.
   * @returns the `SetStorage` object.
   */
  readonly add: (value: V) => SetStorage<V>;
  /**
   * Returns the elements from storage with the specified prefix.
   * @param key The prefix key of desired elements from storage.
   * @returns a `SetStorage` object representing the elements associated with the specified prefix.
   */
  readonly at: V extends [SK, SK]
    ? SKSetAtTwo<V>
    : V extends [SK, SK, SK] ? SKSetAtThree<V> : V extends [SK, SK, SK, SK] ? SKSetAtFour<V> : never;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface SetStorageConstructor {
  /**
   * Constructs a new `SetStorage` instance. Only usable as a `SmartContract` property.
   */
  for<K extends SerializableKey>(): SetStorage<K>;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const SetStorage: SetStorageConstructor;

export interface BlockchainConstructor {
  /**
   * Time of the current `Block`.
   *
   * During execution, this is the timestamp of the `Block` that this `Transaction` will be included in.
   * During verification, this is the timestamp of the latest `Block` + 15 seconds which represents the earliest possible timestamp of the `Block` that this `Transaction` will be included in.
   */
  readonly currentBlockTime: number;
  /**
   * Index of the latest `Block` persisted to the blockchain.
   */
  readonly currentHeight: number;
  /**
   * `InvocationTransaction` this smart contract is executed in.
   */
  readonly currentTransaction: InvocationTransaction;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
/**
 * Information about the current state of the blockchain and the current execution.
 */
export const Blockchain: BlockchainConstructor;

export interface DeployConstructor {
  /**
   * Use the sender `Address` for the constructor parameter.
   *
   * @example
   * import { Address, Deploy, SmartContract } from '@neo-one/smart-contract';
   *
   * class Token extends SmartContract {
   *  public constructor(public readonly owner: Address = Deploy.senderAddress) {
   *    super();
   *  }
   * }
   */
  readonly senderAddress: Address;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
/**
 * Injects values at deployment time. Can only be used for default constructor parameters.
 */
export const Deploy: DeployConstructor;

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
 * @example
 *
 * const notifyTransfer = createEventNotifier<Address, Address, Fixed<8>>('transfer', 'from', 'to', 'amount');
 *
 * const from = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
 * const to = Address.from('AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx');
 * notifyTransfer(from, to, 200);
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
 * Object with string literals for the contract properties to be used in deployment.
 */
export interface ContractProperties {
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
}

export interface ForwardValue {
  readonly asString: () => string;
  readonly asStringNullable: () => string | undefined;
  readonly asNumber: () => number;
  readonly asNumberNullable: () => number | undefined;
  readonly asBoolean: () => boolean;
  readonly asBuffer: () => Buffer;
  readonly asBufferNullable: () => Buffer | undefined;
  readonly asAddress: () => Address;
  readonly asAddressNullable: () => Address | undefined;
  readonly asHash256: () => Hash256;
  readonly asHash256Nullable: () => Hash256 | undefined;
  readonly asPublicKey: () => PublicKey;
  readonly asPublicKeyNullable: () => PublicKey | undefined;
  readonly asArray: () => Array<ForwardValue>;
  readonly asArrayNullable: () => Array<ForwardValue> | undefined;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ForwardValueConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const ForwardValue: ForwardValueConstructor;

interface ForwardedValueTag<T extends SmartContractValue> {}
/**
 * Marks a parameter or return type of a public `SmartContract` method as expecting a forwarded value.
 */
export type ForwardedValue<T extends SmartContractValue> = T | (T & ForwardedValueTag<T>);

interface SmartContractValueArray extends Array<SmartContractValue> {}
interface SmartContractValueReadonlyArray extends ReadonlyArray<SmartContractValue> {}
type SmartContractValue =
  | void
  | null
  | undefined
  | number
  | Fixed<any>
  | string
  | boolean
  | Buffer
  | Address
  | Hash256
  | PublicKey
  | SmartContractValueArray
  | SmartContractValueReadonlyArray;
type SmartContractArg = SmartContractValue | ForwardValue;
type IsValidSmartContract<T> = {
  [K in keyof T]: T[K] extends Function
    ? Parameters<T[K]> extends SmartContractArg[] ? (ReturnType<T[K]> extends SmartContractArg ? T[K] : never) : never
    : T[K] extends SmartContractValue ? T[K] : never
};

/**
 * Marks a class as a `SmartContract`.
 */
export class SmartContract {
  /**
   * Properties used for deployment of the `SmartContract`
   */
  public readonly properties: ContractProperties;
  /**
   * `Address` of the `SmartContract`.
   */
  public readonly address: Address;
  /**
   * Stores `Transaction` hashes that have been processed by a method marked with `@receive` or `@send`.
   *
   * Used to enforce that a `Transaction` with native `Asset`s is only ever processed once by an appropriate `@receive` or `@send` method.
   */
  protected readonly processedTransactions: SetStorage<Hash256>;
  /**
   * Stores `Transaction` hashes that can be refunded.
   */
  protected readonly allowedRefunds: SetStorage<Hash256>;
  /**
   * Property primarily used internally to validate that the smart contract is deployed only once.
   */
  protected readonly deployed: true;
  /**
   * Override to validate a contract upgrade invocation. Returns `false` by default. Return `true` to indicate the upgrade may proceed.
   *
   * @example
   *
   * export class Contract extends SmartContract {
   *  public constructor(private readonly owner = Deploy.senderAddress) {
   *    super();
   *  }
   *
   *  protected approveUpgrade(): boolean {
   *    return Address.isCaller(this.owner);
   *  }
   * }
   */
  protected approveUpgrade(): boolean;
  /**
   * Permanently deletes the contract.
   */
  protected readonly destroy: () => void;
  /**
   * Method automatically added for refunding native `Asset`s.
   */
  public readonly refundAssets: (transactionHash: Hash256) => boolean;
  /**
   * Used internally by client APIs to upgrade the contract. Control whether an invocation is allowed to upgrade the contract by overriding `approveUpgrade`.
   */
  public readonly upgrade: (
    script: Buffer,
    parameterList: Buffer,
    returnType: number,
    properties: number,
    contractName: string,
    codeVersion: string,
    author: string,
    email: string,
    description: string,
  ) => boolean;
  public static readonly for: <T>(hash: T extends IsValidSmartContract<T> ? Address : never) => T;
}

export interface LinkedSmartContractConstructor {
  /**
   * Returns an object representing a statically linked contract `T`.
   *
   * `T` is checked for validity and `LinkedSmartContract.for` will report an error during compilation if the interface is invalid.
   *
   * @example
   *
   * import { Token } from './Token';
   * const contract = LinkedSmartContract.for<Token>();
   * const from = Address.from('ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s');
   * const to = Address.from('AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx');
   * contract.transfer(from, to, 10);
   *
   * @returns an object representing the underlying smart contract
   */
  readonly for: <T extends SmartContract>() => T extends IsValidSmartContract<T> ? T : never;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export const LinkedSmartContract: LinkedSmartContractConstructor;

type Hashable = number | string | boolean | Buffer;
export interface Crypto {
  readonly sha1: (value: Hashable) => Buffer;
  readonly sha256: (value: Hashable) => Buffer;
  readonly hash160: (value: Hashable) => Buffer;
  readonly hash256: (value: Hashable) => Buffer;
}
export const crypto: Crypto;

/**
 * Marks a `SmartContract` method that verifies `Asset` transfers from the `SmartContract`.
 *
 * Method must return a boolean indicating whether the `SmartContract` wishes to send the transferred `Asset`s.
 *
 * May be used in combination with `@receive`
 */
export function send(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
/**
 * Marks a `SmartContract` method that verifies receiving `Asset`s to the `SmartContract`.
 *
 * Method must return a boolean indicating whether the `SmartContract` wishes to receive the transferred `Asset`s.
 *
 * May be used in combination with `@send`.
 */
export function receive(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
/**
 * Marks a `SmartContract` method that verifies GAS claims from the `SmartContract`.
 *
 * Method must return a boolean indicating whether the `SmartContract` wishes to allow GAS to be claimed.
 *
 * May optionally take the `ClaimTransaction` this `SmartContract` is executed in as the last argument. Accessing `Blockchain.currentTransaction` will result in an error.
 */
export function claim(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
/**
 * Marks a `SmartContract` method as not modifying storage.
 */
export function constant(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
