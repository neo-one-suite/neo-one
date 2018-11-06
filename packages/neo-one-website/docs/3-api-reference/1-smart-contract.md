---
slug: smart-contract
title: \@neo-one/smart-contract
---
# @neo-one/smart-contract

`@neo-one/smart-contract` contains the standard library for NEO•ONE smart contracts.

This reference uses dot syntax to indicate static properties and `#` to indicate instance properties. For example:

  - `Foo.bar` is the static property `bar` on the value `Foo`.
  - `Foo#bar` is the property `bar` on an instance of `Foo`.

---

[[toc]]

---

## Smart Contract

[[toc-reference]]

---

#### `Address`

`Buffer` that represents a NEO address. Stored as a script hash (Hash160) internally. See the [Standard Library](/docs/smart-contract-basics#Value-Types) chapter of the main guide for more information.

##### `Address.from(value: string): Address`

Creates an [`Address`](/docs/smart-contract#Address) from a literal string. Accepts either a NEO address or a script hash.

**Example:**

```typescript
const address = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
```

**Example:**

```typescript
const address = Address.from('0xcef0c0fdcfe7838eff6ff104f9cdec2922297537');
```

##### `Address.isCaller(address: Address): boolean`

Verifies that the invocation was directly called AND approved by [`Address`](/docs/smart-contract#Address). Smart contracts should invoke this function before taking transferring items for [`Address`](/docs/smart-contract#Address)es, like transferring tokens, that require the permission of the [`Address`](/docs/smart-contract#Address).

**Example:**

```typescript
if (!Address.isCaller(address)) {
  return false;
}
```

##### `Address.isSender(address: Address): boolean`

Verifies that the [`Transaction`](/docs/smart-contract#Transaction) was signed by the `address`. In most cases, smart contracts should instead use [`Address.isCaller`](/docs/smart-contract#Address.isCaller(address:-Address):-boolean).

```typescript
if (!Address.isSender(address)) {
  return false;
}
```

#### `Hash256`

`Buffer` that represents a NEO 256 bit hash. Examples of [`Hash256`](/docs/smart-contract#Hash256) include [`Block`](/docs/smart-contract#Block) hashes and [`Transaction`](/docs/smart-contract#Transaction) hashes. See the [Standard Library](/docs/smart-contract-basics#Value-Types) chapter of the main guide for more information.

##### `Hash256.from(value: string): Hash256`

Creates a [`Hash256`](/docs/smart-contract#Hash256) from a literal string.

**Example:**

```typescript
const hash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
```

##### `Hash256.NEO`

[`Hash256`](/docs/smart-contract#Hash256) of the NEO [`Asset`](/docs/smart-contract#Asset).

##### `Hash256.GAS`

[`Hash256`](/docs/smart-contract#Hash256) of the GAS [`Asset`](/docs/smart-contract#Asset).

#### `PublicKey`

`Buffer` that represents a public key. See the [Standard Library](/docs/smart-contract-basics#Value-Types) chapter of the main guide for more information.

##### `PublicKey.from(value: string): PublicKey`

Creates a [`PublicKey`](/docs/smart-contract#PublicKey) from a literal string.

**Example:**

```typescript
const publicKey = PublicKey.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef');
```

#### `Fixed<Decimals extends number>`

Integer which represents a number with the specified decimals. See the [Standard Library](/docs/smart-contract-basics#Tagged-Types) chapter of the main guide for more information.

#### `Integer`

Integer that represents a number with 0 decimals. See the [Standard Library](/docs/smart-contract-basics#Tagged-Types) chapter of the main guide for more information.

#### `Fixed8`

Integer that represents a number with 8 decimals. See the [Standard Library](/docs/smart-contract-basics#Tagged-Types) chapter of the main guide for more information.

#### `SerializableKey`

Value that can be used as a key in `MapStorage` and a value for `SetStorage`. See the [Properties and Storage](/docs/properties-and-storage) chapter of the main guide for more information.

```typescript
type SerializableKey = number | string | boolean | Buffer | [SerializableKey, SerializableKey] | [SerializableKey, SerializableKey, ...SerializableKey];
```

#### `SerializableValue`

Value that can be serialized for storage. See the [Properties and Storage](/docs/properties-and-storage) chapter of the main guide for more information.

```typescript
type SerializableValue =
  | undefined
  | null
  | number
  | string
  | boolean
  | Buffer
  | ReadonlyArray<SerializableValue>
  | ReadonlyMap<SerializableValue, SerializableValue>
  | ReadonlySet<SerializableValue>
  | { [key: string]: SerializableValue };
```

#### `ArrayStorage<T extends SerializableValue>`

Persistent smart contract array storage. Only usable as a [`SmartContract`](/docs/smart-contract#SmartContract) property. See [Properties and Storage](/docs/properties-and-storage#Structured-Storage) in the main guide for more information.

**Example:**

```typescript
class MySmartContract extends SmartContract {
  private readonly pendingAddresses = ArrayStorage.for<Address>();

  public addPendingAddress(address: Address): void {
    this.pendingAddresses.push(address);
  }
}
```

##### `ArrayStorage.for<T extends SerializableValue>(): ArrayStorage<T>`

Constructs a new `ArrayStorage` instance. Only usable as a [`SmartContract`](/docs/smart-contract#SmartContract) property.

##### `ArrayStorage#length`

Gets the length of the array. This is a number one higher than the highest element defined in an array.

##### `ArrayStorage#forEach(callback: (value: T, idx: number) => void): void`

Executes a provided function once per each value in storage.

##### `ArrayStorage#push(...items: T[]): number`

Appends new elements to storage, and returns the new length of the array.

##### `ArrayStorage#pop(): T | undefined`

Removes the last element from an array and returns it.

##### `ArrayStorage#[n: number]: T`

Access the value at index `n`.

#### `MapStorage<K extends SerializableKey, V extends SerializableValue>`

Persistent smart contract storage. Only usable as a [`SmartContract`](/docs/smart-contract#SmartContract) property. See the [Properties and Storage](/docs/properties-and-storage#Structured-Storage) chapter of the main guide for more information.

##### `MapStorage.for<K extends SerializableKey, V extends SerializableValue>(): MapStorage<K, V>`

Constructs a new `MapStorage` instance. Only usable as a [`SmartContract`](/docs/smart-contract#SmartContract) property.

##### `MapStorage#forEach(callback: (value: V, key: K) => void): void`

Executes a provided function once per each key/value pair in storage.

##### `MapStorage#get(key: K): V | undefined`

Returns a specified element from storage.

##### `MapStorage#has(key: K): boolean`

Returns a boolean indicating whether an element with the specified key exists or not.

##### `MapStorage#delete(key: K): boolean`

Removes the specified element from storage.

##### `MapStorage#set(key: K, value: V): MapStorage<K, V>`

Adds or updates an element with a specified key and value in storage.

##### `MapStorage#at(prefix): MapStorage`

Returns a `MapStorage` instance of the elements from storage with the specified prefix.

**Example:**

```typescript
export class Contract extends SmartContract {
  private readonly storage = MapStorage.for<[Address, PublicKey], Fixed<8>>();

  public action(address: Address): void {
    const storageAtAddress: MapStorage<PublicKey, Fixed<8>> = this.storage.at(address);
    storageAtAddress.forEach((value: Fixed<8>, key: PublicKey) => {
      // ...
    });
  }
}
```

#### `SetStorage<V extends SerializableKey>`

Persistent smart contract set storage. Only usable as a [`SmartContract`](/docs/smart-contract#SmartContract) property. See the [Properties and Storage](/docs/properties-and-storage#Structured-Storage) chapter of the main guide for more information.

**Example:**

```typescript
class ICO extends SmartContract {
  private readonly whitelistedAddresses = SetStorage.for<Address>();

  public isWhitelisted(address: Address): boolean {
    return this.whitelistedAddresses.has(address);
  }
}
```

##### `SetStorage.for<V extends SerializableKey>(): SetStorage<V>`

Constructs a new `SetStorage` instance. Only usable as a [`SmartContract`](/docs/smart-contract#SmartContract) property.

##### `SetStorage#forEach(callback: (value: V) => void): void`

Executes a provided function once per each value in storage.

##### `SetStorage#has(value: V): boolean`

Returns a boolean indicating whether an element with the specified value exists or not.

##### `SetStorage#delete(value: V): boolean`

Removes the specified element from storage.

##### `SetStorage#add(value: V): SetStorage<V>`

Adds an element with the specified value in storage.

##### `SetStorage#at(prefix): SetStorage`

Returns a `SetStorage` instance of the elements from storage with the specified prefix.

**Example:**

```typescript
export class Contract extends SmartContract {
  private readonly storage = SetStorage.for<[Address, PublicKey]>();

  public action(address: Address): void {
    const storageAtAddress: SetStorage<PublicKey> = this.storage.at(address);
    storageAtAddress.forEach((value: PublicKey) => {
      // ...
    });
  }
}
```

#### `Blockchain`

Holds properties about the current state of the blockchain, the current [`Transaction`](/docs/smart-contract#Transaction) and the current caller [`Contract`](/docs/smart-contract#Contract). See the [Standard Library](/docs/standard-library#Blockchain-and-Transaction-Information) chapter of the main guide for more information.

##### `Blockchain.currentBlockTime`

Time of the current [`Block`](/docs/smart-contract#Block).

##### `Blockchain.currentHeight`

Index of the latest [`Block`](/docs/smart-contract#Block) persisted to the blockchain.

##### `Blockchain.currentTransaction`

[`InvocationTransaction`](/docs/smart-contract#InvocationTransaction) this smart contract is executed in.

##### `Blockchain.currentCallerContract`

The [`Address`](/docs/smart-contract#Address) of the smart contract that directly invoked the contract. Will be `undefined` if the smart contract method was not invoked by another smart contract, but instead was invoked by a user directly.

#### `Deploy`

Injects values at deployment time. Can only be used for default constructor parameters.

##### `Deploy.senderAddress`

Use the sender [`Address`](/docs/smart-contract#Address) for the constructor parameter.

**Example:**

```typescript
import { Address, Deploy, SmartContract } from '@neo-one/smart-contract';

class Token extends SmartContract {
  public constructor(public readonly owner: Address = Deploy.senderAddress) {
    super();
  }
}
```

#### `createEventNotifier`

Creates an event notifier for [`SmartContract`](/docs/smart-contract#SmartContract) notifications. Must be explicitly typed and contain string literals for the event name and argument names. See the [Events and Logs](/docs/events-and-logs) chapter of the main guide for more information.

**Example:**

```typescript
const notifyTransfer = createEventNotifier<Address, Address, Fixed<8>>('transfer', 'from', 'to', 'amount');

const from = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
const to = Address.from('AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx');
notifyTransfer(from, to, 200);
```

#### `declareEvent`

Declares an event for [`SmartContract`](/docs/smart-contract#SmartContract) notifications. Must be explicitly typed and contain string literals for the event name and argument names. See the [Events and Logs](/docs/events-and-logs) chapter of the main guide for more information.

**Example:**

```typescript
declareEvent<Address, Address, Fixed<8>>('transfer', 'from', 'to', 'amount');
```

#### `ForwardValue`

An opaque type that represents a method parameter which is typically forwarded as an argument to another smart contract. See the [Forward Values](/docs/forward-values) chapter of the advanced guide for more information.

#### `ForwardedValue`

Marks a parameter or return type of a public [`SmartContract`](/docs/smart-contract#SmartContract) method as expecting a forwarded value. See the [Forward Values](/docs/forward-values) chapter of the advanced guide for more information.

#### `SmartContract`

Marks a class as a [`SmartContract`](/docs/smart-contract#SmartContract).

##### `SmartContract.for<T>(address: Address): T`

Returns the singleton instance of the [`SmartContract`](/docs/smart-contract#SmartContract) defined by the interface `T` at `address`. `T` is checked for validity and `SmartContract.for` will report an error during compilation if the interface is invalid. See the [Calling Smart Contracts](/docs/calling-smart-contracts) chapter of the main guide for more information.

**Example:**

```typescript
interface Token {
  readonly transfer: (from: Address, to: Address, amount: Fixed<8>) => boolean;
}

const address = Address.from('ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s');
const contract = SmartContract.for<Token>(address);
```

##### `LinkedSmartContract.for<T>(): T`

Returns the singleton instance of the statically linked contract `T`. `T` is checked for validity and `LinkedSmartContract.for` will report an error during compilation if the interface is invalid. See the [Calling Smart Contracts](https://neo-one.io/docs/calling-smart-contracts) chapter of the main guide for more information.

**Example:**

```typescript
import { Token } from './Token';

const contract = LinkedSmartContract.for<Token>();
const from = Address.from('ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s');
const to = Address.from('AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx');
contract.transfer(from, to, 10);
```

#### `Hashable`

Types that can be hashed the various [`crypto`](/docs/smart-contract#crypto) functions.

#### `crypto`

Contains various cryptography functions.

##### `crypto#sha1`

Returns a `Buffer` of the SHA1 hash of the input

##### `crypto#sha256`

Returns a `Buffer` of the SHA256 hash of the input

##### `crypto#hash160`

Returns a `Buffer` of the SHA256 hash of the input

##### `crypto#hash256`

Returns a `Buffer` of the SHA256 hash of the SHA256 hash of the input.

#### `Transfer`

Represents a native [`Asset`](/docs/smart-contract#Asset) transfer.

##### `Transfer#amount`

The amount transferred.

##### `Transfer#asset`

The [`Hash256`](/docs/smart-contract#Hash256) of the [`Asset`](/docs/smart-contract#Asset) transferred.

##### `Transfer#to`

The desination [`Address`](/docs/smart-contract#Address) of the transfer.

#### `@send`

Marks a [`SmartContract`](/docs/smart-contract#SmartContract) method that verifies [`Asset`](/docs/smart-contract#Asset) transfers from the [`SmartContract`](/docs/smart-contract#SmartContract). Method must return a boolean indicating whether the [`SmartContract`](/docs/smart-contract#SmartContract) wishes to approve sending the transferred [`Asset`](/docs/smart-contract#Asset)s. Method can take the [`Transfer`](/docs/smart-contract#Transfer) as the final argument. See the [Native Assets](/docs/native-assets) chapter of the advanced guide for more information.

**Example:**

```typescript
export class Contract extends SmartContract {
  @send
  public withdraw(arg0: Address, arg1: Fixed<8>, transfer: Transfer): boolean {
    // Don't allow sending anything but NEO
    if (!transfer.asset.equals(Hash256.NEO)) {
      return false;
    }
    // Do some additional checks on the transfer.to and transfer.amount being sent and other arguments.
    return true;
  }
}
```

#### `@sendUnsafe`

Marks a [`SmartContract`](/docs/smart-contract#SmartContract) method that verifies [`Asset`](/docs/smart-contract#Asset) transfers from the [`SmartContract`](/docs/smart-contract#SmartContract). Method must return a boolean indicating whether the [`SmartContract`](/docs/smart-contract#SmartContract) wishes to approve sending the transferred [`Asset`](/docs/smart-contract#Asset)s.  Note that unlike [`@send`](/docs/smart-contract#@send), [`@sendUnsafe`](/docs/smart-contract#@sendUnsafe) does not use a two-phase send. Smart contract authors must implement their own logic for safely sending assets from the contract. May be used in combination with [`@receive`](/docs/smart-contract#@receive). See the [Native Assets](/docs/native-assets) chapter of the advanced guide for more information.

#### `@receive`

Marks a [`SmartContract`](/docs/smart-contract#SmartContract) method that verifies receiving [`Asset`](/docs/smart-contract#Asset)s to the [`SmartContract`](/docs/smart-contract#SmartContract). Method must return a boolean indicating whether the [`SmartContract`](/docs/smart-contract#SmartContract) wishes to receive the transferred [`Asset`](/docs/smart-contract#Asset)s. May be used in combination with [`@sendUnsafe`](/docs/smart-contract#@sendUnsafe). See the [Native Assets](/docs/native-assets) chapter of the advanced guide for more information.

#### `@claim`

Marks a [`SmartContract`](/docs/smart-contract#SmartContract) method that verifies GAS claims from the [`SmartContract`](/docs/smart-contract#SmartContract). Method must return a boolean indicating whether the [`SmartContract`](/docs/smart-contract#SmartContract) wishes to allow GAS to be claimed. May optionally take the [`ClaimTransaction`](/docs/smart-contract#ClaimTransaction) this [`SmartContract`](/docs/smart-contract#SmartContract) is executed in as the last argument. Accessing `Blockchain.currentTransaction` will result in an error. See the [Native Assets](/docs/native-assets) chapter of the advanced guide for more information.

#### `@constant`

Marks a [`SmartContract`](/docs/smart-contract#SmartContract) method as not modifying storage. See the [Methods](/docs/methods) chapter of the main guide for more information.

---

## Blockchain Data Types

[[toc-reference]]

---

#### `AttributeUsage`

[`Attribute`](/docs/smart-contract#Attribute) usage flag indicates the type of the data.

#### `Attribute`

[`Attribute`](/docs/smart-contract#Attribute)s are used to store additional data on [`Transaction`](/docs/smart-contract#Transaction)s. Most [`Attribute`](/docs/smart-contract#Attribute)s are used to store arbitrary data, whereas some, like [`AddressAttribute`](/docs/smart-contract#AddressAttribute), have specific uses in the NEO protocol.

##### `Attribute#usage`

[`AttributeUsage`](/docs/smart-contract#AttributeUsage) this [`Attribute`](/docs/smart-contract#Attribute) corresponds to.

##### `Attribute#data`

The data of the [`Attribute`](/docs/smart-contract#Attribute). [`Attribute`](/docs/smart-contract#Attribute) data is specialized by their `Attribute#usage` into [`BufferAttribute`](/docs/smart-contract#BufferAttribute), [`PublicKeyAttribute`](/docs/smart-contract#PublicKeyAttribute), [`AddressAttribute`](/docs/smart-contract#AddressAttribute), [`Hash256Attribute`](/docs/smart-contract#Hash256Attribute).

#### `BufferAttribute`

[`Attribute`](/docs/smart-contract#Attribute) whose `Attribute#data` is an arbitrary `Buffer`.

#### `PublicKeyAttribute`

[`Attribute`](/docs/smart-contract#Attribute) whose `Attribute#data` is a [`PublicKey`](/docs/smart-contract#PublicKey).

#### `AddressAttribute`

[`Attribute`](/docs/smart-contract#Attribute) whose `Attribute#data` is an [`Address`](/docs/smart-contract#Address).

#### `Hash256Attribute`

[`Attribute`](/docs/smart-contract#Attribute) whose `Attribute#data` is a [`Hash256`](/docs/smart-contract#Hash256).

#### `Output`

[`Output`](/docs/smart-contract#Output)s represent the destination [`Address`](/docs/smart-contract#Address) and amount transferred of a given [`Asset`](/docs/smart-contract#Asset). The sum of the unspent [`Output`](/docs/smart-contract#Output)s of an [`Address`](/docs/smart-contract#Address) represent the total balance of the [`Address`](/docs/smart-contract#Address).

##### `Output#address`

Destination [`Address`](/docs/smart-contract#Address).

##### `Output#asset`

[`Hash256`](/docs/smart-contract#Hash256) of the [`Asset`](/docs/smart-contract#Asset) that was transferred.

##### `Output#value`

Amount transferred.

#### `Input`

[`Input`](/docs/smart-contract#Input)s are a reference to an [`Output`](/docs/smart-contract#Output) of a [`Transaction`](/docs/smart-contract#Transaction) that has been persisted to the blockchain. The sum of the `value`s of the referenced [`Output`](/docs/smart-contract#Output)s is the total amount transferred in the [`Transaction`](/docs/smart-contract#Transaction).

##### `Input#hash`

[`Hash256`](/docs/smart-contract#Hash256) of the [`Transaction`](/docs/smart-contract#Transaction) this input references.

##### `Input#index`

[`Output`](/docs/smart-contract#Output) index within the [`Transaction`](/docs/smart-contract#Transaction) this input references.

#### `TransactionType`

Constants that specify the type of a [`Transaction`](/docs/smart-contract#Transaction).

#### `Transaction`

[`Transaction`](/docs/smart-contract#Transaction)s are persisted to the blockchain and represent various functionality like transferring first class [`Asset`](/docs/smart-contract#Asset)s or executing smart contracts.

**Example:**

```typescript
const transactionHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
const transaction = Transaction.for(transactionHash);
const transactionOutputs = transaction.outputs;
```

##### `Transaction.for(hash: Hash256): Transaction`

Returns the  [`Transaction`](/docs/smart-contract#Transaction) for the specified `hash`.

#### `TransactionBase`

Base interface for all [`Transaction`](/docs/smart-contract#Transaction)s.

##### `TransactionBase#hash`

[`Hash256`](/docs/smart-contract#Hash256) of this [`Transaction`](/docs/smart-contract#Transaction).

##### `TransactionBase#type`

`TransactionType` of the [`Transaction`](/docs/smart-contract#Transaction).

##### `TransactionBase#attributes`

[`Attribute`](/docs/smart-contract#Attribute)s attached to the [`Transaction`](/docs/smart-contract#Transaction).

##### `TransactionBase#outputs`

[`Output`](/docs/smart-contract#Output)s of the [`Transaction`](/docs/smart-contract#Transaction).

##### `TransactionBase#inputs`

[`Input`](/docs/smart-contract#Input)s of the [`Transaction`](/docs/smart-contract#Transaction).

##### `TransactionBase#references`

Corresponding [`Output`](/docs/smart-contract#Output)s for the [`Input`](/docs/smart-contract#Input)s of the [`Transaction`](/docs/smart-contract#Transaction).

##### `TransactionBase#unspentOutputs`

[`Output`](/docs/smart-contract#Output)s which have not been spent.

#### `MinerTransaction`

*extends*
  - [`TransactionBase`](/docs/smart-contract#TransactionBase)

First [`Transaction`](/docs/smart-contract#Transaction) in each [`Block`](/docs/smart-contract#Block) which contains the [`Block`](/docs/smart-contract#Block) rewards for the consensus node that produced the [`Block`](/docs/smart-contract#Block).

#### `IssueTransaction`

Issues new currency of a first-class [`Asset`](/docs/smart-contract#Asset).

#### `ClaimTransaction`

Claims GAS for a set of spent [`Output`](/docs/smart-contract#Output)s.

#### `EnrollmentTransaction` *deprecated*

Enrolls a new validator for a given [`PublicKey`](/docs/smart-contract#PublicKey).

#### `RegisterTransaction` *deprecated*

Registers a new first class [`Asset`](/docs/smart-contract#Asset).

#### `ContractTransaction`

[`Transaction`](/docs/smart-contract#Transaction) that transfers first class [`Asset`](/docs/smart-contract#Asset)s.

#### `StateTransaction`

Contains the state of votes.

#### `PublishTransaction` *deprecated*

Registers a new [`Contract`](/docs/smart-contract#Contract).

#### `InvocationTransaction`

[`Transaction`](/docs/smart-contract#Transaction) which runs a script in the NEO VM.

##### `InvocationTransaction#script`

Code that was executed in NEO VM.

#### `Account`

Balance and vote information for an [`Address`](/docs/smart-contract#Address).

**Example:**

```typescript
const address = Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
const account = Account.for(address);
const neoBalance = account.getBalance(Hash256.NEO);
```

##### `Account.for(address: Address): Account`

Returns the [`Account`](/docs/smart-contract#Account) for the specified `address`.

##### `Account#address`

[`Address`](/docs/smart-contract#Address) of this [`Account`](/docs/smart-contract#Account).

##### `Account#getBalance(asset: Hash256): Fixed8`

Retrieve the balance for a first class [`Asset`](/docs/smart-contract#Asset) based on its [`Hash256`](/docs/smart-contract#Hash256).

#### `AssetType`

Constants that specify the type of the [`Asset`](/docs/smart-contract#Asset).

#### `Asset`

Attributes of a first class asset. Smart contract authors will typically only interact with the NEO and GAS [`Asset`](/docs/smart-contract#Asset)s.

**Example:**

```typescript
const asset = Asset.for(Hash256.NEO);
const neoAmount = asset.amount;
```

##### `Asset.for(hash: Hash256): Asset`

Returns the [`Asset`](/docs/smart-contract#Asset) for the specified `hash`.

##### `Asset#hash`

[`Hash256`](/docs/smart-contract#Hash256) of this [`Asset`](/docs/smart-contract#Asset).

##### `Asset#type`

[`AssetType`](/docs/smart-contract#AssetType) of the [`Asset`](/docs/smart-contract#Asset)

##### `Asset#amount`

Total possible supply of the [`Asset`](/docs/smart-contract#Asset)

##### `Asset#available`

Amount currently available of the [`Asset`](/docs/smart-contract#Asset)

##### `Asset#precision`

Precision (number of decimal places) of the [`Asset`](/docs/smart-contract#Asset)

##### `Asset#owner`

Owner of the [`Asset`](/docs/smart-contract#Asset).

##### `Asset#admin`

Admin of the [`Asset`](/docs/smart-contract#Asset).

##### `Asset#issuer`

Issuer of the [`Asset`](/docs/smart-contract#Asset).

#### `Contract`

Attributes of a smart contract deployed to the blockchain.

**Example:**

```typescript
const contractAddress = Address.from('0xcef0c0fdcfe7838eff6ff104f9cdec2922297537');
const contract = Contract.for(contractAddress);
const contractScript = contract.script;
```

##### `Contract.for(address: Address): Contract | undefined`

Returns the [`Contract`](/docs/smart-contract#Contract) for the specified `address`. Returns `undefined` if a [`Contract`](/docs/smart-contract#Contract) does not exist at `address`.

##### `Contract#script`

[`Contract`](/docs/smart-contract#Contract) code.

##### `Contract#payable`

Flag that indicates if the [`Contract`](/docs/smart-contract#Contract) supports receiving [`Asset`](/docs/smart-contract#Asset)s.

#### `Header`

Attributes of a [`Block`](/docs/smart-contract#Block) persisted to the blockchain. [`Header`](/docs/smart-contract#Header) includes all information except the list of [`Transaction`](/docs/smart-contract#Transaction)s.

**Example:**

```typescript
const blockHash = Hash256.from('0xd6572a459b95d9136b7a713c5485ca709f9efa4f08f1c25dd792672d2bd75bfb');
const header = Header.for(blockHash);
```

##### `Header.for(hashOrIndex: Hash256 | Integer): Header`

Accepts either the [`Hash256`](/docs/smart-contract#Hash256) or the index of the [`Block`](/docs/smart-contract#Block). Returns the [`Header`](/docs/smart-contract#Header) for the specified `hashOrIndex`.

##### `Header#hash`

[`Block`](/docs/smart-contract#Block) hash.

##### `Header#version`

NEO blockchain version.

##### `Header#previousHash`

Previous [`Block`](/docs/smart-contract#Block) hash.

##### `Header#index`

[`Block`](/docs/smart-contract#Block) index.

##### `Header#merkleRoot`

Root of the [`Transaction`](/docs/smart-contract#Transaction) hash Merkle Tree.

##### `Header#time`

[`Block`](/docs/smart-contract#Block) time persisted.

##### `Header#nextConsensus`

Next consensus address.

#### `Block`

Attributes of a [`Block`](/docs/smart-contract#Block) persisted to the blockchain. Extends [`Header`](/docs/smart-contract#Header).

**Example:**

```typescript
const genesisBlock = Block.for(0);
```

##### `Block.for(hashOrIndex: Hash256 | Integer): Block`

Accepts either the [`Hash256`](/docs/smart-contract#Hash256) or the index of the [`Block`](/docs/smart-contract#Block). Returns the [`Block`](/docs/smart-contract#Block) for the specified `hashOrIndex`.

##### `Block#transactions`

[`Transaction`](/docs/smart-contract#Transaction)s contained in the [`Block`](/docs/smart-contract#Block).
