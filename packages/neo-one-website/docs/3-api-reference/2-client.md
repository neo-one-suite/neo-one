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
#### `UpdateAccountNameOptions`
#### `UserAccountProvider`

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

```typescript
type NetworkType =
  | 'main'
  | 'test'
  | string;
```

#### `Transfer`
#### `GetOptions`
#### `BlockFilter`

#### `TransactionOptions`

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
#### `NetworkSettings`

---

## UserAccountProvider

[[toc-reference]]

---

#### `LocalUserAccountProvider`
#### `LocalKeyStore`
#### `LocalMemoryStore`
#### `LocalStringStore`
#### `UnlockedWallet`
#### `LocalWallet`
#### `NEOONEDataProvider`
#### `NEOONEDataProviderOptions`
#### `NEOONEOneDataProvider`
#### `NEOONEProvider`
#### `Peer`
#### `JSONRPCProvider`
#### `JSONRPCRequest`
#### `JSONRPCResponse`
#### `RelayTransactionResult`
#### `VerifyTransactionResult`
#### `VerifyScriptResult`

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
#### `InvokeSendUnsafeTransactionOptions`
#### `ForwardOptions`
#### `ForwardValue`
#### `Action`
#### `Event`
#### `EventParameters`
#### `Log`
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
#### `PrivateNetworkSettings`
#### `LocalClient`
#### `OneClient`

---

## Utility

[[toc-reference]]

---

#### `Hash256`
#### `nep5`
#### `createPrivateKey`
#### `decryptNEP2`
#### `encryptNEP2`
#### `isNEP2`
#### `addressToScriptHash`
#### `privateKeyToAddress`
#### `privateKeyToPublicKey`
#### `privateKeyToScriptHash`
#### `privateKeyToWIF`
#### `publicKeyToAddress`
#### `publicKeyToScriptHash`
#### `scriptHashToAddress`
#### `wifToPrivateKey`

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
#### `Asset#frozen`

#### `AssetType`

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
#### `AttributeUsage`
#### `AddressAttribute`
#### `AddressAttributeUsage`
#### `BufferAttribute`
#### `BufferAttributeUsage`
#### `Hash256Attribute`
#### `Hash256AttributeUsage`
#### `PublicKeyAttribute`

#### `AddressAttributeUsage`

```typescript
type AddressAttributeUsage = 'Script';
```

`Attribute` usage flag indicating the data is a `Hash256`.

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

#### `PublicKeyAttributeUsage`

`Attribute` usage flag indicating the data is a `PublicKey`.

```typescript
type PublicKeyAttributeUsage = 'ECDH02' | 'ECDH03';
```

#### `Block`

##### `Block#transactions`

`Transaction`s contained in the `Block`.

#### `Contract`

##### `Contract#version`

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

#### `Header#version`

NEO blockchain version.

#### `Header#hash`

`Block` hash.

#### `Header#previousBlockHash`
#### `Header#merkleRoot`

#### `Header#time`

`Block` time persisted.

#### `Header#index`

`Block` index.

#### `Header#nonce`

#### `Header#nextConsensus`

Next consensus address.

#### `Header#script`
#### `Header#size`

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
##### `TransactionBase#systemFee`
##### `TransactionBase#networkFee`


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

Confirmed variant of `ClaimTransaction`

#### `ConfirmedContractTransaction`

Confirmed variant of `ContractTransaction`

#### `ConfirmedEnrollmentTransaction`

Confirmed variant of `EnrollmentTransaction`.

#### `ConfirmedInvocationTransaction`

Confirmed variant of `InvocationTransaction`.

#### `ConfirmedIssueTransaction`

Confirmed variant of `IssueTransaction`.

#### `ConfirmedMinerTransaction`

Confirmed variant of `MinerTransaction`.

#### `ConfirmedPublishTransaction`

Confirmed variant of `PublishTransaction`.

#### `ConfirmedRegisterTransaction`

Confirmed variant of `RegisterTransaction`.

#### `ConfirmedStateTransaction`

Confirmed variant of `StateTransaction`.

---

## Raw Data Types

[[toc-reference]]

---

#### `RawAction`
#### `RawActionBase`
#### `RawInvocationData`
#### `RawInvocationResult`
#### `RawInvocationResultError`
#### `RawInvocationResultSuccess`
#### `RawLog`
#### `RawNotification`
#### `ContractParameter`
#### `ContractParameterType`
#### `AddressContractParameter`
#### `ArrayContractParameter`
#### `BooleanContractParameter`
#### `BufferContractParameter`
#### `Hash256ContractParameter`
#### `IntegerContractParameter`
#### `InteropInterfaceContractParameter`
#### `MapContractParameter`
#### `PublicKeyContractParameter`
#### `SignatureContractParameter`
#### `StringContractParameter`
#### `VoidContractParameter`
