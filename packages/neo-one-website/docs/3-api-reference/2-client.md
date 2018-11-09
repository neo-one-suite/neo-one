---
slug: client
title: \@neo-one/client
---
# @neo-one/client

`@neo-one/client` contains the NEO•ONE client APIs.

This reference uses dot syntax to indicate static properties and `#` to indicate instance properties. For example:

  - `Foo.bar` is the static property `bar` on the value `Foo`.
  - `Foo#bar` is the property `bar` on an instance of `Foo`.

---

[[toc]]

---

## Client

[[toc-reference]]

---

#### `Client`

Main entrypoint to the `@neo-one/client` APIs. The `Client` class abstracts away user accounts and even how those accounts are provided to your dapp, for example, they might come from an extension like NEX, dapp browser like nOS or through some other integration. See the [Client APIs](https://neo-one.io/docs/client-apis) chapter of the main guide for more information.

##### `Client#hooks`

Hook into the lifecycle of various requests. Can be used to automatically add logging, or parameter transformations across the application, for example.

##### `Client#currentUserAccount$`

Emits a value whenever a new list of user accounts is available. Immediately emits the latest value when subscribed to.

##### `Client#userAccounts$`

Emits a value whenever a new network is selected. Immediately emits the latest value when subscribed to.

##### `Client#currentNetwork$`

Emits a value whenever a new network is selected. Immediately emits the latest value when subscribed to.

##### `Client#networks$`

Emits a value whenever a new list of networks user account is available. Immediately emits the latest value when subscribed to.

##### `Client#blocks$`

Emits a value whenever a block is persisted to the blockchain. Immediately emits the latest block/network when subscribed to.

##### `Client#accountState$`

Emits a value whenever a new user account is selected and whenever a block is persisted to the blockchain. Immediately emits the latest value when subscribed to.

##### `Client#providers`

The configured `UserAccountProvider`s for this `Client` instance.

##### `Client#getUserAccount`

```typescript
interface Client {
  readonly getUserAccount: (idIn: UserAccountID) => UserAccount;
}
```

Get the details of the `UserAccount` for a given `UserAccountID`. @returns `UserAccount` or throws an `UnknownAccountError` if one could not be found.

##### `Client#selectUserAccount`

```typescript
interface Client {
  readonly selectUserAccount: (idIn?: UserAccountID) => Promise<void>;
}
```

Sets a `UserAccountID` as the currently selected `UserAccountID`.

##### `Client#selectNetwork`

```typescript
interface Client {
  readonly selectNetwork: (networkIn: NetworkType) => Promise<void>;
}
```

Sets a `NetworkType` as the currently selected `NetworkType`.

##### `Client#getSupportFeatures`

```typescript
interface Client {
  readonly getSupportedFeatures: (idIn: UserAccountID) => Promise<UserAccountFeatures>;
}
```

@returns `Promise` which resolves to the `UserAccountFeatures` supported by the given `UserAccountID`.

##### `Client#deleteUserAccount`

```typescript
interface Client {
  readonly deleteUserAccount: (idIn: UserAccountID) => Promise<void>;
}
```

Deletes the `UserAccountID` from its underlying provider. Throws an `DeleteUserAccountUnsupportedError` if the operation is unsupported. Users should check `getSupportedFeatures` before calling this method.

##### `Client#updateUserAccountName`

```typescript
interface Client {
  readonly updateUserAccountName: (options: UpdateAccountNameOptions) => Promise<void>;
}
```

Updates the name of the `UserAccountID` in the underlying provider. Throws an `UpdateUserAccountUnsupportedError` if the operation is unsupported. Users should check `getSupportedFeatures` before calling this method.

##### `Client#getCurrentUserAccount`

```typescript
interface Client {
  readonly getCurrentUserAccount: () => UserAccount | undefined;
}
```

@returns the currently selected `UserAccount` or `undefined` if there are no `UserAccount`s.

##### `Client#getCurrentNetwork`

```typescript
interface Client {
  readonly getCurrentNetwork: () => NetworkType;
}
```

@returns the currently selected `NetworkType`.

##### `Client#getUserAccounts`

```typescript
interface Client {
  readonly getUserAccounts: () => ReadonlyArray<UserAccount>;
}
```

@returns a list of all available `UserAccount`s.

##### `Client#getNetworks`

```typescript
interface Client {
  readonly getNetworks: () => ReadonlyArray<NetworkType>;
}
```

@returns a list of all available `NetworkType`s.

##### `Client#smartContract`

```typescript
interface Client {
  readonly smartContract<T extends SmartContract<any, any> = SmartContractAny>: (definition: SmartContractDefinition) => T;
}
```

Constructs a `SmartContract` instance for the provided `definition` backed by this `Client` instance.

##### `Client#transfer`

```typescript
interface Client {
  readonly transfer: (
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
    ) => Promise<TransactionResult<TransactionReceipt, InvocationTransaction>>;
}
```

Transfer native assets in the specified amount(s) to the specified Address(es). Accepts either a single transfer or an array of transfer objects. Note that we use an `InvocationTransaction` for transfers in order to reduce the overall bundle size since they can be used equivalently to `ContractTransaction`s. @returns `Promise<TransactionResult<TransactionReceipt, InvocationTransaction>>`.

##### `Client#claim`

```typescript
interface Client {
  readonly claim: (optionsIn?: TransactionOptions) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
}
```

Claim all available unclaimed `GAS` for the currently selected account (or the specified `from` `UserAccountID`).

##### `Client#getAccount`

```typescript
interface Client {
  readonly getAccount: (id: UserAccountID) => Promise<Account>;
}
```

@returns `Promise` which resolves to an `Account` object for the provided `UserAccountID`.


#### `UpdateAccountNameOptions`

Options for the `UserAccountProvider#updateAccountName` method.

##### `UpdateAccountNameOptions#id`

`UserAccountID` of the `UserAccount` to update.

##### `UpdateAccountNameOptions#name`

New name of the `UserAccount`.

##### `UpdateAccountNameOptions#monitor`

Optional `Monitor` for any logging that occurs during the update process.

#### `UserAccountProvider`

`UserAccountProvider`s power `Client` instances. Multiple `UserAccountProvider`s may be provided, and the `Client` abstracts over them to provide a common layer of functionality independent of the underlying `UserAccountProvider`s.

##### `UserAccountProvider#currentUserAccount$`

An `Observable` that emits the currently selected `UserAccount`.

##### `UserAccountProvider#userAccounts$`

An `Observable` that emits the available `UserAccount`s.

##### `UserAccountProvider#networks$`

An `Observable` that emits the available networks this `UserAccountProvider` knows how to function with.

##### `UserAccountProvider#getCurrentUserAccount`

```typescript
interface UserAccountProvider {
  readonly getCurrentUserAccount: () => UserAccount | undefined;
}
```

Returns the currently selected `UserAccount` or `undefined` if one is not selected.

##### `UserAccountProvider#getUserAccounts`

```typescript
interface UserAccountProvider {
  readonly getUserAccounts: () => ReadonlyArray<UserAccount>;
}
```

Returns the available `UserAccount`s.

##### `UserAccountProvider#getNetworks`

```typescript
interface UserAccountProvider {
  readonly getNetworks: () => ReadonlyArray<NetworkType>;
}
```

Returns the available networks this `UserAccountProvider` knows how to function with.

##### `UserAccountProvider#selectUserAccount`

```typescript
interface UserAccountProvider {
  readonly selectUserAccount: (id?: UserAccountID) => Promise<void>;
}
```

Set the given `UserAccountID` as the selected `UserAccount`. If the `UserAccountProvider` does not support programatically selecting a `UserAccountID`, it should only ever expose one available `UserAccount` and manage selecting other `UserAccount`s outside of the application.

##### `UserAccountProvider#deleteUserAccount`

```typescript
interface UserAccountProvider {
  readonly deleteUserAccount?: (id: UserAccountID) => Promise<void>;
}
```

Optional support for deleting a `UserAccount`.

##### `UserAccountProvider#updateUserAccountName`

```typescript
interface UserAccountProvider {
  readonly updateUserAccountName?: (options: UpdateAccountNameOptions) => Promise<void>;
}
```

Optional support for updating the name of a `UserAccount`.

##### `UserAccountProvider#getBlockCount`

```typescript
interface UserAccountProvider {
  readonly getBlockCount: (network: NetworkType, monitor?: Monitor) => Promise<number>;
}
```

Returns the current `Block` height.

##### `UserAccountProvider#getAccount`

```typescript
interface UserAccountProvider {
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
}
```

Returns `Account` for the specified network and address. Note that the provided network and address may not correspond to one of the available `UserAccount`s.

##### `UserAccountProvider#iterBlocks`

```typescript
interface UserAccountProvider {
  readonly iterBlocks: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<Block>;
}
```

Returns `AsyncIterable` of `Block`s on the argument `network`.

##### `UserAccountProvider#iterActionsRaw`

```typescript
interface UserAccountProvider {
  readonly iterActionsRaw?: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<RawAction>;
}
```

While this method could be implemented simply as a function of `iterBlocks`, `iterActionsRaw` is provided in case the `UserAccountProvider` has a more efficient way of iterating over actions. Returns `AsyncIterable` over all actions emitted by the given `network`, filtered by the given `filter`.

##### `UserAccountProvider#transfer`

```typescript
interface UserAccountProvider {
  readonly transfer: (
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ) => Promise<TransactionResult<TransactionReceipt, InvocationTransaction>>;
}
```

Transfers native assets.

##### `UserAccountProvider.claim`

```typescript
interface UserAccountProvider {
  readonly claim: (options?: TransactionOptions) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
}
```

Claim all claimable GAS.

##### `UserAccountProvider#invoke`

```typescript
interface UserAccountProvider {
  readonly invoke: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options?: InvokeSendUnsafeReceiveTransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Invoke the specified `method` with the given `params` on `contract`. `paramsZipped` contains the original parameters before processing with the ABI and are typically suitable for displaying to a user. `verify` will be true if the transaction should trigger verification for the `contract`. `options` may specify additional native asset transfers to include with the transaction (either to or from the contract address).

##### `UserAccountProvider#invokeSend`

```typescript
interface UserAccountProvider {
  readonly invokeSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    transfer: Transfer,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Relays a transaction that is the first step of a two-step send process. The `Transfer`'s `to` property represents the ultimate destination of the funds, but this transaction will be constructed such that those funds are marked for transfer, not actually transferred. Otherwise, parameters are the same as `invoke`.

##### `UserAccountProvider#invokeCompleteSend`

```typescript
interface UserAccountProvider {
  readonly invokeCompleteSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Relays a transaction that is the second step of a two-step send process. The `hash` is the transaction hash of the first step in the process and is used to determine the amount to transfer to the `from` address. Otherwise, parameters are the same as `invoke`.

##### `UserAccountProvider#invokeRefundAssets`

```typescript
interface UserAccountProvider {
  readonly invokeRefundAssets: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Refunds native assets that were not processed by the contract. The `hash` is the transaction hash that should be refunded and is used to construct the transfers for this transaction. Otherwise, parameters are the same as `invoke`.

##### `UserAccountProvider#invokeClaim`

```typescript
interface UserAccountProvider {
  readonly invokeClaim: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
}
```

Claims GAS. Currently only supports claiming all unclaimed GAS to the contract address. Otherwise, parameters are the same as `invoke`.

##### `UserAccountProvider#call`

```typescript
interface UserAccountProvider {
  readonly call: (
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ) => Promise<RawCallReceipt>;
}
```

Invokes the constant `method` on `contract` with `params` on `network`.

#### `UserAccountProviders`

An object of `UserAccountProvider`s.

#### `UserAccountProviders#[type: string]`

Key index may be arbitrary and is primarily intended to allow for a more specific `Client` TypeScript type to enable direct access to the underlying providers, if needed.

#### `AddressString`

Base58 encoded string that represents a NEO address. Also accepts Hash160 strings (hex encoded string prefixed by '0x') when used as a parameter to a NEO•ONE function. Always the base58 encoded string form when returned from a NEO•ONE function.

 **Example:**

```typescript
// base58 encoded string
'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR'
// hash160 string
'0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9'
```

#### `Hash256String`

Hex encoded string prefixed by '0x' that represents a NEO 256 bit hash. Examples of `Hash256String` include `Block` hashes and `Transaction` hashes.

 **Example:**

```typescript
'0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c'
```

#### `PublicKeyString`

Hex encoded string that represents a public key.

 **Example:**

```typescript
'02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef'
```

#### `PrivateKeyString`

WIF strings that represents a private key. Also accepts hex encoded strings when used as a parameter to a NEO•ONE function. Always a WIF string when returned from a NEO•ONE function.

 **Example:**

```typescript
// wif string
'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g'
// hex encoded string
'9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69'
```
#### `SignatureString`

Hex encoded string that represents a signature for a message.

 **Example:**

```typescript
'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67'
```

#### `BufferString`

Hex encoded string that represents a buffer.

 **Example:**

```typescript
'908d323aa7f92656a77ec26e8861699ef'
```

#### `UserAccount`

`UserAccount` is the base abstraction on which all of the @neo-one/client APIs work with.

##### `UserAccount#id`

Uniquely identifies a `UserAccount` by its address and the network its used on.

##### `UserAccount#name`

The name to use when displaying this account in a user-facing UI. Can be a user configured name or just the address.

##### `UserAccount#publicKey`

The public key for the address.

#### `UserAccountID`

Uniquely identifies a `UserAccount` by its address and the network its used on.

##### `UserAccountID#network`

Network that this address is used on.

##### `UserAccountID#address`

The NEO address.

#### `NetworkType`

Implementation defined string for selecting the network to use. `'main'` refers to the NEO MainNet and `'test'` refers to the NEO TestNet. `'local'` is typically used to indicate a local development network.

```typescript
type NetworkType =
  | 'main'
  | 'test'
  | string;
```

#### `Transfer`

Represents a transfer of native assets.

##### `Transfer#amount`

Amount to be transferred.

##### `Transfer#asset`

`Hash256` in string format of the native `Asset` to transfer.

##### `Transfer#to`

Destination address.

#### `GetOptions`

Common options for operations that fetch data from the blockchain.

##### `GetOptions#timeoutMS`

Time in milliseconds before timing out the operation.

##### `GetOptions#monitor`

`Monitor` to use for all logging of the operation.

#### `BlockFilter`

Filter that specifies (optionally) a block index to start at and (optionally) a block index to end at.

##### `BlockFilter#indexStart`

The inclusive start index for the first block to include. Leaving `undefined` means start from the beginning of the blockchain, i.e. index 0.

##### `BlockFilter#indexStop`

The exclusive end index for the block to start at. Leaving `undefined` means continue indefinitely, waiting for new blocks to come in.

##### `BlockFilter#monitor`

The `Monitor` to use for tracking all asynchronous calls made in the process of pulling data.

#### `TransactionOptions`

Common options for all methods in the client APIs that create transactions.

##### `TransactionOptions#from`

The `UserAccount` that the transaction is "from", i.e. the one that will be used for native asset transfers, claims, and signing the transaction. If unspecified, the currently selected `UserAccount` is used as the `from` address. DApp developers will typically want to leave this unspecified.

##### `TransactionOptions#attributes`

Additional attributes to include with the transaction.

##### `TransactionOptions#networkFee`

An optional network fee to include with the transaction.

##### `TransactionOptions#systemFee`

A maximum system fee to include with the transaction. Note that this is a maximum, the client APIs will automatically calculate and add a system fee to the transaction up to the value specified here. Leaving `systemFee` `undefined` is equivalent to `new BigNumber(0)`, i.e. no system fee. A `systemFee` of `-1`, i.e. `new BigNumber(-1)` indicates no limit on the fee. This is typically used only during development.

##### `TransactionOptions#monitor`

The `Monitor` to use for tracking and logging all asynchronous calls made during the transaction.

#### `TransactionReceipt`

Receipt of a confirmed `Transaction` which contains data about the confirmation such as the `Block` index and the index of the `Transaction` within the block.

##### `TransactionReceipt#blockIndex`

`Block` index of the `Transaction` for this receipt.

##### `TransactionReceipt#blockHash`

`Block` hash of the `Transaction` for this receipt.

##### `TransactionReceipt#transactionIndex`

Transaction index of the `Transaction` within the `Block` for this receipt.

#### `TransactionResult`

The result of a successful relay of a `Transaction`.

##### `TransactionResult#transaction`

`Transaction` that was relayed.

##### `TransactionResult#confirmed`

```typescript
interface TransactionResult {
  readonly confirmed: (options?: GetOptions) => Promise<TTransactionReceipt>;
}
```

Waits for the `Transaction` to be confirmed on the blockchain. @returns `Promise` that resolves when the `Transaction` has been confirmed, resolving to the confirmation receipt.

#### `NetworkSettings`

Constant settings used to initialize the client APIs.

##### `NetworkSettings#issueGASFee`

---

## UserAccountProvider

[[toc-reference]]

---

#### `LocalUserAccountProvider`

Implements `UserAccountProvider` using a `KeyStore` instance and a `Provider` instance. See the [LocalUserAccountProvider](https://neo-one.io/docs/user-accounts#LocalUserAccountProvider) section of the advanced guide for more details.

#### `LocalKeyStore`

`LocalKeyStore` implements the `KeyStore` interface expected by `LocalUserAccountProvider` via an underlying `Store` implementation.

#### `LocalMemoryStore`

Dummy implementation of the `LocalStore` interface which causes the `LocalKeyStore` to be entirely in-memory.

#### `LocalStringStore`

Implements the `LocalStore` interface expected by `LocalKeyStore`.

#### `UnlockedWallet`

Wallet in the "unlocked" state.

##### `UnlockedWallet#type`

`type` differentiates an `UnlockedWallet` from other `LocalWallet`s, i.e. an `LockedWallet`

##### `UnlockedWallet#account`

`UserAccount` this `UnlockedWallet` refers to.

##### `UnlockedWallet#privateKey`

Private key for this `UnlockedWallet`.

##### `UnlockedWallet#nep2`

NEP-2 encrypted key of this `UnlockedWallet`. `undefined` if the `privateKey` has never been encrypted.

#### `LockedWallet`

Wallet in the "locked" state.

##### `LockedWallet#type`

`type` differentiates a `LockedWallet` from other `LocalWallet`s, i.e. an `UnlockedWallet`.

##### `LockedWallet#account`

`UserAccount` this `LockedWallet` refers to.

##### `LockedWallet#nep2`

NEP-2 encrypted key of this `LockedWallet`.

#### `LocalWallet`

Locally stored wallet that is either in a `'locked'` or `'unlocked'` state (`type`).

#### `NEOONEDataProvider`

Implements the methods required by the `NEOONEProvider` as well as the `DeveloperProvider` interface using a NEO•ONE node.

#### `NEOONEDataProviderOptions`

#### `NEOONEOneDataProvider`

Implements the methods required by the `NEOONEProvider` as well as the `DeveloperProvider` interface using a NEO•ONE node that is looked up through the local NEO•ONE `projectID`.

#### `NEOONEProvider`

Implements the `Provider` interface expected by a `LocalUserAccountProvider` using a NEO•ONE node.

#### `Peer`

Peers connected to the node.

#### `JSONRPCProvider`

Base interface for handling `JSONRPCRequest`s and returning `JSONRPCResponse`s.

#### `JSONRPCRequest`

jsonrpc request object.

##### `JSONRPCRequest#method`

Method to be invoked.

##### `JSONRPCRequest#params`

Invocation params.

##### `JSONRPCRequest#watchTimeoutMS`

How long to leave the request open (i.e. long-polling) to wait for a result for given `method` and `params`.

#### `JSONRPCResponse`

jsonrpc response object.

#### `RelayTransactionResult`

Raw result of relaying a `Transaction`. Further consumed and processed by `LocalUserAccountProvider` and `ABI`.

##### `RelayTransactionResult#transaction`

Relayed `Transaction`.

##### `RelayTransactionResult#verifyResult`

Verification result.

#### `VerifyTransactionResult`

Interface which describes the result of verification invocation.

##### `VerifyTransactionResult#verifications`

All verifications that happened during the relay of the `Transaction`.

#### `VerifyScriptResult`

An individual verification and the associated data.

##### `VerifyScriptResult#failureMessage`

`undefined` if the verification passed, otherwise a message that describes the failure.

##### `VerifyScriptResult#address`

The smart contract this result is associated with.

##### `VerifyScriptResult#witness`

The specific `Witness` that was checked.

##### `VerifyScriptResult#actions`

The actions emitted during the verification.

---

## Smart Contract

[[toc-reference]]

---

#### `SmartContract<TClient extends Client, TEvent extends Event>`

An object representing a smart contract defined by the `definition` property, in particular, the `ABI` of the definition.

##### `SmartContract#definition`

The `SmartContractDefinition` that generated this `SmartContract` object.

##### `SmartContract#client`

The underlying `Client` used by this `SmartContract`.

##### `SmartContract#iterEvent(options?: SmartContractIterOptions): AsyncIterable<TEvent>`

Iterate over the events emitted by the smart contract.

##### `SmartContract#iterLogs(options?: SmartContractIterOptions): AsyncIterable<Log>`

Iterate over the logs emitted by the smart contract.

##### `SmartContract#iterActions(options?: SmartContractIterOptions): AsyncIterable<Action>`

Iterate over the events and logs emitted by the smart contract.

##### `SmartContract#convertAction(action: RawAction): Action | undefined`

Converts a `RawAction`, typically from the raw results found in a `Block` to a processed `Action` or `undefined` if the action is not recognized by the ABI.

#### `SmartContractReadOptions`

Additional optional options for methods that read data from a smart contract.

##### `SmartContractReadOptions#network`

The network to read the smart contract data for. By default this is the network of the currently selected user account.

#### `SmartContractIterOptions`

*extends:*
  - `SmartContractReadOptions`

Additional optional options for methods that iterate over data from a smart contract.

##### `SmartContractIterOptions#filter`

Filters the iterated events and/or logs to those that match the provided `BlockFilter` object.

#### `SmartContractDefinition`

Used to generate the smart contract APIs.

##### `SmartContractDefinition#networks`

Configuration for the smart contract by network.

##### `SmartContractDefinition#abi`

`ABI` of the smart contract

##### `SmartContractDefinition#sourceMaps`

`SourceMaps` associated with the smart contract.

#### `SmartContractNetworkDefinition`

Configuration for the smart contract by network.

##### `SmartContractNetworkDefinition#[networkType: string]`

Network specific smart contract configuration

#### `SmartContractNetworkDefinition`

Network specific smart contract configuration

##### `SmartContractNetworkDefinition#address`

`AddressString` of the smart contract on the network.

#### `Param`

```typescript
type Param =
  | undefined
  | BigNumber
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ReadonlyArray<Param>
  | ReadonlyMap<Param, Param>
  | { [prop: string]: Param }
  | ForwardValue;
```

Valid parameter types for a smart contract function.

#### `Return`

```typescript
type Return =
  | undefined
  | BigNumber
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ReadonlyArray<Return>
  | ReadonlyMap<Return, Return>
  | { [key: string]: Return }
  | ContractParameter;
```

Possible return types for a smart contract method.

#### `InvocationResult`

```typescript
type InvocationResult<TValue> = InvocationResultSuccess<TValue> | InvocationResultError
```

The result of a smart contract method invocation.

#### `InvocationResultBase`

Common `InvocationResult` properties.

##### `InvocationResultBase#gasConsumed`

GAS consumed by the operation. This is the total GAS consumed after the free GAS is subtracted.

##### `InvocationResultBase#gasCost`

The total GAS cost before subtracting the free GAS.

#### `InvocationResultSuccess<TValue>`

*extends:*
  - `InvocationResultBase`

Result of a successful invocation.

##### `InvocationResultSuccess#state`

Indicates a successful invocation. Always equals `'HALT'`.

##### `InvocationResultSuccess#value`

The return value of the invocation.

#### `InvocationResultError`

Result of a failed invocation.

##### `InvocationResultError#state`

Indicates a failed invocation. Always equals `'FAULT'`

##### `InvocationResultError#message`

Failure reason.

#### `InvokeReceipt<TReturn extends Return, TEvent extends Event>`

*extends:*
  - `TransactionReceipt`

The receipt for a smart contract method invocation.

##### `InvokeReceipt#result`

The result of the invocation.

##### `InvokeReceipt#events`

The events emitted by the smart contract during the invocation.

#### `InvokeReceipt#logs`

The logs emitted by the smart contract during the invocation.

#### `InvokeReceipt#raw`

The original, unprocessed, `RawInvokeReceipt`. The `RawInvokeReceipt` is transformed into this object (the `InvokeReceipt`) using the `ABI` to parse out the `Event`s and `InvocationResult`.

#### `InvokeReceiveTransactionOptions`

*extends:*
  - `TransactionOptions`

Additional parameters available to methods that support receiving native `Asset`s to the smart contract, i.e. they have been annotated with `@receive`.

#### `InvokeSendUnsafeReceiveTransactionOptions`

*extends:*
  - `InvokeSendUnsafeTransactionOptions`
  - `InvokeReceiveTransactionOptions`

Additional parameters available to methods that support unsafely sending native `Asset`s from the smart contract and receiving native `Asset`s to the smart contract, i.e. they have been annotated with both `@sendUnsafe` and `@receive`.

#### `InvokeSendUnsafeTransactionOptions`

*extends:*
  - `TransactionOptions`

Additional parameters available to methods that support unsafely sending native `Asset`s from the smart contract, i.e. they have been annotated with `@sendUnsafe`.

##### `InvokeSendUnsafeTransactionOptions#sendFrom`

`Transfer`s that specify native assets to send from the contract.

#### `ForwardOptions`

Additional options that are automatically provided by the `forward<method>Args` method. In particular, this object provides the event specification when forwarding values.

##### `ForwardOptions#events`

Additional events that may be emitted due to forwarding arguments to another smart contract method.

#### `ForwardValue`

`ForwardValue` represents a value that's intended to be forwarded to another smart contract method. This object is not meant to be directly constructued, instead one should produce them via the automatically generated `forward<method>Args` methods. See the [Forward Values](https://neo-one.io/docs/forward-values) chapter of the advanced guide for more information.

#### `Action`

An `Action` is either an `Event` or `Log` emitted by the smart contract during a method invocation.

#### `Event`

Structured data emitted by a smart contract during a method invocation. Typically emitted in response to state changes within the contract and to notify contract listeners of an action happening within the contract.

##### `Event#type`

`type` differentiates the `Event` object from other `Action` objects, i.e. `Log`.

##### `Event#name`

An implementation defined string identifying this `Event`. In the automatically generated NEO•ONE smart contract APIs this identifier distinguishes the type of `Event` and the exact type of the `parameters` of the `Event`.

 **Example:**

```typescript
'transfer'
'mint'
```

##### `Event#parameters`

Structured data attached to the event.

 **Example:**

```typescript
{ from: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR', to: 'ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s', amount: new BigNumber(10) }
```

#### `EventParameters`

The base type of the `Event` parameters. This type is specialized automatically with the generated NEO•ONE smart contract APIs.

##### `EventParameters#[name: string]`

Note that arbitrary string indices are not supported - the exact indices are implementation defined for a particular `Event` name.

#### `Log`

Unstructured string emitted by a smart contract during a method invocation.

##### `Log#type`

`type` differentiates the `Log` object from other `Action` objects, i.e. `Event`.

##### `Log#message`

An implementation defined string representing a log message.

#### `ABI`

Full specification of the functions and events of a smart contract. Used by the client APIs to generate the smart contract interface. See the [Smart Contract APIs](/docs/smart-contract-apis) chapter of the main guide for more information.

##### `ABI#functions`

Specification of the smart contract functions.

##### `ABI#events`

Specification of the smart contract events.

#### `ABIFunction`

Function specification in the `ABI` of a smart contract.

##### `ABIFunction#name`

Name of the function

##### `ABIFunction#parameters`

Parameters of the function.

##### `ABIFunction#returnType`

Return type of the function.

##### `ABIFunction#constant`

`true` if the function is constant or read-only.

##### `ABIFunction#send`

`true` if the function is used for sending native assets with a two-phase send.

##### `ABIFunction#sendUnsafe`

`true` if the function is used for sending native assets.

##### `ABIFunction#receive`

`true` if the function is used for receiving native assets.

##### `ABIFunction#claim`

`true` if the function is used for claiming GAS.

##### `ABIFunction#refundAssets`

`true` if the function is used for refunding native assets.

##### `ABIFunction#completeSend`

`true` if the function is used for the second phase of a send.

#### `ABIEvent`

Event specification in the `ABI` of a smart contract.

##### `ABIEvent#name`

Name of the event.

##### `ABIEvent#parameters`

Parameters of the event.

#### `ABIParameter`

```typescript
type ABIParameter =
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
```

Parameter specification of a function or event in the `ABI` of a smart contract.

#### `ABIParameterBase`

Base interface for all `ABIParameter`s

##### `ABIParameterBase#name`

Name of the parameter.

##### `ABIParameterBase#default`

Runtime default value.

##### `ABIParameterBase#rest`

Represents a rest parameter.

#### `AddressABIParameter`

*extends:*
  - `ABIParameterBase`
  - `AddressABIReturn`

`Address` parameter type.

#### `ArrayABIParameter`

*extends:*
  - `ABIParameterBase`
  - `ArrayABIReturn`

`Array` parameter type.

#### `BooleanABIParameter`

*extends:*
  - `ABIParameterBase`
  - `BooleanABIReturn`

`boolean` parameter type.

#### `BufferABIParameter`

*extends:*
  - `ABIParameterBase`
  - `BufferABIReturn`

`Buffer` parameter type.

#### `ForwardValueABIParameter`

*extends:*
  - `ABIParameterBase`
  - `ForwardValueABIReturn`

`ForwardValue` parameter type.

#### `Hash256ABIParameter`

*extends:*
  - `ABIParameterBase`
  - `Hash256ABIReturn`

`Hash256` parameter type.

#### `IntegerABIParameter`

*extends:*
  - `ABIParameterBase`
  - `IntegerABIReturn`

`Fixed<decimals>` parameter type. `decimals` indicates to the client APIs how many decimals the integer represents.

#### `MapABIParameter`

*extends:*
  - `ABIParameterBase`
  - `MapABIReturn`

`Map` parameter type.

#### `ObjectABIParameter`

*extends:*
  - `ABIParameterBase`
  - `ObjectABIReturn`

`Object` parameter type.

#### `PublicKeyABIParameter`

*extends:*
  - `ABIParameterBase`
  - `PublicKeyABIReturn`

`PublicKey` parameter type.

#### `SignatureABIParameter`

*extends:*
  - `ABIParameterBase`
  - `SignatureABIReturn`

`Signature` parameter type.

#### `StringABIParameter`

*extends:*
  - `ABIParameterBase`
  - `StringABIReturn`

`string` parameter type.

#### `VoidABIParameter`

*extends:*
  - `ABIParameterBase`
  - `VoidABIReturn`

`void` parameter type.

#### `ABIReturn`

```typescript
type ABIReturn =
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
```

Return type specification of a function in the `ABI` of a smart contract.

#### `ABIReturnBase`

Common properties of all `ABIReturn` specifications.

##### `ABIReturnBase#optional`

`true` if the value can be `undefined`

##### `ABIReturnBase#forwardedValue`

`true` if the smart contract expects this value to be forwarded by another smart contract.


#### `AddressABIReturn`

*extends:*
 - `ABIReturnBase`

`Address` return type.

##### `AddressABIReturn#type`

`'Address'`

#### `ArrayABIReturn`

*extends:*
 - `ABIReturnBase`

`Array` return type.

##### `ArrayABIReturn#type`

`'Array'`

##### `ArrayABIReturn#value`

Value type of the `Array`.

#### `BooleanABIReturn`

*extends:*
 - `ABIReturnBase`

`boolean` return type.

##### `BooleanABIReturn#type`

`'Boolean'`

#### `BufferABIReturn`

*extends:*
 - `ABIReturnBase`

##### `BufferABIReturn#type`

`'Buffer'`

#### `ForwardValueABIReturn`

*extends:*
 - `ABIReturnBase`

`ForwardValue` return type.

##### `ForwardValueABIReturn#type`

`'ForwardValue'`

#### `Hash256ABIReturn`

*extends:*
 - `ABIReturnBase`

`Hash256` return type.

##### `Hash256ABIReturn#type`

`'Hash256'`

#### `IntegerABIReturn`

*extends:*
 - `ABIReturnBase`

`Fixed<decimals>` return type. `decimals` indicates to the client APIs how many decimals the integer represents.

##### `IntegerABIReturn#type`

`'Integer'`

##### `IntegerABIReturn#decimals`

Number of decimals values of this type represent.

#### `MapABIReturn`

*extends:*
 - `ABIReturnBase`

`Map` return type.

##### `MapABIReturn#type`

`'Map'`

##### `MapABIReturn#key`

Key type of the `Map`.

##### `MapABIReturn#value`

Value type of the `Map`.

#### `ObjectABIReturn`

*extends:*
 - `ABIReturnBase`

`Object` return type.

##### `ObjectABIReturn#type`

`'Object'`

##### `ObjectABIReturn#properties`

Properties of the `Object`.

#### `PublicKeyABIReturn`

*extends:*
 - `ABIReturnBase`

`PublicKey` return type.

##### `PublicKeyABIReturn#type`

`'PublicKey'`

#### `SignatureABIReturn`

*extends:*
 - `ABIReturnBase`

`Signature` return type.

##### `SignatureABIReturn#type`

`'Signature'`

#### `StringABIReturn`

*extends:*
 - `ABIReturnBase`

`string` return type.

##### `StringABIReturn#type`

`'String'`

#### `VoidABIReturn`

*extends:*
 - `ABIReturnBase`

`void` return type.

##### `VoidABIReturn#type`

`'Void'`

#### `ABIDefault`

```typescript
type ABIDefault = SenderAddressABIDefault;
```

Default value for the constructor/deploy parameter.

#### `SenderAddressABIDefault`

Default value is the `Transaction` sender `Address`

##### `SenderAddressABIDefault#type`

`'sender'`

#### `SourceMaps`

Smart contract source maps.

##### `SourceMaps#[address: string]`

`RawSourceMap` for the contract at `address`

---

## Developer Tools

[[toc-reference]]

---

#### `DeveloperTools`

#### `DeveloperClient`

Client which controls a development network.

##### `DeveloperClient#runConsensusNow`

```typescript
interface DeveloperClient {
  readonly runConsensusNow: () => Promise<void>;
 }
```

Trigger consensus to run immediately.

##### `DeveloperClient#updateSettings`

```typescript
interface DeveloperClient {
  readonly updateSettings: (options: Partial<PrivateNetworkSettings>) => Promise<void>;
 }
```

Update settings for the private network.

##### `DeveloperClient#getSettings`

```typescript
interface DeveloperClient {
  readonly getSettings: () => Promise<PrivateNetworkSettings>;
 }
```

Get the current settings of the private network.

##### `DeveloperClient#fastForwardOffset`

```typescript
interface DeveloperClient {
  readonly fastForwardOffset: (seconds: number) => Promise<void>;
 }
```

Fast forward the local network by `seconds` into the future.

##### `DeveloperClient#fastForwardToTime`

```typescript
interface DeveloperClient {
  readonly fastForwardToTime: (seconds: number) => Promise<void>;
 }
```

Fast forward to a particular unix timestamp in the future.

##### `DeveloperClient#reset`

```typescript
interface DeveloperClient {
  readonly reset: () => Promise<void>;
 }
```

Reset the local network to it's initial state starting at the genesis block.

#### `DeveloperProvider`

Provides the core functionality required by the `DeveloperClient`.

#### `PrivateNetworkSettings`

Settings that may be modified on a local NEO•ONE private network.

##### `PrivateNetworkSettings#secondsPerBlock`

Time until the next block starts to be produced.

#### `LocalClient`

Client which controls a local NEO•ONE toolchain.

##### `LocalClient#getNEOTrackerURL`

Returns the local toolchain's NEO Tracker url.

##### `LocalClient#reset`

Resets the local toolchain to its initial state by resetting the local developer network and redeploying contracts.

#### `OneClient`

---

## Utility

[[toc-reference]]

---

#### `Hash256`

Common `Hash256String`s.

##### `Hash256.NEO`

`Hash256String` of the NEO `Asset`.

##### `Hash256.GAS`

`Hash256String` of the GAS `Asset`.

#### `nep5`

#### `createPrivateKey`

```typescript
const createPrivateKey = (): PrivateKeyString
```

Creates a new cryptographically secure private key. @returns hex-encoded private key.

#### `decryptNEP2`

```typescript
const decryptNEP2 = async ({
  password,
  encryptedKey,
}: {
  readonly password: string;
  readonly encryptedKey: string;
}): Promise<PrivateKeyString>
```

Decrypts a private key encrypted using the NEP-2 standard with the given password. @returns hex-encoded private key.

#### `encryptNEP2`

```typescript
type encryptNEP2 = async ({
  password,
  privateKey,
}: {
  readonly password: string;
  readonly privateKey: PrivateKeyString;
}): Promise<string>
```

Encrypts a private key with a password using the NEP-2 standard. @returns NEP-2 format encrypted key.

#### `isNEP2`

```typescript
const isNEP2 = (encryptedKey: string): boolean
```

Validates if a given string is a NEP-2 encrypted private key. @returns `true` if it's a valid NEP-2 key, `false` otherwise.

#### `addressToScriptHash`

```typescript
const addressToScriptHash = (address: AddressString): string
```

Converts a base58 encoded NEO `Address` into a `Hash160` script hash. @returns `Hash160` string, a hex encoded string prefixed by '0x'.

#### `privateKeyToAddress`

```typescript
const privateKeyToAddress = (privateKey: PrivateKeyString): AddressString
```

Converts a hex-encoded private key to a base58 encoded NEO `Address`. @returns base58 encoded string that represents a NEO address.

#### `privateKeyToPublicKey`

```typescript
const privateKeyToPublicKey = (privateKey: PrivateKeyString): PublicKeyString
```

Converts a hex-encoded private key to a hex-encoded public key. @returns hex-encoded public key.

#### `privateKeyToScriptHash`

```typescript
const privateKeyToScriptHash = (privateKey: PrivateKeyString): string
```

Converts a hex-encoded private key to a `Hash160` script hash. @returns `Hash160` string, a hex encoded string prefixed by '0x'.

#### `privateKeyToWIF`

```typescript
const privateKeyToWIF = (privateKey: PrivateKeyString): string
```

Converts a hex-encoded private key to a wallet-import-format (WIF) private key. @returns wallet-import-format (WIF) private key.

#### `publicKeyToAddress`

```typescript
const publicKeyToAddress = (publicKey: PublicKeyString): AddressString
```

Converts a hex-encoded public key into a base58 encoded NEO `Address`. @returns base58 encoded string that represents a NEO address.

#### `publicKeyToScriptHash`

```typescript
const publicKeyToScriptHash = (publicKey: PublicKeyString): string
```

Converts a hex-encoded public key into a `Hash160` script hash. @returns `Hash160` string, a hex encoded string prefixed by '0x'.

#### `scriptHashToAddress`

```typescript
const scriptHashToAddress = (scriptHash: string): AddressString
```

Converts a `Hash160` script hash into a base58 encoded NEO `Address`. @returns base58 encoded string that represents a NEO address.

#### `wifToPrivateKey`

```typescript
const wifToPrivateKey = (wif: string): PrivateKeyString
```

Converts a wallet-import-format (WIF) private key to a hex-encoded private key. @returns hex-encoded private key.

---

## Blockchain Data Types

[[toc-reference]]

---

#### `Account`

An `Account` represents the balances of NEO, GAS an other native assets at a given `Address`.

##### `Account#address`

The address of this `Account`.

##### `Account#balances`

A mapping from a `Hash256String` of a native `Asset` to the value of the held by the `address` for this `Account`. May be `undefined` if the `address` has 0 balance.

#### `Asset`

Attributes of a first class asset. Users will typically only interact with the NEO and GAS `Asset`s.

```typescript
const asset = readClient.getAsset(Hash256.NEO);
const neoAmount = asset.amount;
```

##### `Asset#hash`

`Hash256String` of this `Asset`.

##### `Asset#type`

Type of the `Asset`. See `AssetType`.

#### `Asset#name`

Name of the `Asset`.

#### `Asset#amount`

Total possible supply of the `Asset`.

#### `Asset#available`

Amount currently available of the `Asset`.

#### `Asset#precision`

Precision (number of decimal places) of the `Asset`.

#### `Asset#owner`

Owner of the `Asset`.

#### `Asset#admin`

Admin of the `Asset`.

#### `Asset#issuer`

Issuer of the `Asset`.

#### `Asset#expiration`

Unix timestamp of when the `Asset` must be renewed by or it expires.

#### `Asset#frozen`

`true` if no transfers are allowed with the `Asset`.

#### `AssetType`

Constants that describe the type of `Asset`. The two most important ones are `'Governing'` and `'Utility'` which are reserved for NEO and GAS respectively.

```typescript
type AssetType =
  | 'Credit'
  | 'Duty'
  | 'Governing'
  | 'Utility'
  | 'Currency'
  | 'Share'
  | 'Invoice'
  | 'Token';
```

#### `Attribute`

`Attribute`s are used to store additional data on `Transaction`s. Most `Attribute`s are used to store arbitrary data, whereas some, like `AddressAttribute`, have specific uses in the NEO protocol.

```typescript
type Attribute =
  | BufferAttribute
  | PublicKeyAttribute
  | Hash256Attribute
  | AddressAttribute;
```

#### `AttributeBase`

Base interface for `Attribute`s.

##### `AttributeBase#usage`

`usage` distinguishes the various `Attribute` types.

#### `AttributeUsage`

`Attribute` usage flag indicates the type of the data.

```typescript
type AttributeUsage =
  | BufferAttributeUsage
  | PublicKeyAttributeUsage
  | Hash256AttributeUsage
  | AddressAttributeUsage;
```

#### `AddressAttribute`

*extends:*
  -`AttributeBase`

`Attribute` whose data is an `AddressString`.

##### `AddressAttribute#usage`

`usage` distinguishes `AddressAttribute` from other `Attribute` object types.

##### `AddressAttribute#data`

NEO `Address` as a string of the `Attribute`.

#### `AddressAttributeUsage`

```typescript
type AddressAttributeUsage = 'Script';
```

`Attribute` usage flag indicating the data is a `Hash256`.


#### `BufferAttribute`

*extends:*
  -`AttributeBase`

`Attribute` whose data is an arbitrary `BufferString`.

##### `BufferAttribute#usage`

`usage` distinguishes `BufferAttribute` from other `Attribute` object types.

##### `BufferAttribute#data`

Hex encoded data of the `Attribute`.

#### `BufferAttributeUsage`

`Attribute` usage flag indicating the data is an arbitrary `Buffer`.

```typescript
type BufferAttributeUsage =
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
```

#### `Hash256Attribute`

*extends:*
  -`AttributeBase`

`Attribute` whose data is a `Hash256`.

#### `Hash256Attribute#usage`

`usage` distinguishes `Hash256Attribute` from other `Attribute` object types.

#### `Hash256Attribute#data`

NEO `Hash256` as a string of the `Attribute`.

#### `Hash256AttributeUsage`

`Attribute` usage flag indicating the data is a `Hash256`.

```typescript
type Hash256AttributeUsage =
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
```

#### `PublicKeyAttribute`

*extends:*
  -`AttributeBase`

`Attribute` whose data is a `PublicKeyString`.

##### `PublicKeyAttribute#usage`

`usage` distinguishes `PublicKeyAttribute` from other `Attribute` object types.

#### `PublicKeyAttribute#data`

Public key as a string of the `Attribute`.

#### `PublicKeyAttributeUsage`

`Attribute` usage flag indicating the data is a `PublicKey`.

```typescript
type PublicKeyAttributeUsage = 'ECDH02' | 'ECDH03';
```

#### `Block`

*extends:*
  - `Header`

##### `Block#transactions`

`Transaction`s contained in the `Block`.

#### `Contract`

Attributes of a deployed smart contract.

##### `Contract#version`

NEO protocol version.

##### `Contract#address`

`AddressString` of this `Contract`.

##### `Contract#script`

`Contract` code.

##### `Contract#parameters`

Expected parameters of this `Contract`.

##### `Contract#returnType`

Return type of this `Contract`.

##### `Contract#name`

Name of this `Contract`. For informational purposes only.

##### `Contract#codeVersion`

Version of this `Contract`. For informational purposes only.

##### `Contract#author`

Author of this `Contract`. For informational purposes only.

##### `Contract#email`

Email of this `Contract`. For informational purposes only.

##### `Contract#description`

Description of this `Contract`. For informational purposes only.

##### `Contract#storage`

`true` if this `Contract` can use storage.

##### `Contract#dynamicInvoke`

`true` if this `Contract` can make dynamic invocations.

##### `Contract#payable`

`true` if this `Contract` accepts first-class `Asset`s and/or tokens.

#### `Header`

All of the properties of a `Block` except the `Transaction`s themselves.

#### `Header#version`

NEO blockchain version.

#### `Header#hash`

`Block` hash.

#### `Header#previousBlockHash`

Previous `Block` hash.

#### `Header#merkleRoot`

Merkle Root of the `Transaction`s of this `Block`.

#### `Header#time`

`Block` time persisted.

#### `Header#index`

`Block` index.

#### `Header#nonce`

Unique number to ensure the block hash is always unique.

#### `Header#nextConsensus`

Next consensus address.

#### `Header#script`

"Witness" to the `Block`'s validity.

#### `Header#size`

 Size in bytes of the `Block`.

#### `Input`

`Input`s are a reference to an `Output` of a `Transaction` that has been persisted to the blockchain. The sum of the `value`s of the referenced `Output`s is the total amount transferred in the `Transaction`.

##### `Input#hash`

Hash of the `Transaction` this input references.

##### `Input#index`

`Output` index within the `Transaction` this input references.

#### `Output`

`Output`s represent the destination `Address` and amount transferred of a given `Asset`. The sum of the unspent `Output`s of an `Address` represent the total balance of the `Address`.

##### `Output#asset`

Hash of the `Asset` that was transferred.

##### `Output#value`

Amount transferred.

##### `Output#address`

Destination `Address`.

#### `Witness`

`Witness` is just that, a "witness" to the transaction, meaning they have approved the transaction. Can vary from a simple signature of the transaction for a given `Address`' private key or a "witness" being a smart contract and the way it's verified is by executing the smart contract code.

##### `Witness#invocation`

Sets up the stack for the `verification` script.

##### `Witness#verification`

A script that should leave either a `true` value on the stack if the `Witness` is valid, or `false` otherwise.

#### `Transaction`

`Transaction`s are relayed to the blockchain and contain information that is to be permanently stored on the blockchain. They may contain `Input`s and `Output`s corresponding to transfers of native `Asset`s. Each `Transaction` type serves a particular purpose, see the documentation for each for more information.

```typescript
type Transaction =
  | MinerTransaction
  | IssueTransaction
  | ClaimTransaction
  | EnrollmentTransaction
  | RegisterTransaction
  | ContractTransaction
  | PublishTransaction
  | StateTransaction
  | InvocationTransaction;
```

#### `TransactionBase`

Base interface for all `Transaction`s.

##### `TransactionBase#version`

NEO protocol version.

##### `TransactionBase#hash`

`Hash256` of this `Transaction`.

##### `TransactionBase#size`

Byte size of this `Transaction`.

##### `TransactionBase#attributes`

`Attribute`s attached to the `Transaction`.

##### `TransactionBase#inputs`

`Input`s of the `Transaction`.

##### `TransactionBase#outputs`

`Output`s of the `Transaction`.

##### `TransactionBase#scripts`

`Witness`es to the `Transaction`, i.e. the `Address`es that have signed the `Transasction`.

##### `TransactionBase#systemFee`

GAS execution fee for the transaction.

##### `TransactionBase#networkFee`

GAS network priority fee for the transaction.


#### `ClaimTransaction`

*extends:*
- `TransactionBase`

Claims GAS for a set of spent `Output`s.

##### `ClaimTransaction#type`

`type` distinguishes `ClaimTransaction` from other `Transaction` object types.

##### `ClaimTransaction#claims`

The spent outputs that this `ClaimTransaction` is claiming `GAS` for.

#### `ContractTransaction`

*extends:*
- `TransactionBase`

Transfers first class `Asset`s.

##### `ContractTransaction#type`

`type` distinguishes `ContractTransaction` from other `Transaction` object types.

#### `EnrollmentTransaction`

*extends:*
- `TransactionBase`

Enrolls a new validator for a given `PublicKey`.

##### `EnrollmentTransaction#type`

`type` distinguishes `Enrollmentransaction` from other `Transaction` object types.

##### `EnrollmentTransaction#publicKey`

The public key that is being enrolled as a validator.

#### `InvocationTransaction`

*extends:*
- `TransactionBase`

Runs a script in the NEO VM.

##### `InvocationTransaction#type`

`type` distinguishes `InvocationTransaction` from other `Transaction` object types.

##### `InvocationTransaction#script`

Script to execute in the NEO VM.

##### `InvocationTransaction#gas`

GAS that has been attached to be used for the `systemFee` of the `Transaction`. All attached GAS will be consumed by this operation, regardless of if execution fails or provides too much GAS.

#### `IssueTransaction`

*extends:*
- `TransactionBase`

Issues new currency of a first-class `Asset`.

##### `IssueTransaction#type`

`type` distinguishes `IssueTransaction` from other `Transaction` object types.

#### `MinerTransaction`

*extends:*
- `TransactionBase`

First `Transaction` in each block which contains the `Block` rewards for the consensus node that produced the `Block`.

##### `MinerTransaction#type`

`type` distinguishes `MinerTransaction` from other `Transaction` object types.

##### `MinerTransaction#nonce`

Unique number in order to ensure the hash for this transaction is unique.

#### `PublishTransaction`

*extends:*
- `TransactionBase`

Registers a new `Contract`.

##### `PublishTransaction#type`

`type` distinguishes `PublishTransaction` from other `Transaction` object types.

##### `PublishTransaction#contract`

`Contract` to publish.

#### `RegisterTransaction`

*extends:*
- `TransactionBase`

Registers a new first class `Asset`.

##### `RegisterTransaction#type`

`type` distinguishes `RegisterTransaction` from other `Transaction` object types.

##### `RegisterTransaction#asset`

`Asset` information to register.

#### `StateTransaction`

*extends:*
  - `TransactionBase`

##### `StateTransaction#type`

`type` distinguishes `StateTransaction` from other `Transaction` object types.

#### `ConfirmedTransaction`

`Transaction` that has been confirmed on the blockchain. Includes all of the same properties as a `Transaction` as well as the `TransactionReceipt` of the confirmation.

```typescript
type ConfirmedTransaction =
  | ConfirmedMinerTransaction
  | ConfirmedIssueTransaction
  | ConfirmedClaimTransaction
  | ConfirmedEnrollmentTransaction
  | ConfirmedRegisterTransaction
  | ConfirmedContractTransaction
  | ConfirmedPublishTransaction
  | ConfirmedStateTransaction
  | ConfirmedInvocationTransaction;
```

#### `ConfirmedTransactionBase`

Common propreties for all `ConfirmedTransaction`s.

##### `ConfirmedTransactionBase#receipt`

"Receipt" of the confirmed transaction on the blockchain. This contains properties like the block the `Transaction` was included in.

#### `ConfirmedClaimTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `ClaimTransaction`

Confirmed variant of `ClaimTransaction`

#### `ConfirmedContractTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `ContractTransaction`

Confirmed variant of `ContractTransaction`

#### `ConfirmedEnrollmentTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `EnrollmentTransaction`

Confirmed variant of `EnrollmentTransaction`.

#### `ConfirmedInvocationTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `InvocationTransaction`

Confirmed variant of `InvocationTransaction`.

#### `ConfirmedIssueTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `IssueTransaction`

Confirmed variant of `IssueTransaction`.

#### `ConfirmedMinerTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `MinerTransaction`

Confirmed variant of `MinerTransaction`.

#### `ConfirmedPublishTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `PublishTransaction`

Confirmed variant of `PublishTransaction`.

#### `ConfirmedRegisterTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `RegisterTransaction`

Confirmed variant of `RegisterTransaction`.

#### `ConfirmedStateTransaction`

*extends:*
  - `ConfirmedTransactionBase`
  - `StateTransaction`

Confirmed variant of `StateTransaction`.

---

## Raw Data Types

[[toc-reference]]

---

#### `RawAction`

Raw action emitted during an invocation. Low-level API for advanced usage only.

#### `RawActionBase`

Base properties of `Event`s and `Log`s as well as their raw counterparts, `RawNotification` and `RawLog`, respectively.

##### `RawActionBase#version`

NEO network version number.

##### `RawActionBase#blockIndex`

Index of the block this action was emitted in.

##### `RawActionBase#blockHash`

Hash of the block this action was emitted in.

##### `RawActionBase#transactionIndex`

Index of the transaction within the block this action was emitted in.

##### `RawActionBase#transactionHash`

Hash of the transaction within the block this action was emitted in.

##### `RawActionBase#index`

Ordered index of the action of when it occurred within the transaction.

##### `RawActionBase#globalIndex`

Ordered globally unique index of the action.

##### `RawActionBase#address`

Address of the smart contract that this action occurred in.

#### `RawInvocationData`

Additional raw data that is typically processed by an `ABI` for the client APIs.

##### `RawInvocationData#asset`

`Asset` created by the invocation.

##### `RawInvocationData#contracts`

`Contract`s created by the invocation.

##### `RawInvocationData#deletedContractAddresses`

`Contract`s deleted by the invocation.

##### `RawInvocationData#migratedContractAddresses`

`Contract`s migrated (upgraded) by the invocation.

##### `RawInvocationData#result`

Raw result of an invocation.

##### `RawInvocationData#actions`

Raw actions emitted by the invocation.

#### `RawInvocationResult`

Raw result of an invocation. Low-level API for advanced usage only.

```typescript
type RawInvocationResult = RawInvocationResultError | RawInvocationResultSuccess;
```

#### `RawInvocationResultBase`

Common `InvocationResult` and `RawInvocationResult` properties.

##### `RawInvocationResultBase#gasConsumed`

GAS consumed by the operation. This is the total GAS consumed after the free GAS is subtracted.

##### `RawInvocationResultBase#gasCost`

The total GAS cost before subtracting the free GAS.

#### `RawInvocationResultError`

*extends:*
  - `RawInvocationResultBase`

Raw result of a failed invocation. Low-level API for advanced usage only.

##### `RawInvocationResultError#state`

Indicates a failed invocation.

##### `RawInvocationResultError#stack`

The state of the NEO VM after execution. Typically has one `ContractParameter` which is the return value of the method invoked.

##### `RawInvocationResultError#message`

A descriptive message indicating why the invocation failed.

#### `RawInvocationResultSuccess`

*extends:*
  - `RawInvocationResultBase`

Raw result of a successful invocation. Low-level API for advanced usage only.

##### `RawInvocationResultSuccess#state`

Indicates a successful invocation.

##### `RawInvocationResultSuccess#stack`

The state of the NEO VM after execution. Typically has one `ContractParameter` which is the return value of the method invoked.

#### `RawLog`

Raw log emitted during an invocation.

#### `RawLog#type`

`type` differentiates the `RawLog` object from other `RawAction` objects, i.e. `RawNotification`.

#### `RawLog#message`

The raw message. This is unprocessed in the `message`.

#### `RawNotification`

*extends:*
  - `RawActionBase`

Raw notification emitted during an invocation. This is the unprocessed counterpart to an `Event`. Low-level API for advanced usage only.

##### `RawNotification#type`

`type` differentiates the `RawNotification` object from other `RawAction` objects, i.e. `RawLog`.

##### `RawNotification#args`

The raw arguments of the notifications. These are processed into the `parameters` parameter of the `Event` object using the `ABI`.

#### `ContractParameter`

`ContractParameter`s are the serialized stack items of an invocation. These are typically the raw results of an invocation, but they may appear in other raw contexts. Low-level API for advanced usage only.

```typescript
type ContractParameter =
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
```

#### `ContractParameterType`

All of the possible `type`s that a `ContractParameter` may have.

#### `AddressContractParameter`

Invocation stack item for an `Address`.

##### `AddressContractParameter#type`

`type` distinguishes `AddressContractParameter` from other `ContractParameter` object types.

##### `AddressContractParameter#value`

NEO address in base58 encoded string format.

#### `ArrayContractParameter`

Invocation stack item for an `Array`.

##### `ArrayContractParameter#type`

`type` distinguishes `ArrayContractParameter` from other `ContractParameter` object types.

##### `ArrayContractParameter#value`

An array of `ContractParameter`s.

#### `BooleanContractParameter`

Invocation stack item for a `boolean`.

##### `BooleanContractParameter#type`

`type` distinguishes `BooleanContractParameter` from other `ContractParameter` object types.

##### `BooleanContractParameter#value`

Raw boolean value.

#### `BufferContractParameter`

Invocation stack item for a `Buffer`.

##### `BufferContractParameter#type`

`type` distinguishes `BufferContractParameter` from other `ContractParameter` object types.

##### `BufferContractParameter#value`

Hex encoded `Buffer` string.

#### `Hash256ContractParameter`

Invocation stack item for a `Hash256`.

##### `Hash256ContractParameter#type`

`type` distinguishes `Hash256ContractParameter` from other `ContractParameter` object types.

##### `Hash256ContractParameter#value`

 NEO `Hash256` encoded as a string.

#### `IntegerContractParameter`

Invocation stack item for a `BN`.

##### `IntegerContractParameter#type`

Note that unlike most of the client APIs, we use a `BN` instead of a `BigNumber` here to indicate that this is an integer value.

##### `IntegerContractParameter#value`

For example, an `IntegerContractParameter` that represents a NEO value of 10 would be a `new BN(10_00000000)`.

#### `InteropInterfaceContractParameter`

Invocation stack item for anything other than the other valid contract parameters. Examples include the `Block` builtin. If these builtins remain on the stack after invocation, for example, as a return value, then they will be serialized as this empty interface.

##### `InteropInterfaceContractParameter#type`

`type` distinguishes `InteropInterfaceContractParameter` from other `ContractParameter` object types.

#### `MapContractParameter`

Invocation stack item for a `Map`.

##### `MapContractParameter#type`

`type` distinguishes `MapContractParameter` from other `ContractParameter` object types.

##### `MapContractParameter#value`

A map of `ContractParameter` to `ContractParameter`. Represented as an array of pairs because JavaScript `Map` keys do not have the same semantics as the NEO VM.

#### `PublicKeyContractParameter`

Invocation stack item for a `PublicKey`.

##### `PublicKeyContractParameter#type`

`type` distinguishes `PublicKeyContractParameter` from other `ContractParameter` object types.

##### `PublicKeyContractParameter#value`

String format of a public key.

#### `SignatureContractParameter`

Invocation stack item for a `Signature`.

##### `SignatureContractParameter#type`

`type` distinguishes `SignatureContractParameter` from other `ContractParameter` object types.

##### `SignatureContractParameter#value`

Raw signature string.

#### `StringContractParameter`

Invocation stack item for a `string`.

##### `StringContractParameter#type`

`type` distinguishes `StringContractParameter` from other `ContractParameter` object types.

##### `StringContractParameter#value`

Raw string value.

#### `VoidContractParameter`

Invocation stack item for `void`.

##### `VoidContractParameter#type`

`type` distinguishes `VoidContractParameter` from other `ContractParameter` object types.
