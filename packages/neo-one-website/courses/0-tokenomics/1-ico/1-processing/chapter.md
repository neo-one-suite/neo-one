# Chapter 2: Processing Native Assets

In this chapter we'll start processing the native UTXO assets in the transaction that invokes our `mintTokens` function.

## Learn

The current transaction in NEO•ONE smart contracts can be accessed using `Blockchain.currentTransaction`. The transaction itself has many useful properties, but the ones that we're only interested in a few of them. Let's look at an example.

```typescript
import { Blockchain, Hash256, receive, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @receive
  public receiveNativeAssets(): boolean {
    const { references, outputs } = Blockchain.currentTransaction;

    if (references.length !== 1) {
      return false;
    }

    for (const output of outputs) {
      if (output.address.equals(this.address)) {
        if (!output.asset.equals(Hash256.GAS)) {
          return false;
        }
      }
    }

    return true;
  }
}
```

In this example, we're verifying that every output that is sent to the contract address (`this.address`) is GAS. We're also checking that there's exactly one reference. A reference is the corresponding `output` for the `input`s of the transaction.

In this very simple example, we've defined a method annotated with `@receive`. This enables the method to receive native assets of any kind, including NEO and GAS. Methods marked with `@receive` must return a `boolean` value to indicate whether or not the contract wants to receive the assets. Note, however, that there are cases where the contract may still receive assets, despite returning `false`, due to limitations in how NEO handles native UTXO assets. For these cases, we automatically generate a `refundAssets` method that clients of your smart contract may call to refund assets which were not processed by the smart contract (i.e. the smart contract returned `false` or was not actually called).

## Instructions

  1. Add a check that returns `false` if `references.length === 0` to the `mintTokens` method. We always want a sender for minting tokens, so we expect at least one input.
  2. Add a similar check as the example for verifying that the assets sent to the contract are always `Hash256.NEO`.

## Test

In this chapter the tests verify that we can only send NEO to the contract. If you get stuck, feel free to check out the solution, dealing with UTXO assets can be rather complex, particularly when learning them for the first time.

## Wrap Up

In this chapter we started to learn about processing the assets that we received in the transaction. We saw how to access the current transaction, how to fetch the corresponding `output`s for the transaction's `input`s and how to check for outputs that were sent to the contract.
