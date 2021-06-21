// tslint:disable
/// <reference path="./global.d.ts" />

/**
 * Marks an interface or class as not implementable or extendable.
 *
 * Makes it an error to pass values that would otherwise match the shape of the interface.
 *
 * See the [Standard Library](https://neo-one.io/docs/smart-contract-basics#Opaque-Tag-Symbol) chapter of the main guide for more information.
 */
declare const OpaqueTagSymbol0: unique symbol;

/**
 * `Buffer` that represents a NEO address.
 *
 * Stored as a script hash (Hash160) internally.
 *
 * See the [Standard Library](https://neo-one.io/docs/smart-contract-basics#Value-Types) chapter of the main guide for more information.
 */
export const Address: AddressConstructor;
export interface Address extends Buffer {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface AddressConstructor {
  /**
   * Creates an `Address` from a literal string. Accepts either a NEO address or a script hash.
   *
   * @example
   *
   * const address = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
   *
   * @example
   *
   * const address = Address.from('0xcef0c0fdcfe7838eff6ff104f9cdec2922297537');
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
  /**
   * `Address` of the NEO `Contract`.
   */
  readonly NEO: Address;
  /**
   * `Address` of the GAS `Contract`.
   */
  readonly GAS: Address;
  /**
   * `Address` of the Policy `Contract`.
   */
  readonly Policy: Address;
  /**
   * `Address` of the ContractManagement `Contract`.
   */
  readonly ContractManagement: Address;
  /**
   * `Address` of the StdLib `Contract`.
   */
  readonly StdLib: Address;
  /**
   * `Address` of the CryptoLib `Contract`.
   */
  readonly CryptoLib: Address;
  /**
   * `Address` of the Ledger `Contract`.
   */
  readonly Ledger: Address;
  /**
   * `Address` of the RoleManagement `Contract`.
   */
  readonly RoleManagement: Address;
  /**
   * `Address` of the Oracle `Contract`.
   */
  readonly Oracle: Address;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * `Buffer` that represents a NEO 256 bit hash.
 *
 * Examples of `Hash256` include `Block` hashes and `Transaction` hashes.
 *
 * See the [Standard Library](https://neo-one.io/docs/smart-contract-basics#Value-Types) chapter of the main guide for more information.
 */
export const Hash256: Hash256Constructor;
export interface Hash256 extends Buffer {
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface Hash256Constructor {
  /**
   * Creates a `Hash256` from a literal string.
   *
   * @example
   *
   * const hash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
   *
   * @param value Literal string for a `Hash256`.
   * @returns `Hash256` for the specified `value`
   */
  readonly from: (value: string) => Hash256;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * `Buffer` that represents a public key.
 *
 * See the [Standard Library](https://neo-one.io/docs/smart-contract-basics#Value-Types) chapter of the main guide for more information.
 */
export const PublicKey: PublicKeyConstructor;
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

interface FixedTag<T extends number> {
  readonly __decimals: T;
}
/**
 * Integer which represents a number with the specified decimals.
 *
 * See the [Standard Library](https://neo-one.io/docs/smart-contract-basics#Tagged-Types) chapter of the main guide for more information.
 */
export type Fixed<Decimals extends number> = number | (number & FixedTag<Decimals>);
/**
 * Integer that represents a number with 0 decimals.
 *
 * See the [Standard Library](https://neo-one.io/docs/smart-contract-basics#Tagged-Types) chapter of the main guide for more information.
 */
export type Integer = Fixed<0>;
/**
 * Integer that represents a number with 8 decimals.
 *
 * See the [Standard Library](https://neo-one.io/docs/smart-contract-basics#Tagged-Types) chapter of the main guide for more information.
 */
export type Fixed8 = Fixed<8>;

/**
 * `AttributeType` flag indicates the type of the data.
 *
 * @see Attribute
 */
export enum AttributeType {
  HighPriority = 0x01,
  OracleResponse = 0x11,
}

/**
 * Base interface for `Attribute`s
 *
 * @see Attribute
 */
export const AttributeBase: AttributeBaseConstructor;
export interface AttributeBase {
  readonly type: AttributeType;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

export interface AttributeBaseConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

export interface HighPriorityAttribute extends AttributeBase {
  readonly type: AttributeType.HighPriority;
}

export interface OracleResponseAttribute extends AttributeBase {
  readonly type: AttributeType.OracleResponse;
}

/**
 * `Attribute`s are used to store additional data on `Transaction`s.
 */
export type Attribute = HighPriorityAttribute | OracleResponseAttribute;

export enum WitnessScope {
  None = 0x00,
  CalledByEntry = 0x01,
  CustomContracts = 0x10,
  CustomGroups = 0x20,
  Global = 0x80,
}

export const WitnessScopeBase: WitnessScopeBaseConstructor;
/**
 * Base interface for `WitnessScope`
 *
 * @see WitnessScope
 */
export interface WitnessScopeBase {
  readonly scope: WitnessScope;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

export interface WitnessScopeBaseConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

export interface NoneWitnessScope extends WitnessScopeBase {
  readonly scope: WitnessScope.None;
}

export interface CalledByEntryWitnessScope extends WitnessScopeBase {
  readonly scope: WitnessScope.CalledByEntry;
}

export interface CustomContractsWitnessScope extends WitnessScopeBase {
  readonly scope: WitnessScope.CustomContracts;
}

export interface CustomGroupsWitnessScope extends WitnessScopeBase {
  readonly scope: WitnessScope.CustomGroups;
}

export interface GlobalWitnessScope extends WitnessScopeBase {
  readonly scope: WitnessScope.Global;
}

export const Signer: SignerConstructor;
export interface Signer {
  /**
   * `Address` representing the account of this signer.
   */
  readonly account: Address;
  /**
   * `Scopes` of this signature.
   */
  readonly scopes: WitnessScope;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface SignerConstructor {}

/**
 * `Transaction`s are persisted to the blockchain and represent various functionality like transferring first class `Asset`s or executing smart contracts.
 *
 * Smart contracts are executed within an `InvocationTransaction`.
 *
 * @example
 *
 * const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
 * const transaction = Transaction.for(transactionHash);
 *
 */
export const Transaction: TransactionConstructor;
/**
 * Interface for all `Transaction`s.
 */
export interface Transaction {
  /**
   * `Hash256` of this `Transaction`.
   */
  readonly hash: Hash256;
  /**
   * Neo protocol version.
   */
  readonly version: number;
  /**
   * Unique number in order to ensure the hash for this contract is unique.
   */
  readonly nonce: number;
  /**
   * `Address` of the transaction sender.
   */
  readonly sender: Address;
  /**
   * GAS execution fee for the transaction.
   */
  readonly systemFee: number;
  /**
   * GAS network priority fee for the transaction.
   */
  readonly networkFee: number;
  /**
   * Block expiration time.
   */
  readonly validUntilBlock: number;
  /**
   * The index of the `Transaction` within the `Block`
   */
  readonly height: number;
  /**
   * Code that was executed in the NeoVM.
   */
  readonly script: Buffer;
  /**
   * `Notification`s emitted by the `Transaction`.
   */
  // readonly notifications: Notification[];
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface TransactionConstructor {
  /**
   * @returns `Transaction` for the specified `hash`.
   */
  readonly for: (hash: Hash256) => Transaction;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Attributes of a smart contract deployed to the blockchain.
 *
 * @example
 *
 * const contractAddress = Address.from('0xcef0c0fdcfe7838eff6ff104f9cdec2922297537');
 * const contract = Contract.for(contractAddress);
 * const contractScript = contract.script;
 *
 */
export const Contract: ContractConstructor;
export interface Contract {
  /**
   * The ID of the `Contract`
   */
  readonly id: number;
  /**
   * The number of times the `Contract` has been updated.
   */
  readonly updateCounter: number;
  /**
   * The `Contract` hash.
   */
  readonly hash: Address;
  /**
   * The NEO Executable Format 3 (NEF) of the `Contract`.
   */
  readonly nef: Buffer;
  /**
   * The `ContractManifest` of the `Contract`.
   */
  readonly manifest: ContractManifest;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractConstructor {
  /**
   * Returns `undefined` if a `Contract` does not exist at `address`.
   *
   * @returns `Contract` for the specified `address`.
   */
  readonly for: (address: Address) => Contract | undefined;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Represents the manifest of a smart contract.
 *
 * Every deployed smart contract must explicitly declare the features and permissions it will use
 * in its manifest.
 *
 * @example
 *
 * const contractAddress = Address.from('0xcef0c0fdcfe7838eff6ff104f9cdec2922297537');
 * const contract = Contract.for(contractAddress);
 * const manifest: ContractManifest = contract.manifest;
 */
export const ContractManifest: ContractManifestConstructor;
export interface ContractManifest {
  /**
   * The name of the contract.
   */
  readonly name: string;
  /**
   * A group represents a set of mutually trusted contracts. A contract will trust and allow any contract in the same group to invoke it, and the user interface will not give any warnings.
   */
  readonly groups: readonly ContractGroup[];
  /**
   * The Neo Enhancement Proposals (NEPs) and other standards that this smart contract supports.
   */
  readonly supportedStandards: readonly string[];
  /**
   * Full specification of the functions and events of a smart contract. Used by the Client APIs
   * to generate the smart contract interface.
   */
  readonly abi: ContractABI;
  /**
   * The permissions field is an array containing a set of `ContractPermission` objects. It describes which contracts may be invoked and which methods are called.
   */
  readonly permissions: readonly ContractPermission[];
  /**
   * The trusts field is an array containing a set of contract hashes. It can also be `undefined`. If it is `undefined`, then it means that it trusts any contract.
   * If a contract is trusted, the user interface will not give any warnings when called by the contract.
   */
  readonly trusts?: readonly Address[];
  /**
   * Custom user-defined JSON object, which is represented as a stringified JSON string. If it's not defined on deploy it will default to \"{}\".
   */
  readonly extra: string;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractManifestConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * A `ContractGroup` represents a set of mutually trusted contracts. A contract will allow any contract in the same
 * group to invoke it, and the user interface will not give any warnings. A group is identified by a public key
 * and must be accompanied by a signature for the contract hash to prove the contract is included in the group.
 */
export const ContractGroup: ContractGroupConstructor;
export interface ContractGroup {
  /**
   * The public key identifying the group.
   */
  readonly publicKey: PublicKey;
  /**
   * Signature of the contract hash.
   */
  readonly signature: Buffer;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractGroupConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Describes which contracts may be invoked and which methods are called.
 */
export const ContractPermission: ContractPermissionConstructor;
export interface ContractPermission {
  /**
   * Indicates the contract to be invoked. Can be either a contract hash, the public key of a group, or a wildcard.
   */
  readonly contract?: Address | PublicKey;
  /**
   * An array containing a set of methods to be called. If it is a wildcard then any method can be called.
   * If a contract invokes a contract or method that is not declared in the manifest at runtime, the invocation will fail.
   */
  readonly methods?: readonly string[];
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractPermissionConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Full specification of the methods and events of a smart contract. Used by the client APIs to generate the smart contract interface.
 *
 * See the [Smart Contract APIs](https://neo-one.io/docs/smart-contract-apis) chapter of the main guide for more information.
 */
export const ContractABI: ContractABIConstructor;
export interface ContractABI {
  /**
   * Specification of the smart contract methods.
   */
  readonly methods: readonly ContractMethodDescriptor[];
  /**
   * Specification of the smart contract events.
   */
  readonly events: readonly ContractEventDescriptor[];
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractABIConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Method specification in the `ContractABI` of a smart contract.
 */
export const ContractMethodDescriptor: ContractMethodDescriptorConstructor;
export interface ContractMethodDescriptor {
  /**
   * Name of the method.
   */
  readonly name: string;
  /**
   * Parameters of the method.
   */
  readonly parameters: readonly ContractParameterDefinition[];
  /**
   * Return type of the method.
   */
  readonly returnType: ContractParameterType;
  /**
   * Used to set the instruction pointer before executing the method.
   */
  readonly offset: number;
  /**
   * Indicates whether the method is safe to be called by other contracts.
   */
  readonly safe: boolean;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractMethodDescriptorConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Event specification in the `ContractABIClient` of a smart contract generated by the NEO•ONE compiler
 * for use with NEO•ONE Client APIs.
 */
export const ContractEventDescriptor: ContractEventDescriptorConstructor;
export interface ContractEventDescriptor {
  /**
   * Name of the event.
   */
  readonly name: string;
  /**
   * Parameters of the event.
   */
  readonly parameters: readonly ContractParameterDefinition[];
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractEventDescriptorConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Describes the details of a contract parameter.
 */
export const ContractParameterDefinition: ContractParameterDefinitionConstructor;
export interface ContractParameterDefinition {
  /**
   * The name of the contract parameter.
   */
  readonly name: string;
  /**
   * The type of the contract parameter. @see `ContractParameterType` for information on possible contract parameter types.
   */
  readonly type: ContractParameterType;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ContractParameterDefinitionConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * The possible types of contract parameters.
 */
export enum ContractParameterType {
  Any = 0x00,
  Boolean = 0x10,
  Integer = 0x11,
  ByteArray = 0x12,
  String = 0x13,
  Hash160 = 0x14,
  Hash256 = 0x15,
  PublicKey = 0x16,
  Signature = 0x17,
  Array = 0x20,
  Map = 0x22,
  InteropInterface = 0x30,
  Void = 0xff,
}

// export enum StackItemType {
//   Any = 0x00,
//   Pointer = 0x10,
//   Boolean = 0x20,
//   Integer = 0x21,
//   ByteString = 0x28,
//   Buffer = 0x30,
//   Array = 0x40,
//   Struct = 0x41,
//   Map = 0x48,
//   InteropInterface = 0x60,
// }

// export interface StackItemBase {
//   readonly type: StackItemType;
// }

// export interface BufferStackItem extends StackItemBase {
//   readonly type: StackItemType.Buffer;
//   readonly value: Buffer;
// }

// export type StackItem = BufferStackItem;

// /**
//  *
//  */
// export interface Notification {
//   /**
//    *
//    */
//   readonly scriptHash: Address;
//   /**
//    * The name of the notification event. \"Transfer\" in the event of a transfer.
//    */
//   readonly eventName: string;
//   /**
//    *
//    */
//   readonly state: StackItem[];
// }

/**
 * Attributes of a `Block` persisted to the blockchain.
 *
 * @example
 *
 * const genesisBlock = Block.for(0);
 *
 * @example
 *
 * const blockHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
 * const arbitraryBlock = Block.for(blockHash);
 *
 */
export const Block: BlockConstructor;
export interface Block {
  /**
   * `Block` hash.
   */
  readonly hash: Hash256;
  /**
   * NEO blockchain version.
   */
  readonly version: Integer;
  /**
   * Previous `Block` hash.
   */
  readonly previousHash: Hash256;
  /**
   * `Block` index.
   */
  readonly index: Integer;
  /**
   * `Block` primary index of the consensus node that generated this block.
   */
  readonly primaryIndex: Integer;
  /**
   * Root of the `Transaction` hash Merkle Tree.
   */
  readonly merkleRoot: Hash256;
  /**
   * `Block` time persisted.
   */
  readonly time: Integer;
  /**
   * Next consensus address.
   */
  readonly nextConsensus: Address;
  /**
   * The number of `Transaction`s contained in the `Block`.
   */
  readonly transactionsLength: Integer;
}
export interface BlockConstructor {
  /**
   * Accepts either the `Hash256` or the index of the `Block`.
   *
   * @returns `Block` for the specified `hashOrIndex`.
   */
  readonly for: (hashOrIndex: Hash256 | Integer) => Block;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Value that can be used as a key in `MapStorage` and a value for `SetStorage`.
 *
 * See the [Properties and Storage](https://neo-one.io/docs/properties-and-storage) chapter of the main guide for more information.
 */
export type SerializableKeySingle = number | string | boolean | Buffer;
type SK = SerializableKeySingle;
export type SerializableKey = SK | [SK, SK] | [SK, SK, SK] | [SK, SK, SK, SK];
export interface SerializableValueArray extends ReadonlyArray<SerializableValue> {}
export interface SerializableValueMap extends ReadonlyMap<SerializableKeySingle, SerializableValue> {}
export interface SerializableValueSet extends ReadonlySet<SerializableValue> {}
export interface SerializableValueObject {
  readonly [key: string]: SerializableValue;
}
/**
 * Value that can be serialized for storage.
 *
 * See the [Properties and Storage](https://neo-one.io/docs/properties-and-storage) chapter of the main guide for more information.
 */
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
 * Persistent smart contract array storage. Only usable as a `SmartContract` property.
 *
 * See the [Properties and Storage](https://neo-one.io/docs/properties-and-storage#Structured-Storage) chapter of the main guide for more information.
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
export const ArrayStorage: ArrayStorageConstructor;
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
  /**
   * Access the value at index `n`.
   */
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
 * See the [Properties and Storage](https://neo-one.io/docs/properties-and-storage#Structured-Storage) chapter of the main guide for more information.
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
export const MapStorage: MapStorageConstructor;
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
    : K extends [SK, SK, SK]
    ? SKMapAtThree<K, V>
    : K extends [SK, SK, SK, SK]
    ? SKMapAtFour<K, V>
    : never;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface MapStorageConstructor {
  /**
   * Constructs a new `MapStorage` instance. Only usable as a `SmartContract` property.
   */
  for<K extends SerializableKey, V extends SerializableValue>(): MapStorage<K, V>;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

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
 * See the [Properties and Storage](https://neo-one.io/docs/properties-and-storage#Structured-Storage) chapter of the main guide for more information.
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
export const SetStorage: SetStorageConstructor;
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
    : V extends [SK, SK, SK]
    ? SKSetAtThree<V>
    : V extends [SK, SK, SK, SK]
    ? SKSetAtFour<V>
    : never;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface SetStorageConstructor {
  /**
   * Constructs a new `SetStorage` instance. Only usable as a `SmartContract` property.
   */
  for<K extends SerializableKey>(): SetStorage<K>;
  readonly [OpaqueTagSymbol0]: unique symbol;
}

/**
 * Holds properties about the current state of the blockchain, the current `Transaction` and the current caller `Contract`.
 *
 * See the [Standard Library](https://neo-one.io/docs/standard-library#Blockchain-and-Transaction-Information) chapter of the main guide for more information.
 */
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
   * `Transaction` this smart contract is executed in.
   */
  readonly currentTransaction: Transaction;
  /**
   * The `Address` of the smart contract that directly invoked the contract.
   *
   * Will be `undefined` if the smart contract method was not invoked by another smart contract, but instead was invoked by a user directly.
   */
  readonly currentCallerContract: Address | undefined;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
/**
 * Information about the current state of the blockchain and the current execution.
 */
export const Blockchain: BlockchainConstructor;

/**
 * Injects values at deployment time. Can only be used for default constructor parameters.
 */
export const Deploy: DeployConstructor;
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
 * Creates an event notifier for `SmartContract` notifications.
 *
 * Must be explicitly typed and contain string literals for the event name and argument names.
 *
 * See the [Events and Logs](https://neo-one.io/docs/events-and-logs) chapter of the main guide for more information.
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
export function createEventNotifier<A0, A1, A2, A3, A4, A5, A6, A7, A8>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
  arg5Name: string,
  arg6Name: string,
  arg7Name: string,
  arg8Name: string,
): (arg0: A0, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7, arg8: A8) => void;
export function createEventNotifier<A0, A1, A2, A3, A4, A5, A6, A7>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
  arg5Name: string,
  arg6Name: string,
  arg7Name: string,
): (arg0: A0, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7) => void;
export function createEventNotifier<A0, A1, A2, A3, A4, A5, A6>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
  arg5Name: string,
  arg6Name: string,
): (arg0: A0, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6) => void;
export function createEventNotifier<A0, A1, A2, A3, A4, A5>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
  arg5Name: string,
): (arg0: A0, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => void;
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
 * Declares an event for `SmartContract` notifications.
 *
 * Must be explicitly typed and contain string literals for the event name and argument names.
 *
 * See the [Events and Logs](https://neo-one.io/docs/events-and-logs) chapter of the main guide for more information.
 *
 * @example
 *
 * declareEvent<Address, Address, Fixed<8>>('transfer', 'from', 'to', 'amount');
 *
 * @param name Event name
 * @param argName Event argument name
 */
export function declareEvent<A0, A1, A2, A3, A4, A5>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
  arg5Name: string,
): void;
export function declareEvent(name: string): void;
export function declareEvent<A0>(name: string, arg0Name: string): void;
export function declareEvent<A0, A1>(name: string, arg0Name: string, arg1Name: string): void;
export function declareEvent<A0, A1, A2>(name: string, arg0Name: string, arg1Name: string, arg2Name: string): void;
export function declareEvent<A0, A1, A2, A3>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
): void;
export function declareEvent<A0, A1, A2, A3, A4>(
  name: string,
  arg0Name: string,
  arg1Name: string,
  arg2Name: string,
  arg3Name: string,
  arg4Name: string,
): void;

/**
 * An opaque type that represents a method parameter which is typically forwarded as an argument to another smart contract.
 *
 * See the [Forward Values](https://neo-one.io/docs/forward-values) chapter of the advanced guide for more information.
 */
export const ForwardValue: ForwardValueConstructor;
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
  readonly asMap: () => Map<ForwardValue, ForwardValue>;
  readonly asMapNullable: () => Map<ForwardValue, ForwardValue> | undefined;
  readonly [OpaqueTagSymbol0]: unique symbol;
}
export interface ForwardValueConstructor {
  readonly [OpaqueTagSymbol0]: unique symbol;
}

interface ForwardedValueTag<T extends SmartContractArg> {}
/**
 * Marks a parameter or return type of a public `SmartContract` method as expecting a forwarded value.
 *
 * See the [Forward Values](https://neo-one.io/docs/forward-values) chapter of the advanced guide for more information.
 */
export type ForwardedValue<T extends SmartContractArg> = T | (T & ForwardedValueTag<T>);

interface SmartContractValueArray extends Array<SmartContractValue> {}
interface SmartContractValueReadonlyArray extends ReadonlyArray<SmartContractValue> {}
interface SmartContractValueMap extends Map<SmartContractValue, SmartContractValue> {}
interface SmartContractValueReadonlyMap extends ReadonlyMap<SmartContractValue, SmartContractValue> {}
interface SmartContractValueObject {
  readonly [key: string]: SmartContractValue;
}
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
  | SmartContractValueReadonlyArray
  | SmartContractValueMap
  | SmartContractValueReadonlyMap
  | SmartContractValueObject;
type SmartContractArg = SmartContractValue | ForwardValue;
type IsValidSmartContract<T> = {
  [K in keyof T]: T[K] extends Function
    ? Parameters<T[K]> extends SmartContractArg[]
      ? ReturnType<T[K]> extends SmartContractArg
        ? T[K]
        : never
      : never
    : T[K] extends SmartContractValue
    ? T[K]
    : never;
};

/**
 * Object that defines a contract group for use in deployment.
 *
 * See the [Deployment](https://neo-one.io/docs/deployment#Properties) chapter of the main guide for more information.
 */
export interface ContractPropertyGroup {
  /**
   * The public key of the group.
   */
  readonly publicKey: string;
  /**
   * The signature of the contract hash.
   */
  readonly signature: string;
}

/**
 * Object that defines a contract permission for use in deployment.
 *
 * See the [Deployment](https://neo-one.io/docs/deployment#Properties) chapter of the main guide for more information.
 */
export interface ContractPropertyPermission {
  /**
   * An object indicating the contract to be invoked. It can be the hash of a single contract or the public key of a contract group.
   * If it specifies the hash of a contract then the contract can be invoked.
   * If it specifies the public key of a group, then any contract in this group can be invoked
   * If this object has hash and group as undefined then this will be considered a wildcard (\"*\") and any contract can be invoked.
   */
  readonly contract: { readonly hash?: string; readonly group?: string };
  /**
   * An array of methods that are allowed to be called. An empty array means that no methods will be allowed to be called. This can also be a wildcard string: \"*\", which means that any method can be called.
   */
  readonly methods: string | readonly string[];
}

/**
 * Object with literals for the contract properties to be used in deployment.
 *
 * See the [Deployment](https://neo-one.io/docs/deployment#Properties) chapter of the main guide for more information.
 */
export interface ContractProperties {
  /**
   * A group represents a set of mutually trusted contracts. A contract will trust and allow any contract in the same group to invoke it, and the user interface will not give any warnings.
   */
  readonly groups: readonly ContractPropertyGroup[];
  /**
   * The permissions field is an array containing a set of `ContractPropertyPermission` objects. It describes which contracts may be invoked and which methods are called.
   */
  readonly permissions: readonly ContractPropertyPermission[];
  /**
   * The trusts field is an array containing a set of contract hashes or group public keys. It can also be assigned with a wildcard *. If it is a wildcard *, then it means that this contract trusts any contract.
   * If a contract is trusted, the user interface will not give any warnings when called by the contract.
   */
  readonly trusts: string | readonly string[];
}

/**
 * Marks a class as a `SmartContract`.
 */
export class SmartContract {
  /**
   * Properties used for deployment of the `SmartContract`
   *
   * See the [Deployment](https://neo-one.io/docs/deployment#Properties) chapter of the main guide for more information.
   */
  public readonly properties: ContractProperties;
  /**
   * `Address` of the `SmartContract`.
   */
  public readonly address: Address;
  /**
   * Property primarily used internally to validate that the smart contract is deployed only once.
   */
  protected readonly deployed: true;
  /**
   * Override to validate a contract upgrade invocation. Returns `false` by default. Return `true` to indicate the upgrade may proceed.
   *
   * See the [Deployment](https://neo-one.io/docs/deployment#Upgrade) chapter of the main guide for more information.
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
   *
   * See the [Deployment](https://neo-one.io/docs/deployment#Destroy) chapter of the main guide for more information.
   */
  protected readonly destroy: () => void;
  /**
   * Used internally by client APIs to upgrade the contract. Control whether an invocation is allowed to upgrade the contract by overriding `approveUpgrade`.
   *
   * See the [Deployment](https://neo-one.io/docs/deployment#Upgrade) chapter of the main guide for more information.
   */
  public readonly upgrade: (script: Buffer, manifest: Buffer) => boolean;
  /**
   * Returns the singleton instance of the `SmartContract` defined by the interface `T` at `address`.
   *
   * `T` is checked for validity and `SmartContract.for` will report an error during compilation if the interface is invalid.
   *
   * See the [Calling Smart Contracts](https://neo-one.io/docs/calling-smart-contracts) chapter of the main guide for more information.
   *
   * @example
   *
   * interface Token {
   *  readonly transfer: (from: Address, to: Address, amount: Fixed<8>) => boolean;
   * }
   *
   * const address = Address.from('ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s');
   * const contract = SmartContract.for<Token>(address);
   *
   */
  public static readonly for: <T>(address: T extends IsValidSmartContract<T> ? Address : never) => T;
}

export interface LinkedSmartContractConstructor {
  /**
   * Returns the singleton instance of the statically linked contract `T`.
   *
   * `T` is checked for validity and `LinkedSmartContract.for` will report an error during compilation if the interface is invalid.
   *
   * See the [Calling Smart Contracts](https://neo-one.io/docs/calling-smart-contracts) chapter of the main guide for more information.
   *
   * @example
   *
   * import { Token } from './Token';
   *
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

/**
 * Types that can be hashed by the various `crypto` functions.
 *
 * @see crypto
 */
export type Hashable = number | string | boolean | Buffer;
/**
 * Contains various cryptography functions.
 */
export interface CryptoConstructor {
  /**
   * Returns a `Buffer` of the SHA256 hash of the input
   */
  readonly sha256: (value: Hashable) => Buffer;
  /**
   * Returns a `Buffer` of the RIPEMD160 hash of the input.
   */
  readonly ripemd160: (value: Hashable) => Address;
  /**
   * Returns a `Buffer` of the RIPEMD160 hash of the SHA256 hash of the input.
   */
  readonly hash160: (value: Hashable) => Address;
  /**
   * Returns a `Buffer` of the SHA256 hash of the SHA256 hash of the input.
   */
  readonly hash256: (value: Hashable) => Hash256;
}
/**
 * Contains various cryptography functions.
 */
export const crypto: CryptoConstructor;

/**
 * Represents a native `Asset` transfer.
 */
export interface Transfer {
  /**
   * The amount transferred.
   */
  readonly amount: Fixed<8>;
  /**
   * The `Hash256` of the `Asset` transferred.
   */
  readonly asset: Hash256;
  /**
   * The desination `Address` of the transfer.
   */
  readonly to: Address;
}

/**
 * Marks a `SmartContract` method that verifies receiving `Asset`s to the `SmartContract`.
 *
 * Method must return a boolean indicating whether the `SmartContract` wishes to receive the transferred `Asset`s.
 *
 * See the [Native Assets](https://neo-one.io/docs/native-assets) chapter of the advanced guide for more information.
 */
export function receive(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
/**
 * Marks a `SmartContract` method as not modifying storage.
 *
 * See the [Methods](https://neo-one.io/docs/methods) chapter of the main guide for more information.
 */
export function constant(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
/**
 * Marks a `SmartContract` method as safe.
 *
 * See the [Methods](https://neo-one.io/docs/methods) chapter of the main guide for more information.
 */
export function safe(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
