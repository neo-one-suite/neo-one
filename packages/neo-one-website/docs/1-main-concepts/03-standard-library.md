---
slug: standard-library
title: Standard Library
---

NEO•ONE includes a library of standard smart contract values, functions, interfaces and classes.

This chapter will go into detail on some of the more common values and types that we will use throughout the guide. While working through the rest of the chapters you may want to keep this page handy.

For more details, check out the [Smart Contract](/reference/@neo-one/smart-contract) reference.

---

[[toc]]

---

## Value Types

The standard library includes several specialized value types which are defined in a way that makes them difficult to use incorrectly. For example, it's a static compile time error to pass an `Address` where a `Hash256` is expected, even though both are really just [`Buffer`s](https://nodejs.org/api/buffer.html) underneath the hood.

- `Address` - a `Buffer` that represents a NEO address.
- `Hash256` - a `Buffer` that represents a NEO 256 bit hash, most commonly used for asset ids like `NEO` or `GAS` asset ids.
- `PublicKey` - a `Buffer` that represents a public key.

Each of the value types can be created from a string literal using the `from` [static method](https://www.typescriptlang.org/docs/handbook/classes.html#static-properties), for example, `Address.from('APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR')`. `Hash256` also contains static properties for the `NEO` and `GAS` `Hash256` values.

The `Address` type has a commonly used static method, `isCaller`, which is used to check that the passed `Address` directly called and approved the current method invocation.

```typescript
Address.isCaller(address);
```

`Address.isCaller` should be used whenever you want to take an action for a given `Address`. For example, you would want to check `Address.isCaller(address)` before transferring tokens from the `address` to another party.

---

## Tagged Types

Tagged types are the same as their underlying type, but we've "tagged" them with a piece of compile-time data. NEO•ONE currently contains two tagged types, and their tags are used exclusively for generating the corresponding NEO•ONE client APIs for the smart contract. The most common tagged type and the only one we'll use throughout the guide is the `Fixed` type.

The `Fixed<T>` type tags a `number` with the number of decimals that it represents. All `number`s in TypeScript smart contracts are integers since there are no floating point values in smart contracts. However, we typically consider the values we're working with to have decimals from the user's point of view and `Fixed<T>` helps capture that notion.

For example, the `Fixed<2>` type tells the NEO•ONE toolchain that the integer value represents a fixed point decimal with 2 places. In other words, when we have the value `1250` in a smart contract, it really means `12.50` to the user. The NEO•ONE toolchain uses this information to generate client APIs that automatically convert from the integer representation to the decimal point representation and visa-versa.

This makes it easy to do things like display the result of a smart contract method invocation that returns a `Fixed<2>`. Simply convert it to a string since the client APIs have already converted it to the decimal representation. Similarly, for dapp inputs, simply take the user's decimal value and pass it directly to the NEO•ONE client APIs, under the hood it will convert appropriately.

---

## Blockchain and Transaction Information

The `Blockchain` value contains several properties pertaining to the current state of the blockchain, the current transaction and the current invocation:

- `Blockchain.currentBlockTime` - the timestamp of the `Block` that this `Transaction` will be included in.
- `Blockchain.currentHeight` - index of the last `Block` persisted to the blockchain.
- `Blockchain.currentTransaction` - the current `InvocationTransaction`.
- `Blockchain.currentCallerContract` - the `Address` of the smart contract that directly invoked this contract. May be `undefined` if the current invocation was not from another smart contract.

---

## Opaque Tag Symbol

If you look at the definition file for the standard library, you might notice a property `OpaqueTagSymbol0`, `OpaqueTagSymbol1`, `one0` or `one1` that is present on all types, including global types like `Array` or `Map`. In order to emit the most efficient NEO VM bytecode possible, we have specialized implementations of all of the standard library types. One limitation of this approach, however, is that you must explicitly use the types. For example, you can't pass an `Array` where an `Array`-like but not `Array` interface is expected. Adding the `OpaqueTagSymbol0`, `OpaqueTagSymbol1`, `one0`, or `one1` properties helps enforce this as a static type error, but it does not catch all cases (though we're working on improving this).

As a rule of thumb, don't rely on ["Duck Typing"](https://en.wikipedia.org/wiki/Duck_typing), instead always be explicit about the types you're using.
