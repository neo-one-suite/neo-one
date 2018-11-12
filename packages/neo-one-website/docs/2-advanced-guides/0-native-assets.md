---
slug: native-assets
title: Native Assets
---
Native assets like NEO and GAS require special handling in smart contracts. This guide will show you how.

NEO employs the [UTXO](https://en.wikipedia.org/wiki/Unspent_transaction_output) (unspent transaction output) system for native assets. Unfortunately, the UTXO system does not play well with smart contracts. Fortunately, NEO•ONE smart contracts abstract away most of the difficulty in handling native assets using the `@receive`, `@send`, `@sendUnsafe` and `@claim` [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html).

One commonality between every native asset method is that they must return a `boolean` indicating whether or not the transaction should proceed.

---

[[toc]]

---

## Receive Native Assets

Decorate a method with `@receive` to allow the method to be invoked when receiving native assets:

```typescript
export class Contract extends SmartContract {
  @receive
  public mintTokens(): boolean {
    // Use Blockchain.currentTransaction to validate and process the inputs/outputs.
    // Return false if it's an invalid combination

    return true;
  }
}
```

Methods decorated with `@receive` may also be decorated with `@sendUnsafe` to enable both sending and receiving assets to be verified by the method.

Invoking a method marked with `@receive` is identical to a normal method, but the transaction options contain an additional property, `sendTo`, which can be used to specify the assets to send to the smart contract:

```typescript
const receipt = await contract.mintTokens({
  sendTo: [{
    asset: Hash256.NEO,
    amount: new BigNumber(10),
  }],
})
```

There are cases where a smart contract may receive native assets without a corresponding `@receive` method invocation, or sometimes even when the `@receive` method returns `false`. Unfortunately this is unavoidable, and to solve these cases every smart contract has an automatically generated method called `refundAssets`. Users may call this method when they have sent assets to the contract that were not properly processed. Using the NEO•ONE client APIs:

```typescript
const transactionHash = ... // Hash of the transaction that needs to be refunded
const receipt = await contract.refundAssets.confirmed(transactionHash);
```

---

## Send Native Assets

NEO•ONE provides two methods for sending assets, one that is "unsafe" and one that is "safe".

### Unsafe

Decorate a method with `@sendUnsafe` to enable assets to be sent from the contract in a single transaction:

```typescript
export class Contract extends SmartContract {
  @sendUnsafe
  public withdraw(): boolean {
    // Typically check something like Address.isCaller(this.owner)
    return true;
  }
}
```

`@sendUnsafe` is unsafe because it potentially allows the equivalent of double spends. It's possible for a user to construct a series of parallel transactions that enable them to withdraw more than they should be allowed to.

::: warning

Note

Only decorate a method with `@sendUnsafe` when the method checks that the caller is a "superuser", i.e. someone who is not going to attempt to cheat the contract. The most common case is to simply call `Address.isCaller(this.owner)` which checks that the method was only invoked by the owner of the smart contract.

:::

Calling a method marked with `@sendUnsafe` is similar to `@receive` in that it allows an additional options property called `sendFrom` which lets the user specify assets to transfer from the contract:

```typescript
const receipt = await contract.withdraw.confirmed({
  sendFrom: [{
    asset: Hash256.NEO,
    amount: new BigNumber(10),
    to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
  }],
});
```

### Safe

Decorate a method with `@send` to enable assets to be sent from the contract safely. `@send` requires two transactions to send assets from the contract. At a high level the steps are:

  1. The user "marks" the assets they wish to withdraw from the contract by constructing a transaction that sends those assets back to the smart contract.
  2. The user constructs a transaction that withdraws the previously "mark"ed assets to the desired address.

NEO•ONE abstract this process such that you only need to define a method decorated with `@send` that returns `true` or `false`. NEO•ONE handles the rest. This method may also accept a final argument, a `Transfer` object, that contains the details of the pending transfer:

```typescript
interface Transfer {
  readonly amount: Fixed<8>;
  readonly asset: Hash256;
  readonly to: Address;
}
```

For example, if you wanted to have a method that required a single argument `value` of type `string`, you could define your method like so:

```typescript
export class Contract extends SmartContract {
  @send
  public withdraw(value: string, transfer: Transfer): boolean {
    // Validate the `transfer` should proceed. Return false if not.

    return true;
  }
}
```

Calling a method marked with `@send` is identical to `@sendUnsafe`, however, the transfer will not occur until the `completeSend` method is invoked with the transaction hash of the first transaction:

```typescript
// This transaction only sends assets from the contract to itself,
// marking them for withdrawal by a followup transaction.
const receipt = await contract.withdraw.confirmed('value', {
  sendFrom: [{
    asset: Hash256.NEO,
    amount: new BigNumber(10),
    to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
  }],
});
// Complete the withdrawal process using the transaction hash
const finalReceipt = await contract.completeSend.confirmed(receipt.transaction.hash);
```

---

## Claim GAS

Decorate a method with `@claim` to enable claiming GAS. `@claim` methods have a few restrictions:

  1. `@claim` methods may not modify contract storage. They act like `@constant` methods.
  2. `@claim` methods may not access `Blockchain.currentTransaction`, instead they may optionally accept the `ClaimTransaction` that the method was invoked in as the final argument.

```typescript
export class Contract extends SmartContract {
  @claim
  public claim(transaction: ClaimTransaction): boolean {
    // Validate the ClaimTransaction and return false if it is invalid

    return true;
  }
}
```

The NEO•ONE client APIs currently only support claiming all available GAS for a smart contract and sending that GAS back to the smart contract. If you have another use-case that you'd like to see supported, please reach out on [Discord](https://discordapp.com/invite/S86PqDE) or open an issue on [GitHub](https://github.com/neo-one-suite/neo-one/issues/new).

```typescript
await contract.claim.confirmed();
```

::: warning

Note

`@claim` is similar to `@sendUnsafe` in terms of safety and thus you should only allow GAS claims that transfer the GAS to an `Address` that is not the contract itself to be done by superusers. To enable GAS claims for contracts without owners or superusers, instead only allow GAS claims that send the GAS back to the contract, and then implement transferring the GAS to the rightful owner using a method marked with `@send`.

:::
