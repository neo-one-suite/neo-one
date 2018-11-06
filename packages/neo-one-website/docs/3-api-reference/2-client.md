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
#### `UserAccountProvider`
#### `UserAccountProviders`
#### `AddressString`
#### `Hash256String`
#### `PublicKeyString`
#### `BufferString`
#### `UserAccount`
#### `UserAccountID`
#### `NetworkType`
#### `Transfer`
#### `GetOptions`
#### `TransactionOptions`
#### `TransactionReceipt`
#### `TransactionResult`

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



#### `InvokeSendUnsafeReceiveTransactionOptions`
#### `InvokeSendUnsafeTransactionOptions`
#### `ForwardOptions`
#### `ForwardValue`
#### `Action`
#### `Event`
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
#### `Asset`
#### `AssetType`
#### `Attribute`
#### `AddressAttributeUsage`
#### `BufferAttributeUsage`
#### `Hash256AttributeUsage`
#### `PublicKeyAttributeUsage`
#### `Block`
#### `Contract`
#### `Header`
#### `Witness`
#### `Transaction`
#### `TransactionBase`
#### `ClaimTransaction`
#### `ContractTransaction`
#### `EnrollmentTransaction`
#### `InvocationTransaction`
#### `IssueTransaction`
#### `MinerTransaction`
#### `PublishTransaction`
#### `RegisterTransaction`
#### `StateTransaction`
#### `Input`
#### `Output`
#### `ConfirmedTransaction`
#### `ConfirmedTransactionBase`
#### `ConfirmedClaimTransaction`
#### `ConfirmedContractTransaction`
#### `ConfirmedEnrollmentTransaction`
#### `ConfirmedInvocationTransaction`
#### `ConfirmedIssueTransaction`
#### `ConfirmedMinerTransaction`
#### `ConfirmedPublishTransaction`
#### `ConfirmedRegisterTransaction`
#### `ConfirmedStateTransaction`

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
#### `PublicKeyContractParameter`
#### `SignatureContractParameter`
#### `StringContractParameter`
#### `VoidContractParameter`
