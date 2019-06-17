---
slug: client
title: \@neo-one/client
---
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

Main entrypoint to the `@neo-one/client` APIs. The [`Client`](/docs/client#Client) class abstracts away user accounts and even how those accounts are provided to your dapp, for example, they might come from an extension like NEX, dapp browser like nOS or through some other integration. See the [Client APIs](/docs/client-apis) chapter of the main guide for more information.

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

The configured [`UserAccountProvider`](/docs/client#UserAccountProvider)s for this [`Client`](/docs/client#Client) instance.

##### `Client#getUserAccount`

```typescript
interface Client {
  readonly getUserAccount: (idIn: UserAccountID) => UserAccount;
}
```

Get the details of the [`UserAccount`](/docs/client#UserAccount) for a given [`UserAccountID`](/docs/client#UserAccountID). Returns [`UserAccount`](/docs/client#UserAccount) or throws an `UnknownAccountError` if one could not be found.

##### `Client#selectUserAccount`

```typescript
interface Client {
  readonly selectUserAccount: (idIn?: UserAccountID) => Promise<void>;
}
```

Sets a [`UserAccountID`](/docs/client#UserAccountID) as the currently selected [`UserAccountID`](/docs/client#UserAccountID).

##### `Client#selectNetwork`

```typescript
interface Client {
  readonly selectNetwork: (networkIn: NetworkType) => Promise<void>;
}
```

Sets a [`NetworkType`](/docs/client#NetworkType) as the currently selected [`NetworkType`](/docs/client#NetworkType).

##### `Client#getSupportFeatures`

```typescript
interface Client {
  readonly getSupportedFeatures: (idIn: UserAccountID) => Promise<UserAccountFeatures>;
}
```

Returns `Promise` which resolves to the `UserAccountFeatures` supported by the given [`UserAccountID`](/docs/client#UserAccountID).

##### `Client#deleteUserAccount`

```typescript
interface Client {
  readonly deleteUserAccount: (idIn: UserAccountID) => Promise<void>;
}
```

Deletes the [`UserAccountID`](/docs/client#UserAccountID) from its underlying provider. Throws an `DeleteUserAccountUnsupportedError` if the operation is unsupported. Users should check `getSupportedFeatures` before calling this method.

##### `Client#updateUserAccountName`

```typescript
interface Client {
  readonly updateUserAccountName: (options: UpdateAccountNameOptions) => Promise<void>;
}
```

Updates the name of the [`UserAccountID`](/docs/client#UserAccountID) in the underlying provider. Throws an `UpdateUserAccountUnsupportedError` if the operation is unsupported. Users should check `getSupportedFeatures` before calling this method.

##### `Client#getCurrentUserAccount`

```typescript
interface Client {
  readonly getCurrentUserAccount: () => UserAccount | undefined;
}
```

Returns the currently selected [`UserAccount`](/docs/client#UserAccount) or `undefined` if there are no [`UserAccount`](/docs/client#UserAccount)s.

##### `Client#getCurrentNetwork`

```typescript
interface Client {
  readonly getCurrentNetwork: () => NetworkType;
}
```

Returns the currently selected [`NetworkType`](/docs/client#NetworkType).

##### `Client#getUserAccounts`

```typescript
interface Client {
  readonly getUserAccounts: () => readonly UserAccount[];
}
```

Returns a list of all available [`UserAccount`](/docs/client#UserAccount)s.

##### `Client#getNetworks`

```typescript
interface Client {
  readonly getNetworks: () => readonly NetworkType[];
}
```

Returns a list of all available [`NetworkType`](/docs/client#NetworkType)s.

##### `Client#smartContract`

```typescript
interface Client {
  readonly smartContract<T extends SmartContract<any, any> = SmartContractAny>: (definition: SmartContractDefinition) => T;
}
```

Constructs a [`SmartContract`](/docs/client#SmartContract) instance for the provided `definition` backed by this [`Client`](/docs/client#Client) instance.

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

Transfer native assets in the specified amount(s) to the specified Address(es). Accepts either a single transfer or an array of transfer objects. Note that we use an [`InvocationTransaction`](/docs/client#InvocationTransaction) for transfers in order to reduce the overall bundle size since they can be used equivalently to [`ContractTransaction`](/docs/client#ContractTransaction)s. Returns `Promise<TransactionResult<TransactionReceipt, InvocationTransaction>>`.

##### `Client#claim`

```typescript
interface Client {
  readonly claim: (optionsIn?: TransactionOptions) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
}
```

Claim all available unclaimed `GAS` for the currently selected account (or the specified `from` [`UserAccountID`](/docs/client#UserAccountID)).

##### `Client#getAccount`

```typescript
interface Client {
  readonly getAccount: (id: UserAccountID) => Promise<Account>;
}
```

Returns `Promise` which resolves to an [`Account`](/docs/client#Account) object for the provided [`UserAccountID`](/docs/client#UserAccountID).


#### `UpdateAccountNameOptions`

Options for the [`UserAccountProvider#updateAccountName`](/docs/client#UserAccountProvider#updateAccountName) method.

##### `UpdateAccountNameOptions#id`

[`UserAccountID`](/docs/client#UserAccountID) of the [`UserAccount`](/docs/client#UserAccount) to update.

##### `UpdateAccountNameOptions#name`

New name of the [`UserAccount`](/docs/client#UserAccount).

##### `UpdateAccountNameOptions#monitor`

Optional `Monitor` for any logging that occurs during the update process.

#### `UserAccountProvider`

[`UserAccountProvider`](/docs/client#UserAccountProvider)s power [`Client`](/docs/client#Client) instances. Multiple [`UserAccountProvider`](/docs/client#UserAccountProvider)s may be provided, and the [`Client`](/docs/client#Client) abstracts over them to provide a common layer of functionality independent of the underlying [`UserAccountProvider`](/docs/client#UserAccountProvider)s.

##### `UserAccountProvider#currentUserAccount$`

An `Observable` that emits the currently selected [`UserAccount`](/docs/client#UserAccount).

##### `UserAccountProvider#userAccounts$`

An `Observable` that emits the available [`UserAccount`](/docs/client#UserAccount)s.

##### `UserAccountProvider#networks$`

An `Observable` that emits the available networks this [`UserAccountProvider`](/docs/client#UserAccountProvider) knows how to function with.

##### `UserAccountProvider#getCurrentUserAccount`

```typescript
interface UserAccountProvider {
  readonly getCurrentUserAccount: () => UserAccount | undefined;
}
```

Returns the currently selected [`UserAccount`](/docs/client#UserAccount) or `undefined` if one is not selected.

##### `UserAccountProvider#getUserAccounts`

```typescript
interface UserAccountProvider {
  readonly getUserAccounts: () => readonly UserAccount[];
}
```

Returns the available [`UserAccount`](/docs/client#UserAccount)s.

##### `UserAccountProvider#getNetworks`

```typescript
interface UserAccountProvider {
  readonly getNetworks: () => readonly NetworkType[];
}
```

Returns the available networks this [`UserAccountProvider`](/docs/client#UserAccountProvider) knows how to function with.

##### `UserAccountProvider#selectUserAccount`

```typescript
interface UserAccountProvider {
  readonly selectUserAccount: (id?: UserAccountID) => Promise<void>;
}
```

Set the given [`UserAccountID`](/docs/client#UserAccountID) as the selected [`UserAccount`](/docs/client#UserAccount). If the [`UserAccountProvider`](/docs/client#UserAccountProvider) does not support programatically selecting a [`UserAccountID`](/docs/client#UserAccountID), it should only ever expose one available [`UserAccount`](/docs/client#UserAccount) and manage selecting other [`UserAccount`](/docs/client#UserAccount)s outside of the application.

##### `UserAccountProvider#deleteUserAccount`

```typescript
interface UserAccountProvider {
  readonly deleteUserAccount?: (id: UserAccountID) => Promise<void>;
}
```

Optional support for deleting a [`UserAccount`](/docs/client#UserAccount).

##### `UserAccountProvider#updateUserAccountName`

```typescript
interface UserAccountProvider {
  readonly updateUserAccountName?: (options: UpdateAccountNameOptions) => Promise<void>;
}
```

Optional support for updating the name of a [`UserAccount`](/docs/client#UserAccount).

##### `UserAccountProvider#getBlockCount`

```typescript
interface UserAccountProvider {
  readonly getBlockCount: (network: NetworkType, monitor?: Monitor) => Promise<number>;
}
```

Returns the current [`Block`](/docs/client#Block) height.

##### `UserAccountProvider#getAccount`

```typescript
interface UserAccountProvider {
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
}
```

Returns [`Account`](/docs/client#Account) for the specified network and address. Note that the provided network and address may not correspond to one of the available [`UserAccount`](/docs/client#UserAccount)s.

##### `UserAccountProvider#iterBlocks`

```typescript
interface UserAccountProvider {
  readonly iterBlocks: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<Block>;
}
```

Returns `AsyncIterable` of [`Block`](/docs/client#Block)s on the argument `network`.

##### `UserAccountProvider#iterActionsRaw`

```typescript
interface UserAccountProvider {
  readonly iterActionsRaw?: (network: NetworkType, filter?: BlockFilter) => AsyncIterable<RawAction>;
}
```

While this method could be implemented simply as a function of `iterBlocks`, `iterActionsRaw` is provided in case the [`UserAccountProvider`](/docs/client#UserAccountProvider) has a more efficient way of iterating over actions. Returns `AsyncIterable` over all actions emitted by the given `network`, filtered by the given `filter`.

##### `UserAccountProvider#transfer`

```typescript
interface UserAccountProvider {
  readonly transfer: (
    transfers: readonly Transfer[],
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
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    verify: boolean,
    options?: InvokeSendUnsafeReceiveTransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Invoke the specified `method` with the given `params` on [`Contract`](/docs/client#Contract). `paramsZipped` contains the original parameters before processing with the ABI and are typically suitable for displaying to a user. `verify` will be true if the transaction should trigger verification for the [`Contract`](/docs/client#Contract). `options` may specify additional native asset transfers to include with the transaction (either to or from the contract address).

##### `UserAccountProvider#invokeSend`

```typescript
interface UserAccountProvider {
  readonly invokeSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    transfer: Transfer,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Relays a transaction that is the first step of a two-step send process. The [`Transfer`](/docs/client#Transfer)'s `to` property represents the ultimate destination of the funds, but this transaction will be constructed such that those funds are marked for transfer, not actually transferred. Otherwise, parameters are the same as [`invoke`](/docs/client#UserAccountProvider#invoke).

##### `UserAccountProvider#invokeCompleteSend`

```typescript
interface UserAccountProvider {
  readonly invokeCompleteSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Relays a transaction that is the second step of a two-step send process. The `hash` is the transaction hash of the first step in the process and is used to determine the amount to transfer to the `from` address. Otherwise, parameters are the same as [`invoke`](/docs/client#UserAccountProvider#invoke).

##### `UserAccountProvider#invokeRefundAssets`

```typescript
interface UserAccountProvider {
  readonly invokeRefundAssets: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>>;
}
```

Refunds native assets that were not processed by the contract. The `hash` is the transaction hash that should be refunded and is used to construct the transfers for this transaction. Otherwise, parameters are the same as [`invoke`](/docs/client#UserAccountProvider#invoke).

##### `UserAccountProvider#invokeClaim`

```typescript
interface UserAccountProvider {
  readonly invokeClaim: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    options?: TransactionOptions,
    sourceMaps?: Promise<SourceMaps>,
  ) => Promise<TransactionResult<TransactionReceipt, ClaimTransaction>>;
}
```

Claims GAS. Currently only supports claiming all unclaimed GAS to the contract address. Otherwise, parameters are the same as [`invoke`](/docs/client#UserAccountProvider#invoke).

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

Invokes the constant `method` on [`Contract`](/docs/client#Contract) with `params` on `network`.

#### `UserAccountProviders`

An object of [`UserAccountProvider`](/docs/client#UserAccountProvider)s.

#### `UserAccountProviders#[type: string]`

Key index may be arbitrary and is primarily intended to allow for a more specific [`Client`](/docs/client#Client) TypeScript type to enable direct access to the underlying providers, if needed.

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

Hex encoded string prefixed by '0x' that represents a NEO 256 bit hash. Examples of [`Hash256String`](/docs/client#Hash256String) include [`Block`](/docs/client#Block) hashes and [`Transaction`](/docs/client#Transaction) hashes.

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

[`UserAccount`](/docs/client#UserAccount) is the base abstraction on which all of the @neo-one/client APIs work with.

##### `UserAccount#id`

Uniquely identifies a [`UserAccount`](/docs/client#UserAccount) by its address and the network its used on.

##### `UserAccount#name`

The name to use when displaying this account in a user-facing UI. Can be a user configured name or just the address.

##### `UserAccount#publicKey`

The public key for the address.

#### `UserAccountID`

Uniquely identifies a [`UserAccount`](/docs/client#UserAccount) by its address and the network its used on.

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

[`Hash256`](/docs/client#Hash256) in string format of the native [`Asset`](/docs/client#Asset) to transfer.

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

The [`UserAccount`](/docs/client#UserAccount) that the transaction is "from", i.e. the one that will be used for native asset transfers, claims, and signing the transaction. If unspecified, the currently selected [`UserAccount`](/docs/client#UserAccount) is used as the `from` address. DApp developers will typically want to leave this unspecified.

##### `TransactionOptions#attributes`

Additional attributes to include with the transaction.

##### `TransactionOptions#networkFee`

An optional network fee to include with the transaction.

##### `TransactionOptions#systemFee`

A maximum system fee to include with the transaction. Note that this is a maximum, the client APIs will automatically calculate and add a system fee to the transaction up to the value specified here. Leaving `systemFee` `undefined` is equivalent to `new BigNumber(0)`, i.e. no system fee. A `systemFee` of `-1`, i.e. `new BigNumber(-1)` indicates no limit on the fee. This is typically used only during development.

##### `TransactionOptions#monitor`

The `Monitor` to use for tracking and logging all asynchronous calls made during the transaction.

#### `TransactionReceipt`

Receipt of a confirmed [`Transaction`](/docs/client#Transaction) which contains data about the confirmation such as the [`Block`](/docs/client#Block) index and the index of the [`Transaction`](/docs/client#Transaction) within the block.

##### `TransactionReceipt#blockIndex`

[`Block`](/docs/client#Block) index of the [`Transaction`](/docs/client#Transaction) for this receipt.

##### `TransactionReceipt#blockHash`

[`Block`](/docs/client#Block) hash of the [`Transaction`](/docs/client#Transaction) for this receipt.

##### `TransactionReceipt#transactionIndex`

Transaction index of the [`Transaction`](/docs/client#Transaction) within the [`Block`](/docs/client#Block) for this receipt.

#### `TransactionResult`

The result of a successful relay of a [`Transaction`](/docs/client#Transaction).

##### `TransactionResult#transaction`

[`Transaction`](/docs/client#Transaction) that was relayed.

##### `TransactionResult#confirmed`

```typescript
interface TransactionResult {
  readonly confirmed: (options?: GetOptions) => Promise<TTransactionReceipt>;
}
```

Waits for the [`Transaction`](/docs/client#Transaction) to be confirmed on the blockchain. Returns `Promise` that resolves when the [`Transaction`](/docs/client#Transaction) has been confirmed, resolving to the confirmation receipt.

#### `NetworkSettings`

Constant settings used to initialize the client APIs.

##### `NetworkSettings#issueGASFee`

---

## UserAccountProvider

[[toc-reference]]

---

#### `LocalUserAccountProvider`

Implements [`UserAccountProvider`](/docs/client#UserAccountProvider) using a `KeyStore` instance and a `Provider` instance. See the [LocalUserAccountProvider](/docs/user-accounts#LocalUserAccountProvider) section of the advanced guide for more details.

#### `LocalKeyStore`

[`LocalKeyStore`](/docs/client#LocalKeyStore) implements the `KeyStore` interface expected by [`LocalUserAccountProvider`](/docs/client#LocalUserAccountProvider) via an underlying `Store` implementation.

#### `LocalMemoryStore`

Dummy implementation of the `LocalStore` interface which causes the [`LocalKeyStore`](/docs/client#LocalKeyStore) to be entirely in-memory.

#### `LocalStringStore`

Implements the `LocalStore` interface expected by [`LocalKeyStore`](/docs/client#LocalKeyStore).

#### `UnlockedWallet`

Wallet in the "unlocked" state.

##### `UnlockedWallet#type`

`type` differentiates an [`UnlockedWallet`](/docs/client#UnlockedWallet) from other [`LocalWallet`](/docs/client#LocalWallet)s, i.e. an [`LockedWallet`](/docs/client#LockedWallet)

##### `UnlockedWallet#account`

[`UserAccount`](/docs/client#UserAccount) this [`UnlockedWallet`](/docs/client#UnlockedWallet) refers to.

##### `UnlockedWallet#privateKey`

Private key for this [`UnlockedWallet`](/docs/client#UnlockedWallet).

##### `UnlockedWallet#nep2`

NEP-2 encrypted key of this [`UnlockedWallet`](/docs/client#UnlockedWallet). `undefined` if the `privateKey` has never been encrypted.

#### `LockedWallet`

Wallet in the "locked" state.

##### `LockedWallet#type`

`type` differentiates a [`LockedWallet`](/docs/client#LockedWallet) from other [`LocalWallet`](/docs/client#LocalWallet)s, i.e. an [`UnlockedWallet`](/docs/client#UnlockedWallet).

##### `LockedWallet#account`

[`UserAccount`](/docs/client#UserAccount) this [`LockedWallet`](/docs/client#LockedWallet) refers to.

##### `LockedWallet#nep2`

NEP-2 encrypted key of this [`LockedWallet`](/docs/client#LockedWallet).

#### `LocalWallet`

Locally stored wallet that is either in a `'locked'` or `'unlocked'` state (`type`).

#### `NEOONEDataProvider`

Implements the methods required by the [`NEOONEProvider`](/docs/client#NEOONEProvider) as well as the [`DeveloperProvider`](/docs/client#DeveloperProvider) interface using a NEO•ONE node.

#### `NEOONEDataProviderOptions`

#### `NEOONEOneDataProvider`

Implements the methods required by the [`NEOONEProvider`](/docs/client#NEOONEProvider) as well as the [`DeveloperProvider`](/docs/client#DeveloperProvider) interface using a NEO•ONE node that is looked up through the local NEO•ONE `projectID`.

#### `NEOONEProvider`

Implements the `Provider` interface expected by a [`LocalUserAccountProvider`](/docs/client#LocalUserAccountProvider) using a NEO•ONE node.

#### `Peer`

Peers connected to the node.

#### `JSONRPCProvider`

Base interface for handling [`JSONRPCRequest`](/docs/client#JSONRPCRequest)s and returning [`JSONRPCResponse`](/docs/client#JSONRPCResponse)s.

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

Raw result of relaying a [`Transaction`](/docs/client#Transaction). Further consumed and processed by [`LocalUserAccountProvider`](/docs/client#LocalUserAccountProvider) and [`ABI`](/docs/client#ABI).

##### `RelayTransactionResult#transaction`

Relayed [`Transaction`](/docs/client#Transaction).

##### `RelayTransactionResult#verifyResult`

Verification result.

#### `VerifyTransactionResult`

Interface which describes the result of verification invocation.

##### `VerifyTransactionResult#verifications`

All verifications that happened during the relay of the [`Transaction`](/docs/client#Transaction).

#### `VerifyScriptResult`

An individual verification and the associated data.

##### `VerifyScriptResult#failureMessage`

`undefined` if the verification passed, otherwise a message that describes the failure.

##### `VerifyScriptResult#address`

The smart contract this result is associated with.

##### `VerifyScriptResult#witness`

The specific [`Witness`](/docs/client#Witness) that was checked.

##### `VerifyScriptResult#actions`

The actions emitted during the verification.

---

## Smart Contract

[[toc-reference]]

---

#### `SmartContract<TClient extends Client, TEvent extends Event>`

An object representing a smart contract defined by the `definition` property, in particular, the [`ABI`](/docs/client#ABI) of the definition.

##### `SmartContract#definition`

The [`SmartContractDefinition`](/docs/client#SmartContractDefinition) that generated this [`SmartContract`](/docs/client#SmartContract) object.

##### `SmartContract#client`

The underlying [`Client`](/docs/client#Client) used by this [`SmartContract`](/docs/client#SmartContract).

##### `SmartContract#iterEvent(options?: SmartContractIterOptions): AsyncIterable<TEvent>`

Iterate over the events emitted by the smart contract.

##### `SmartContract#iterLogs(options?: SmartContractIterOptions): AsyncIterable<Log>`

Iterate over the logs emitted by the smart contract.

##### `SmartContract#iterActions(options?: SmartContractIterOptions): AsyncIterable<Action>`

Iterate over the events and logs emitted by the smart contract.

##### `SmartContract#convertAction(action: RawAction): Action | undefined`

Converts a [`RawAction`](/docs/client#RawAction), typically from the raw results found in a [`Block`](/docs/client#Block) to a processed [`Action`](/docs/client#Action) or `undefined` if the action is not recognized by the ABI.

#### `SmartContractReadOptions`

Additional optional options for methods that read data from a smart contract.

##### `SmartContractReadOptions#network`

The network to read the smart contract data for. By default this is the network of the currently selected user account.

#### `SmartContractIterOptions`

*extends:*
  - [`SmartContractReadOptions`](/docs/client#SmartContractReadOptions)

Additional optional options for methods that iterate over data from a smart contract.

##### `SmartContractIterOptions#filter`

Filters the iterated events and/or logs to those that match the provided [`BlockFilter`](/docs/client#BlockFilter) object.

#### `SmartContractDefinition`

Used to generate the smart contract APIs.

##### `SmartContractDefinition#networks`

Configuration for the smart contract by network.

##### `SmartContractDefinition#abi`

[`ABI`](/docs/client#ABI) of the smart contract

##### `SmartContractDefinition#sourceMaps`

[`SourceMaps`](/docs/client#SourceMaps) associated with the smart contract.

#### `SmartContractNetworkDefinition`

Configuration for the smart contract by network.

##### `SmartContractNetworkDefinition#[networkType: string]`

Network specific smart contract configuration

#### `SmartContractNetworkDefinition`

Network specific smart contract configuration

##### `SmartContractNetworkDefinition#address`

[`AddressString`](/docs/client#AddressString) of the smart contract on the network.

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
  | readonly Param[]
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
  | readonly Return[]
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

Common [`InvocationResult`](/docs/client#InvocationResult) properties.

##### `InvocationResultBase#gasConsumed`

GAS consumed by the operation. This is the total GAS consumed after the free GAS is subtracted.

##### `InvocationResultBase#gasCost`

The total GAS cost before subtracting the free GAS.

#### `InvocationResultSuccess<TValue>`

*extends:*
  - [`InvocationResultBase`](/docs/client#InvocationResultBase)

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

#### `InvokeReceipt`

*extends:*
  - [`TransactionReceipt`](/docs/client#TransactionReceipt)

The receipt for a smart contract method invocation.

##### `InvokeReceipt#result`

The result of the invocation.

##### `InvokeReceipt#events`

The events emitted by the smart contract during the invocation.

#### `InvokeReceipt#logs`

The logs emitted by the smart contract during the invocation.

#### `InvokeReceipt#raw`

The original, unprocessed, `RawInvokeReceipt`. The `RawInvokeReceipt` is transformed into this object (the [`InvokeReceipt`](/docs/client#InvokeReceipt)) using the [`ABI`](/docs/client#ABI) to parse out the [`Event`](/docs/client#Event)s and [`InvocationResult`](/docs/client#InvocationResult).

#### `InvokeReceiveTransactionOptions`

*extends:*
  - [`TransactionOptions`](/docs/client#TransactionOptions)

Additional parameters available to methods that support receiving native [`Asset`](/docs/client#Asset)s to the smart contract, i.e. they have been annotated with `@receive`.

#### `InvokeSendUnsafeReceiveTransactionOptions`

*extends:*
  - [`InvokeSendUnsafeTransactionOptions`](/docs/client#InvokeSendUnsafeTransactionOptions)
  - [`InvokeReceiveTransactionOptions`](/docs/client#InvokeReceiveTransactionOptions)

Additional parameters available to methods that support unsafely sending native [`Asset`](/docs/client#Asset)s from the smart contract and receiving native [`Asset`](/docs/client#Asset)s to the smart contract, i.e. they have been annotated with both `@sendUnsafe` and `@receive`.

#### `InvokeSendUnsafeTransactionOptions`

*extends:*
  - [`TransactionOptions`](/docs/client#TransactionOptions)

Additional parameters available to methods that support unsafely sending native [`Asset`](/docs/client#Asset)s from the smart contract, i.e. they have been annotated with `@sendUnsafe`.

##### `InvokeSendUnsafeTransactionOptions#sendFrom`

[`Transfer`](/docs/client#Transfer)s that specify native assets to send from the contract.

#### `ForwardOptions`

Additional options that are automatically provided by the `forward<method>Args` method. In particular, this object provides the event specification when forwarding values.

##### `ForwardOptions#events`

Additional events that may be emitted due to forwarding arguments to another smart contract method.

#### `ForwardValue`

[`ForwardValue`](/docs/client#ForwardValue) represents a value that's intended to be forwarded to another smart contract method. This object is not meant to be directly constructued, instead one should produce them via the automatically generated `forward<method>Args` methods. See the [Forward Values](https://neo-one.io/docs/forward-values) chapter of the advanced guide for more information.

#### `Action`

An [`Action`](/docs/client#Action) is either an [`Event`](/docs/client#Event) or [`Log`](/docs/client#Log) emitted by the smart contract during a method invocation.

#### `Event`

Structured data emitted by a smart contract during a method invocation. Typically emitted in response to state changes within the contract and to notify contract listeners of an action happening within the contract.

##### `Event#type`

`type` differentiates the [`Event`](/docs/client#Event) object from other [`Action`](/docs/client#Action) objects, i.e. [`Log`](/docs/client#Log).

##### `Event#name`

An implementation defined string identifying this [`Event`](/docs/client#Event). In the automatically generated NEO•ONE smart contract APIs this identifier distinguishes the type of [`Event`](/docs/client#Event) and the exact type of the `parameters` of the [`Event`](/docs/client#Event).

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

The base type of the [`Event`](/docs/client#Event) parameters. This type is specialized automatically with the generated NEO•ONE smart contract APIs.

##### `EventParameters#[name: string]`

Note that arbitrary string indices are not supported - the exact indices are implementation defined for a particular [`Event`](/docs/client#Event) name.

#### `Log`

Unstructured string emitted by a smart contract during a method invocation.

##### `Log#type`

`type` differentiates the [`Log`](/docs/client#Log) object from other [`Action`](/docs/client#Action) objects, i.e. [`Event`](/docs/client#Event).

##### `Log#message`

An implementation defined string representing a log message.

#### `ABI`

Full specification of the functions and events of a smart contract. Used by the client APIs to generate the smart contract interface. See the [Smart Contract APIs](/docs/smart-contract-apis) chapter of the main guide for more information.

##### `ABI#functions`

Specification of the smart contract functions.

##### `ABI#events`

Specification of the smart contract events.

#### `ABIFunction`

Function specification in the [`ABI`](/docs/client#ABI) of a smart contract.

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

Event specification in the [`ABI`](/docs/client#ABI) of a smart contract.

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

Parameter specification of a function or event in the [`ABI`](/docs/client#ABI) of a smart contract.

#### `ABIParameterBase`

Base interface for all [`ABIParameter`](/docs/client#ABIParameter)s

##### `ABIParameterBase#name`

Name of the parameter.

##### `ABIParameterBase#default`

Runtime default value.

##### `ABIParameterBase#rest`

Represents a rest parameter.

#### `AddressABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`AddressABIReturn`](/docs/client#AddressABIReturn)

`Address` parameter type.

#### `ArrayABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`ArrayABIReturn`](/docs/client#ArrayABIReturn)

`Array` parameter type.

#### `BooleanABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`BooleanABIReturn`](/docs/client#BooleanABIReturn)

`boolean` parameter type.

#### `BufferABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`BufferABIReturn`](/docs/client#BufferABIReturn)

`Buffer` parameter type.

#### `ForwardValueABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`ForwardValueABIReturn`](/docs/client#ForwardValueABIReturn)

[`ForwardValue`](/docs/client#ForwardValue) parameter type.

#### `Hash256ABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`Hash256ABIReturn`](/docs/client#Hash256ABIReturn)

[`Hash256`](/docs/client#Hash256) parameter type.

#### `IntegerABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`IntegerABIReturn`](/docs/client#IntegerABIReturn)

`Fixed<decimals>` parameter type. `decimals` indicates to the client APIs how many decimals the integer represents.

#### `MapABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`MapABIReturn`](/docs/client#MapABIReturn)

`Map` parameter type.

#### `ObjectABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`ObjectABIReturn`](/docs/client#ObjectABIReturn)

`Object` parameter type.

#### `PublicKeyABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`PublicKeyABIReturn`](/docs/client#PublicKeyABIReturn)

`PublicKey` parameter type.

#### `SignatureABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`SignatureABIReturn`](/docs/client#SignatureABIReturn)

`Signature` parameter type.

#### `StringABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`StringABIReturn`](/docs/client#StringABIReturn)

`string` parameter type.

#### `VoidABIParameter`

*extends:*
  - [`ABIParameterBase`](/docs/client#ABIParameterBase)
  - [`VoidABIReturn`](/docs/client#VoidABIReturn)

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

Return type specification of a function in the [`ABI`](/docs/client#ABI) of a smart contract.

#### `ABIReturnBase`

Common properties of all [`ABIReturn`](/docs/client#ABIReturn) specifications.

##### `ABIReturnBase#optional`

`true` if the value can be `undefined`

##### `ABIReturnBase#forwardedValue`

`true` if the smart contract expects this value to be forwarded by another smart contract.


#### `AddressABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`Address` return type.

##### `AddressABIReturn#type`

`'Address'`

#### `ArrayABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`Array` return type.

##### `ArrayABIReturn#type`

`'Array'`

##### `ArrayABIReturn#value`

Value type of the `Array`.

#### `BooleanABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`boolean` return type.

##### `BooleanABIReturn#type`

`'Boolean'`

#### `BufferABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

##### `BufferABIReturn#type`

`'Buffer'`

#### `ForwardValueABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

[`ForwardValue`](/docs/client#ForwardValue) return type.

##### `ForwardValueABIReturn#type`

`'ForwardValue'`

#### `Hash256ABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

[`Hash256`](/docs/client#Hash256) return type.

##### `Hash256ABIReturn#type`

`'Hash256'`

#### `IntegerABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`Fixed<decimals>` return type. `decimals` indicates to the client APIs how many decimals the integer represents.

##### `IntegerABIReturn#type`

`'Integer'`

##### `IntegerABIReturn#decimals`

Number of decimals values of this type represent.

#### `MapABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`Map` return type.

##### `MapABIReturn#type`

`'Map'`

##### `MapABIReturn#key`

Key type of the `Map`.

##### `MapABIReturn#value`

Value type of the `Map`.

#### `ObjectABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`Object` return type.

##### `ObjectABIReturn#type`

`'Object'`

##### `ObjectABIReturn#properties`

Properties of the `Object`.

#### `PublicKeyABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`PublicKey` return type.

##### `PublicKeyABIReturn#type`

`'PublicKey'`

#### `SignatureABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`Signature` return type.

##### `SignatureABIReturn#type`

`'Signature'`

#### `StringABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`string` return type.

##### `StringABIReturn#type`

`'String'`

#### `VoidABIReturn`

*extends:*
 - [`ABIReturnBase`](/docs/client#ABIReturnBase)

`void` return type.

##### `VoidABIReturn#type`

`'Void'`

#### `ABIDefault`

```typescript
type ABIDefault = SenderAddressABIDefault;
```

Default value for the constructor/deploy parameter.

#### `SenderAddressABIDefault`

Default value is the [`Transaction`](/docs/client#Transaction) sender `Address`

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

Provides the core functionality required by the [`DeveloperClient`](/docs/client#DeveloperClient).

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

Common [`Hash256String`](/docs/client#Hash256String)s.

##### `Hash256.NEO`

[`Hash256String`](/docs/client#Hash256String) of the NEO [`Asset`](/docs/client#Asset).

##### `Hash256.GAS`

[`Hash256String`](/docs/client#Hash256String) of the GAS [`Asset`](/docs/client#Asset).

#### `nep5`

#### `createPrivateKey`

```typescript
const createPrivateKey = (): PrivateKeyString
```

Creates a new cryptographically secure private key. Returns hex-encoded private key.

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

Decrypts a private key encrypted using the NEP-2 standard with the given password. Returns hex-encoded private key.

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

Encrypts a private key with a password using the NEP-2 standard. Returns NEP-2 format encrypted key.

#### `isNEP2`

```typescript
const isNEP2 = (encryptedKey: string): boolean
```

Validates if a given string is a NEP-2 encrypted private key. Returns `true` if it's a valid NEP-2 key, `false` otherwise.

#### `addressToScriptHash`

```typescript
const addressToScriptHash = (address: AddressString): string
```

Converts a base58 encoded NEO `Address` into a `Hash160` script hash. Returns `Hash160` string, a hex encoded string prefixed by '0x'.

#### `privateKeyToAddress`

```typescript
const privateKeyToAddress = (privateKey: PrivateKeyString): AddressString
```

Converts a hex-encoded private key to a base58 encoded NEO `Address`. Returns base58 encoded string that represents a NEO address.

#### `privateKeyToPublicKey`

```typescript
const privateKeyToPublicKey = (privateKey: PrivateKeyString): PublicKeyString
```

Converts a hex-encoded private key to a hex-encoded public key. Returns hex-encoded public key.

#### `privateKeyToScriptHash`

```typescript
const privateKeyToScriptHash = (privateKey: PrivateKeyString): string
```

Converts a hex-encoded private key to a `Hash160` script hash. Returns `Hash160` string, a hex encoded string prefixed by '0x'.

#### `privateKeyToWIF`

```typescript
const privateKeyToWIF = (privateKey: PrivateKeyString): string
```

Converts a hex-encoded private key to a wallet-import-format (WIF) private key. Returns wallet-import-format (WIF) private key.

#### `publicKeyToAddress`

```typescript
const publicKeyToAddress = (publicKey: PublicKeyString): AddressString
```

Converts a hex-encoded public key into a base58 encoded NEO `Address`. Returns base58 encoded string that represents a NEO address.

#### `publicKeyToScriptHash`

```typescript
const publicKeyToScriptHash = (publicKey: PublicKeyString): string
```

Converts a hex-encoded public key into a `Hash160` script hash. Returns `Hash160` string, a hex encoded string prefixed by '0x'.

#### `scriptHashToAddress`

```typescript
const scriptHashToAddress = (scriptHash: string): AddressString
```

Converts a `Hash160` script hash into a base58 encoded NEO `Address`. Returns base58 encoded string that represents a NEO address.

#### `wifToPrivateKey`

```typescript
const wifToPrivateKey = (wif: string): PrivateKeyString
```

Converts a wallet-import-format (WIF) private key to a hex-encoded private key. Returns hex-encoded private key.

---

## Blockchain Data Types

[[toc-reference]]

---

#### `Account`

An [`Account`](/docs/client#Account) represents the balances of NEO, GAS an other native assets at a given `Address`.

##### `Account#address`

The address of this [`Account`](/docs/client#Account).

##### `Account#balances`

A mapping from a [`Hash256String`](/docs/client#Hash256String) of a native [`Asset`](/docs/client#Asset) to the value of the held by the `address` for this [`Account`](/docs/client#Account). May be `undefined` if the `address` has 0 balance.

#### `Asset`

Attributes of a first class asset. Users will typically only interact with the NEO and GAS [`Asset`](/docs/client#Asset)s.

```typescript
const asset = readClient.getAsset(Hash256.NEO);
const neoAmount = asset.amount;
```

##### `Asset#hash`

[`Hash256String`](/docs/client#Hash256String) of this [`Asset`](/docs/client#Asset).

##### `Asset#type`

Type of the [`Asset`](/docs/client#Asset). See [`AssetType`](/docs/client#AssetType).

#### `Asset#name`

Name of the [`Asset`](/docs/client#Asset).

#### `Asset#amount`

Total possible supply of the [`Asset`](/docs/client#Asset).

#### `Asset#available`

Amount currently available of the [`Asset`](/docs/client#Asset).

#### `Asset#precision`

Precision (number of decimal places) of the [`Asset`](/docs/client#Asset).

#### `Asset#owner`

Owner of the [`Asset`](/docs/client#Asset).

#### `Asset#admin`

Admin of the [`Asset`](/docs/client#Asset).

#### `Asset#issuer`

Issuer of the [`Asset`](/docs/client#Asset).

#### `Asset#expiration`

Unix timestamp of when the [`Asset`](/docs/client#Asset) must be renewed by or it expires.

#### `Asset#frozen`

`true` if no transfers are allowed with the [`Asset`](/docs/client#Asset).

#### `AssetType`

Constants that describe the type of [`Asset`](/docs/client#Asset). The two most important ones are `'Governing'` and `'Utility'` which are reserved for NEO and GAS respectively.

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

[`Attribute`](/docs/client#Attribute)s are used to store additional data on [`Transaction`](/docs/client#Transaction)s. Most [`Attribute`](/docs/client#Attribute)s are used to store arbitrary data, whereas some, like [`AddressAttribute`](/docs/client#AddressAttribute), have specific uses in the NEO protocol.

```typescript
type Attribute =
  | BufferAttribute
  | PublicKeyAttribute
  | Hash256Attribute
  | AddressAttribute;
```

#### `AttributeBase`

Base interface for [`Attribute`](/docs/client#Attribute)s.

##### `AttributeBase#usage`

`usage` distinguishes the various [`Attribute`](/docs/client#Attribute) types.

#### `AttributeUsage`

[`Attribute`](/docs/client#Attribute) usage flag indicates the type of the data.

```typescript
type AttributeUsage =
  | BufferAttributeUsage
  | PublicKeyAttributeUsage
  | Hash256AttributeUsage
  | AddressAttributeUsage;
```

#### `AddressAttribute`

*extends:*
  -[`AttributeBase`](/docs/client#AttributeBase)

[`Attribute`](/docs/client#Attribute) whose data is an [`AddressString`](/docs/client#AddressString).

##### `AddressAttribute#usage`

`usage` distinguishes [`AddressAttribute`](/docs/client#AddressAttribute) from other [`Attribute`](/docs/client#Attribute) object types.

##### `AddressAttribute#data`

NEO `Address` as a string of the [`Attribute`](/docs/client#Attribute).

#### `AddressAttributeUsage`

```typescript
type AddressAttributeUsage = 'Script';
```

[`Attribute`](/docs/client#Attribute) usage flag indicating the data is a [`Hash256`](/docs/client#Hash256).


#### `BufferAttribute`

*extends:*
  -[`AttributeBase`](/docs/client#AttributeBase)

[`Attribute`](/docs/client#Attribute) whose data is an arbitrary [`BufferString`](/docs/client#BufferString).

##### `BufferAttribute#usage`

`usage` distinguishes [`BufferAttribute`](/docs/client#BufferAttribute) from other [`Attribute`](/docs/client#Attribute) object types.

##### `BufferAttribute#data`

Hex encoded data of the [`Attribute`](/docs/client#Attribute).

#### `BufferAttributeUsage`

[`Attribute`](/docs/client#Attribute) usage flag indicating the data is an arbitrary `Buffer`.

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
  -[`AttributeBase`](/docs/client#AttributeBase)

[`Attribute`](/docs/client#Attribute) whose data is a [`Hash256`](/docs/client#Hash256).

#### `Hash256Attribute#usage`

`usage` distinguishes `Hash256Attribute` from other [`Attribute`](/docs/client#Attribute) object types.

#### `Hash256Attribute#data`

NEO [`Hash256`](/docs/client#Hash256) as a string of the [`Attribute`](/docs/client#Attribute).

#### `Hash256AttributeUsage`

[`Attribute`](/docs/client#Attribute) usage flag indicating the data is a [`Hash256`](/docs/client#Hash256).

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
  -[`AttributeBase`](/docs/client#AttributeBase)

[`Attribute`](/docs/client#Attribute) whose data is a `PublicKeyString`.

##### `PublicKeyAttribute#usage`

`usage` distinguishes [`PublicKeyAttribute`](/docs/client#PublicKeyAttribute) from other [`Attribute`](/docs/client#Attribute) object types.

#### `PublicKeyAttribute#data`

Public key as a string of the [`Attribute`](/docs/client#Attribute).

#### `PublicKeyAttributeUsage`

[`Attribute`](/docs/client#Attribute) usage flag indicating the data is a `PublicKey`.

```typescript
type PublicKeyAttributeUsage = 'ECDH02' | 'ECDH03';
```

#### `Block`

*extends:*
  - [`Header`](/docs/client#Header)

##### `Block#transactions`

[`Transaction`](/docs/client#Transaction)s contained in the [`Block`](/docs/client#Block).

#### `Contract`

Attributes of a deployed smart contract.

##### `Contract#version`

NEO protocol version.

##### `Contract#address`

[`AddressString`](/docs/client#AddressString) of this [`Contract`](/docs/client#Contract).

##### `Contract#script`

[`Contract`](/docs/client#Contract) code.

##### `Contract#parameters`

Expected parameters of this [`Contract`](/docs/client#Contract).

##### `Contract#returnType`

Return type of this [`Contract`](/docs/client#Contract).

##### `Contract#name`

Name of this [`Contract`](/docs/client#Contract). For informational purposes only.

##### `Contract#codeVersion`

Version of this [`Contract`](/docs/client#Contract). For informational purposes only.

##### `Contract#author`

Author of this [`Contract`](/docs/client#Contract). For informational purposes only.

##### `Contract#email`

Email of this [`Contract`](/docs/client#Contract). For informational purposes only.

##### `Contract#description`

Description of this [`Contract`](/docs/client#Contract). For informational purposes only.

##### `Contract#storage`

`true` if this [`Contract`](/docs/client#Contract) can use storage.

##### `Contract#dynamicInvoke`

`true` if this [`Contract`](/docs/client#Contract) can make dynamic invocations.

##### `Contract#payable`

`true` if this [`Contract`](/docs/client#Contract) accepts first-class [`Asset`](/docs/client#Asset)s and/or tokens.

#### `Header`

All of the properties of a [`Block`](/docs/client#Block) except the [`Transaction`](/docs/client#Transaction)s themselves.

#### `Header#version`

NEO blockchain version.

#### `Header#hash`

[`Block`](/docs/client#Block) hash.

#### `Header#previousBlockHash`

Previous [`Block`](/docs/client#Block) hash.

#### `Header#merkleRoot`

Merkle Root of the [`Transaction`](/docs/client#Transaction)s of this [`Block`](/docs/client#Block).

#### `Header#time`

[`Block`](/docs/client#Block) time persisted.

#### `Header#index`

[`Block`](/docs/client#Block) index.

#### `Header#nonce`

Unique number to ensure the block hash is always unique.

#### `Header#nextConsensus`

Next consensus address.

#### `Header#script`

"Witness" to the [`Block`](/docs/client#Block)'s validity.

#### `Header#size`

 Size in bytes of the [`Block`](/docs/client#Block).

#### `Input`

[`Input`](/docs/client#Input)s are a reference to an [`Output`](/docs/client#Output) of a [`Transaction`](/docs/client#Transaction) that has been persisted to the blockchain. The sum of the `value`s of the referenced [`Output`](/docs/client#Output)s is the total amount transferred in the [`Transaction`](/docs/client#Transaction).

##### `Input#hash`

Hash of the [`Transaction`](/docs/client#Transaction) this input references.

##### `Input#index`

[`Output`](/docs/client#Output) index within the [`Transaction`](/docs/client#Transaction) this input references.

#### `Output`

[`Output`](/docs/client#Output)s represent the destination `Address` and amount transferred of a given [`Asset`](/docs/client#Asset). The sum of the unspent [`Output`](/docs/client#Output)s of an `Address` represent the total balance of the `Address`.

##### `Output#asset`

Hash of the [`Asset`](/docs/client#Asset) that was transferred.

##### `Output#value`

Amount transferred.

##### `Output#address`

Destination `Address`.

#### `Witness`

[`Witness`](/docs/client#Witness) is just that, a "witness" to the transaction, meaning they have approved the transaction. Can vary from a simple signature of the transaction for a given `Address`' private key or a "witness" being a smart contract and the way it's verified is by executing the smart contract code.

##### `Witness#invocation`

Sets up the stack for the `verification` script.

##### `Witness#verification`

A script that should leave either a `true` value on the stack if the [`Witness`](/docs/client#Witness) is valid, or `false` otherwise.

#### `Transaction`

[`Transaction`](/docs/client#Transaction)s are relayed to the blockchain and contain information that is to be permanently stored on the blockchain. They may contain [`Input`](/docs/client#Input)s and [`Output`](/docs/client#Output)s corresponding to transfers of native [`Asset`](/docs/client#Asset)s. Each [`Transaction`](/docs/client#Transaction) type serves a particular purpose, see the documentation for each for more information.

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

Base interface for all [`Transaction`](/docs/client#Transaction)s.

##### `TransactionBase#version`

NEO protocol version.

##### `TransactionBase#hash`

[`Hash256`](/docs/client#Hash256) of this [`Transaction`](/docs/client#Transaction).

##### `TransactionBase#size`

Byte size of this [`Transaction`](/docs/client#Transaction).

##### `TransactionBase#attributes`

[`Attribute`](/docs/client#Attribute)s attached to the [`Transaction`](/docs/client#Transaction).

##### `TransactionBase#inputs`

[`Input`](/docs/client#Input)s of the [`Transaction`](/docs/client#Transaction).

##### `TransactionBase#outputs`

[`Output`](/docs/client#Output)s of the [`Transaction`](/docs/client#Transaction).

##### `TransactionBase#scripts`

[`Witness`](/docs/client#Witness)es to the [`Transaction`](/docs/client#Transaction), i.e. the `Address`es that have signed the [`Transaction`](/docs/client#Transaction).

##### `TransactionBase#systemFee`

GAS execution fee for the transaction.

##### `TransactionBase#networkFee`

GAS network priority fee for the transaction.


#### `ClaimTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

Claims GAS for a set of spent [`Output`](/docs/client#Output)s.

##### `ClaimTransaction#type`

`type` distinguishes [`ClaimTransaction`](/docs/client#ClaimTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

##### `ClaimTransaction#claims`

The spent outputs that this [`ClaimTransaction`](/docs/client#ClaimTransaction) is claiming `GAS` for.

#### `ContractTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

Transfers first class [`Asset`](/docs/client#Asset)s.

##### `ContractTransaction#type`

`type` distinguishes [`ContractTransaction`](/docs/client#ContractTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

#### `EnrollmentTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

Enrolls a new validator for a given `PublicKey`.

##### `EnrollmentTransaction#type`

`type` distinguishes [`EnrollmentTransaction`](/docs/client#EnrollmentTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

##### `EnrollmentTransaction#publicKey`

The public key that is being enrolled as a validator.

#### `InvocationTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

Runs a script in the NEO VM.

##### `InvocationTransaction#type`

`type` distinguishes [`InvocationTransaction`](/docs/client#InvocationTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

##### `InvocationTransaction#script`

Script to execute in the NEO VM.

##### `InvocationTransaction#gas`

GAS that has been attached to be used for the `systemFee` of the [`Transaction`](/docs/client#Transaction). All attached GAS will be consumed by this operation, regardless of if execution fails or provides too much GAS.

#### `IssueTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

Issues new currency of a first-class [`Asset`](/docs/client#Asset).

##### `IssueTransaction#type`

`type` distinguishes [`IssueTransaction`](/docs/client#IssueTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

#### `MinerTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

First [`Transaction`](/docs/client#Transaction) in each block which contains the [`Block`](/docs/client#Block) rewards for the consensus node that produced the [`Block`](/docs/client#Block).

##### `MinerTransaction#type`

`type` distinguishes [`MinerTransaction`](/docs/client#MinerTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

##### `MinerTransaction#nonce`

Unique number in order to ensure the hash for this transaction is unique.

#### `PublishTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

Registers a new [`Contract`](/docs/client#Contract).

##### `PublishTransaction#type`

`type` distinguishes [`PublishTransaction`](/docs/client#PublishTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

##### `PublishTransaction#contract`

[`Contract`](/docs/client#Contract) to publish.

#### `RegisterTransaction`

*extends:*
- [`TransactionBase`](/docs/client#TransactionBase)

Registers a new first class [`Asset`](/docs/client#Asset).

##### `RegisterTransaction#type`

`type` distinguishes `RegisterTransaction` from other [`Transaction`](/docs/client#Transaction) object types.

##### `RegisterTransaction#asset`

[`Asset`](/docs/client#Asset) information to register.

#### `StateTransaction`

*extends:*
  - [`TransactionBase`](/docs/client#TransactionBase)

##### `StateTransaction#type`

`type` distinguishes [`StateTransaction`](/docs/client#StateTransaction) from other [`Transaction`](/docs/client#Transaction) object types.

#### `ConfirmedTransaction`

[`Transaction`](/docs/client#Transaction) that has been confirmed on the blockchain. Includes all of the same properties as a [`Transaction`](/docs/client#Transaction) as well as the [`TransactionReceipt`](/docs/client#TransactionReceipt) of the confirmation.

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

Common properties for all [`ConfirmedTransaction`](/docs/client#ConfirmedTransaction)s.

##### `ConfirmedTransactionBase#receipt`

"Receipt" of the confirmed transaction on the blockchain. This contains properties like the block the [`Transaction`](/docs/client#Transaction) was included in.

#### `ConfirmedClaimTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`ClaimTransaction`](/docs/client#ClaimTransaction)

Confirmed variant of [`ClaimTransaction`](/docs/client#ClaimTransaction)

#### `ConfirmedContractTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`ContractTransaction`](/docs/client#ContractTransaction)

Confirmed variant of [`ContractTransaction`](/docs/client#ContractTransaction)

#### `ConfirmedEnrollmentTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`EnrollmentTransaction`](/docs/client#EnrollmentTransaction)

Confirmed variant of [`EnrollmentTransaction`](/docs/client#EnrollmentTransaction).

#### `ConfirmedInvocationTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`InvocationTransaction`](/docs/client#InvocationTransaction)

Confirmed variant of [`InvocationTransaction`](/docs/client#InvocationTransaction).

#### `ConfirmedIssueTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`IssueTransaction`](/docs/client#IssueTransaction)

Confirmed variant of [`IssueTransaction`](/docs/client#IssueTransaction).

#### `ConfirmedMinerTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`MinerTransaction`](/docs/client#MinerTransaction)

Confirmed variant of [`MinerTransaction`](/docs/client#MinerTransaction).

#### `ConfirmedPublishTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`PublishTransaction`](/docs/client#PublishTransaction)

Confirmed variant of [`PublishTransaction`](/docs/client#PublishTransaction).

#### `ConfirmedRegisterTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - `RegisterTransaction`

Confirmed variant of `RegisterTransaction`.

#### `ConfirmedStateTransaction`

*extends:*
  - [`ConfirmedTransactionBase`](/docs/client#ConfirmedTransactionBase)
  - [`StateTransaction`](/docs/client#StateTransaction)

Confirmed variant of [`StateTransaction`](/docs/client#StateTransaction).

---

## Raw Data Types

[[toc-reference]]

---

#### `RawAction`

Raw action emitted during an invocation. Low-level API for advanced usage only.

#### `RawActionBase`

Base properties of [`Event`](/docs/client#Event)s and [`Log`](/docs/client#Log)s as well as their raw counterparts, [`RawNotification`](/docs/client#RawNotification) and [`RawLog`](/docs/client#RawLog), respectively.

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

Additional raw data that is typically processed by an [`ABI`](/docs/client#ABI) for the client APIs.

##### `RawInvocationData#asset`

[`Asset`](/docs/client#Asset) created by the invocation.

##### `RawInvocationData#contracts`

[`Contract`](/docs/client#Contract)s created by the invocation.

##### `RawInvocationData#deletedContractAddresses`

[`Contract`](/docs/client#Contract)s deleted by the invocation.

##### `RawInvocationData#migratedContractAddresses`

[`Contract`](/docs/client#Contract)s migrated (upgraded) by the invocation.

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

Common [`InvocationResult`](/docs/client#InvocationResult) and [`RawInvocationResult`](/docs/client#RawInvocationResult) properties.

##### `RawInvocationResultBase#gasConsumed`

GAS consumed by the operation. This is the total GAS consumed after the free GAS is subtracted.

##### `RawInvocationResultBase#gasCost`

The total GAS cost before subtracting the free GAS.

#### `RawInvocationResultError`

*extends:*
  - [`RawInvocationResultBase`](/docs/client#RawInvocationResultBase)

Raw result of a failed invocation. Low-level API for advanced usage only.

##### `RawInvocationResultError#state`

Indicates a failed invocation.

##### `RawInvocationResultError#stack`

The state of the NEO VM after execution. Typically has one [`ContractParameter`](/docs/client#ContractParameter) which is the return value of the method invoked.

##### `RawInvocationResultError#message`

A descriptive message indicating why the invocation failed.

#### `RawInvocationResultSuccess`

*extends:*
  - [`RawInvocationResultBase`](/docs/client#RawInvocationResultBase)

Raw result of a successful invocation. Low-level API for advanced usage only.

##### `RawInvocationResultSuccess#state`

Indicates a successful invocation.

##### `RawInvocationResultSuccess#stack`

The state of the NEO VM after execution. Typically has one [`ContractParameter`](/docs/client#ContractParameter) which is the return value of the method invoked.

#### `RawLog`

Raw log emitted during an invocation.

#### `RawLog#type`

`type` differentiates the [`RawLog`](/docs/client#RawLog) object from other [`RawAction`](/docs/client#RawAction) objects, i.e. [`RawNotification`](/docs/client#RawNotification).

#### `RawLog#message`

The raw message. This is unprocessed in the `message`.

#### `RawNotification`

*extends:*
  - [`RawActionBase`](/docs/client#RawActionBase)

Raw notification emitted during an invocation. This is the unprocessed counterpart to an [`Event`](/docs/client#Event). Low-level API for advanced usage only.

##### `RawNotification#type`

`type` differentiates the [`RawNotification`](/docs/client#RawNotification) object from other [`RawAction`](/docs/client#RawAction) objects, i.e. [`RawLog`](/docs/client#RawLog).

##### `RawNotification#args`

The raw arguments of the notifications. These are processed into the `parameters` parameter of the [`Event`](/docs/client#Event) object using the [`ABI`](/docs/client#ABI).

#### `ContractParameter`

[`ContractParameter`](/docs/client#ContractParameter)s are the serialized stack items of an invocation. These are typically the raw results of an invocation, but they may appear in other raw contexts. Low-level API for advanced usage only.

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

All of the possible `type`s that a [`ContractParameter`](/docs/client#ContractParameter) may have.

#### `AddressContractParameter`

Invocation stack item for an `Address`.

##### `AddressContractParameter#type`

`type` distinguishes [`AddressContractParameter`](/docs/client#AddressContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `AddressContractParameter#value`

NEO address in base58 encoded string format.

#### `ArrayContractParameter`

Invocation stack item for an `Array`.

##### `ArrayContractParameter#type`

`type` distinguishes [`ArrayContractParameter`](/docs/client#ArrayContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `ArrayContractParameter#value`

An array of [`ContractParameter`](/docs/client#ContractParameter)s.

#### `BooleanContractParameter`

Invocation stack item for a `boolean`.

##### `BooleanContractParameter#type`

`type` distinguishes [`BooleanContractParameter`](/docs/client#BooleanContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `BooleanContractParameter#value`

Raw boolean value.

#### `BufferContractParameter`

Invocation stack item for a `Buffer`.

##### `BufferContractParameter#type`

`type` distinguishes [`BufferContractParameter`](/docs/client#BufferContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `BufferContractParameter#value`

Hex encoded `Buffer` string.

#### `Hash256ContractParameter`

Invocation stack item for a [`Hash256`](/docs/client#Hash256).

##### `Hash256ContractParameter#type`

`type` distinguishes [`Hash256ContractParameter`](/docs/client#Hash256ContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `Hash256ContractParameter#value`

 NEO [`Hash256`](/docs/client#Hash256) encoded as a string.

#### `IntegerContractParameter`

Invocation stack item for a `BN`.

##### `IntegerContractParameter#type`

Note that unlike most of the client APIs, we use a `BN` instead of a `BigNumber` here to indicate that this is an integer value.

##### `IntegerContractParameter#value`

For example, an [`IntegerContractParameter`](/docs/client#IntegerContractParameter) that represents a NEO value of 10 would be a `new BN(10_00000000)`.

#### `InteropInterfaceContractParameter`

Invocation stack item for anything other than the other valid contract parameters. Examples include the [`Block`](/docs/client#Block) builtin. If these builtins remain on the stack after invocation, for example, as a return value, then they will be serialized as this empty interface.

##### `InteropInterfaceContractParameter#type`

`type` distinguishes [`InteropInterfaceContractParameter`](/docs/client#InteropInterfaceContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

#### `MapContractParameter`

Invocation stack item for a `Map`.

##### `MapContractParameter#type`

`type` distinguishes [`MapContractParameter`](/docs/client#MapContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `MapContractParameter#value`

A map of [`ContractParameter`](/docs/client#ContractParameter) to [`ContractParameter`](/docs/client#ContractParameter). Represented as an array of pairs because JavaScript `Map` keys do not have the same semantics as the NEO VM.

#### `PublicKeyContractParameter`

Invocation stack item for a `PublicKey`.

##### `PublicKeyContractParameter#type`

`type` distinguishes [`PublicKeyContractParameter`](/docs/client#PublicKeyContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `PublicKeyContractParameter#value`

String format of a public key.

#### `SignatureContractParameter`

Invocation stack item for a `Signature`.

##### `SignatureContractParameter#type`

`type` distinguishes [`SignatureContractParameter`](/docs/client#SignatureContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `SignatureContractParameter#value`

Raw signature string.

#### `StringContractParameter`

Invocation stack item for a `string`.

##### `StringContractParameter#type`

`type` distinguishes [`StringContractParameter`](/docs/client#StringContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.

##### `StringContractParameter#value`

Raw string value.

#### `VoidContractParameter`

Invocation stack item for `void`.

##### `VoidContractParameter#type`

`type` distinguishes [`VoidContractParameter`](/docs/client#VoidContractParameter) from other [`ContractParameter`](/docs/client#ContractParameter) object types.
