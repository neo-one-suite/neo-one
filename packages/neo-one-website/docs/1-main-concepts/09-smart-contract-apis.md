---
slug: smart-contract-apis
title: Smart Contract APIs
---
The generated smart contract client APIs correspond directly with the properties and methods of your smart contract.

The smart contract APIs are created at runtime based on the generated ABI in `one/generated/<ContractName>/abi.ts`. The exact structure of the ABI is not too important, we just need to understand what's happening at a high level. For every public property and method of your smart contract, a corresponding method is created on the smart contract object.

---

[[toc]]

---

## Properties

Each public property is translated to either a single method or two methods:

  - If the property is readonly, then it's translated to a method with the same name.
  - If the property is mutable, then it's translated to two methods. One that's named the same as the property and serves to fetch the current value. The other is named `set<PropertyName>` and serves to set the value of the property.

Let's take a look at an example:

```typescript
export class Contract extends SmartContract {
  public myValue = 'value';
  public constructor(public readonly owner = Deploy.senderAddress) {}
}
```

Then calling the generated helper method `createContractSmartContract`:

```typescript
const contract = createContractSmartContract(client);
```

would result in an object with three properties:

  - `owner(): Promise<AddressString>` - a method that returns a `Promise<AddressString>` which resolves to the current value of the `owner` property of the smart contract.
  - `myValue(): Promise<string>` - a method that returns a `Promise<string>` which resolves to the current value of the `myValue` property of the smart contract.
  - `setMyValue(value: string): Promise<TransactionResult>` a method which takes a `string` parameter to set as the current value of `myProperty` and that returns a `Promise` that resolves to a `TransactionResult` object. We'll talk more about the `TransactionResult` type in the next section.

Notice how the smart contract client APIs correspond directly with the properties defined in the smart contract. The main difference is that reading properties requires an asynchronous action - we need to make a request to a node to determine the current value. Thus, the methods return a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) which will resolve to a value with the type of the property.

`setMyValue` works the same as a normal instance method, which we'll cover in the next section.

---

## Methods

Recall that the smart contract methods we've seen thus far in this guide come in two forms, normal instance methods and constant instance methods - designated by the `@constant` decorator.

### Constant

Constant methods correspond 1:1 with generated methods on the smart contract API object. Given the following contract:

```typescript
export class Contract extends SmartContract {
  @constant
  public balanceOf(address: Address): Fixed<8> {
    return 0;
  }
}
```

The generated helper method `createContractSmartContract` will return an object with one property:

  - `balanceOf(value: AddressString): Promise<BigNumber>` - a method that returns a `Promise<BigNumber>` which resolves to the result of calling `balanceOf` on the smart contract with the provided `address`.

Later in this chapter we'll provide a type conversion table that elaborates how types are converted from the smart contract APIs to the client APIs.

### Normal

Unlike constant methods and reading property values, normal methods require submitting a transaction to the blockchain for processing. The NEO•ONE client APIs model this with a 2 step process:

  1. Construct and relay the transaction to the blockchain.
  2. Wait for the transaction to be confirmed.

Given the following smart contract:

```typescript
export class Contract extends SmartContract {
  public transfer(from: Address, to: Address, amount: Fixed<8>): boolean {
    return true;
  }
}
```

The smart contract object returned by `createContractSmartContract` will contain one property:

```typescript
transfer(from: AddressString, to: AddressString, amount: Fixed<8>): Promise<TransactionResult<InvokeReceipt<boolean, ContractEvent>, InvocationTransaction>>
```

Calling this method corresponds to the first step in the process. The `Promise` will resolve once the transaction has been relayed to the blockchain. The `TransactionResult` object contains two properties:

```typescript
interface TransactionResult<
  TTransactionReceipt extends TransactionReceipt,
  TTransaction extends Transaction
> {
  readonly transaction: TTransaction;
  readonly confirmed: (
    options?: GetOptions,
  ) => Promise<TTransactionReceipt>;
}
```

The `transaction` property contains the relayed transaction object. In the above case it will be an `InvocationTransaction` since all normal smart contract methods correspond to relaying an `InvocationTransaction` which invokes the method.

The `confirmed` method corresponds to the second step of the process. Calling `confirmed` returns a `Promise` which resolves once the transaction has been confirmed on and permanently persisted to the blockchain. The `Promise` resolves to a "receipt" of this confirmation. Every transaction receipt contains at least three properties:

```typescript
interface TransactionReceipt {
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
```

Normal instance method invocations return a special receipt called an `InvokeReceipt` which contains additional information:

```typescript
interface InvokeReceipt<
  TReturn extends Return,
  TEvent extends Event<string, any>
> extends TransactionReceipt {
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
   * The original, unprocessed, raw invoke receipt. The `RawInvokeReceipt` is transformed into this object (the `InvokeReceipt`) using the ABI to parse out the events and transaction result.
   */
  readonly raw: RawInvokeReceipt;
}
```

The `result` property indicates success or failure based on the `state` property of the object - either `'HALT'` for success, or `'FAULT'` for failure. On success, the return value of the invocation is stored in the `value` property of the object. On failure, a descriptive message of the reason why the transaction failed is stored in the `message` property.

```typescript
interface InvocationResultBase {
  /**
   * GAS consumed by the operation. This is the total GAS consumed after the free GAS is subtracted.
   */
  readonly gasConsumed: BigNumber;
  /**
   * The total GAS cost before subtracting the free GAS.
   */
  readonly gasCost: BigNumber;
}

interface InvocationResultSuccess<TValue> extends InvocationResultBase {
  /**
   * Indicates a successful invocation
   */
  readonly state: 'HALT';
  /**
   * The return value of the invocation.
   */
  readonly value: TValue;
}

interface InvocationResultError extends InvocationResultBase {
  /**
   * Indicates a failed invocation
   */
  readonly state: 'FAULT';
  /**
   * Failure reason.
   */
  readonly message: string;
}
```

Both success and failure contain properties which contain the total GAS consumed and cost.

Putting this all together, a common pattern for invoking smart contract methods is the following:

```typescript
// Indicate in the UI that the transaction is being relayed.

const result = await contract.transfer(from, to, amount);

// Indicate in the UI that we're waiting for confirmation
// and process the transaction that was relayed
const transaction = result.transaction

const receipt = await result.confirmed();
if (receipt.result.state === 'FAULT') {
  // Handle the failure, possibly processing the error message for display in the UI
} else {
  // Do something with the result of the call
  const value = receipt.result.value;
  // Do something with the emitted events
  const events = receipt.events;
}
```

### Confirmed Transaction Shortcut

Every normal instance method also contains a `confirmed` property which is a shortcut for the above process. The `Promise` it returns instead resolves once the transaction is both relayed and confirmed:

```typescript
// Indicate in the UI that the transaction is being processed (both relayed and confirmed).

const result = await contract.transfer.confirmed(from, to, amount);

// Process the transaction that was relayed AND confirmed
const transaction = receipt.transaction

if (receipt.result.state === 'FAULT') {
  // Handle the failure, possibly processing the error message for display in the UI
} else {
  // Do something with the result of the call
  const value = receipt.result.value;
  // Do something with the emitted events
  const events = receipt.events;
}
```

The only difference is the `Promise` resolves with an additional property, `transaction`, on the receipt object that contains the `Transaction` that was relayed and confirmed.

---

## Common Properties

In addition to the generated methods mentioned above, the smart contract object contains a few common properties:

```typescript
interface SmartContract<
  TClient extends Client,
  TEvent extends Event<string, any>
> {
  /**
   * The `SmartContractDefinition` that generated this `SmartContract` object.
   */
  readonly definition: SmartContractDefinition;
  /**
   * The underlying `Client` used by this `SmartContract`.
   */
  readonly client: TClient;
  /**
   * Iterate over the events emitted by the smart contract.
   *
   * @returns an `AsyncIterable` over the events emitted by the smart contract.
   */
  readonly iterEvents: (options?: SmartContractIterOptions) => AsyncIterable<TEvent>;
  /**
   * Iterate over the logs emitted by the smart contract.
   *
   * @returns an `AsyncIterable` over the logs emitted by the smart contract.
   */
  readonly iterLogs: (options?: SmartContractIterOptions) => AsyncIterable<Log>;
  /**
   * Iterate over the events and logs emitted by the smart contract.
   *
   * @returns an `AsyncIterable` over the events and logs emitted by the smart contract.
   */
  readonly iterActions: (options?: SmartContractIterOptions) => AsyncIterable<Action>;
  /**
   * Converts a `RawAction`, typically from the raw results found in a `Block` to a processed `Action` or `undefined` if the action is not recognized by the ABI.
   *
   * @returns `Action` if the `action` parameter is recognized by the `ABI` of the smart contract, `undefined` otherwise.
   */
  readonly convertAction: (action: RawAction) => Action | undefined;
}
```

Let's go through each in more detail.

`definition` is simply the `SmartContractDefinition` that generated the smart contract API object. This is the object created by the automatically generated helper method in `one/contracts/<ContractName>/contract.ts`. This is most commonly used to get the current `Address` of the smart contract we're interacting with:

```typescript
const network = client.getCurrentNetwork();
const tokenAddress = token.definition.networks[network].address;
```

`client` is the `Client` that was used to create the smart contract API object, and is the underlying client used for all smart contract operations.

`iterEvents` returns an `AsyncIterable` which allows for [asynchronous iteration](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#async-iteration) over all of the events emitted by the smart contract:

```typescript
for await (const event of contract.iterEvents()) {
  // Do something with each event
}
```

`iterLogs` is the same as `iterEvents` but for log notifications, i.e. unstructured strings. Note that NEO•ONE smart contracts intentionally do not support nor emit log events because any time you might want to emit a log event, we believe it's more future-proof to emit a structured event. However, when integrating with external contracts, you may want to iterate over the logs that it emits.

`iterActions` is simply an `AsyncIterable` over both the events and logs of the smart contract in the order that they were seen.

All of the `iter` methods accept a `SmartContractIterOptions` object:

```typescript
/**
 * Additional optional options for methods that read data from a smart contract.
 */
export interface SmartContractReadOptions {
  /**
   * The network to read the smart contract data for. By default this is the network of the currently selected user account.
   */
  readonly network?: NetworkType;
  /**
   * The `Monitor` to use for tracking all asynchronous calls made in the process of pulling data.
   */
  readonly monitor?: Monitor;
}

/**
 * Filter that specifies (optionally) a block index to start at and (optionally) a block index to end at.
 */
export interface BlockFilter {
  /**
   * The inclusive start index for the first block to include. Leaving `undefined` means start from the beginning of the blockchain, i.e. index 0.
   */
  readonly indexStart?: number;
  /**
   * The exclusive end index for the block to start at. Leaving `undefined` means continue indefinitely, waiting for new blocks to come in.
   */
  readonly indexStop?: number;
}

/**
 * Additional optional options for methods that iterate over data from a smart contract.
 */
export interface SmartContractIterOptions extends SmartContractReadOptions, BlockFilter {}
```

The `SmartContractIterOptions` object allows specifying the `network` to iterate over and the iteration parameters, which block to start from and which block to end at.

`convertAction` takes a `RawAction` and converts it using the ABI of the smart contract. This conversion includes parsing out the relevant events and automatically converting the raw parameters. See the [Raw Client APIs](/docs/raw-client-apis) documentation for more details.

::: warning

Tip

Read more about asynchronous iteration [here](http://2ality.com/2016/10/asynchronous-iteration.html)

:::

---

## Type Conversion Table

Smart Contract Type | Client API Type | Notes
--------------------|-----------------|--------
boolean             | boolean         |
string              | string          |
number              | BigNumber       |
Fixed<N>            | BigNumber       | Value is automatically converted to a BigNumber with N decimal places.
Buffer              | BufferString    | Hex encoded byte array
Address             | AddressString   | Base58 encoded NEO address
Hash256             | Hash256String   | Hex encoded string prefixed by '0x'
PublicKey           | PublicKeyString | Hex encoded string
Array<T>            | Array<T>        |
Map<K, V>           | Map<K, V>       |
Object              | Object          | Object values are follow the same conversions as above


Here are some examples of each of the types in the front-end:

 Client API Type | Example
-----------------|---------
 boolean         | `true`
 string          | `'hello world'`
 BigNumber       | `new BigNumber(10)`
 BigNumber       | `new BigNumber(10)`
 BufferString    | `'02028a'`
 AddressString   | `'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR'`
 Hash256String   | `'0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c'`
 PublicKeyString | `'02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef'`
 Array<T>        | `[0, 1, 2]`
 Map<K, V>       | `new Map().set('hello', 'world');`
 Object          | `{ key: 'value' }`
