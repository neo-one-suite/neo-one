# Chapter 2: Processing Native Assets

In this chapter we'll start processing the native UTXO assets in the transaction that invokes our `mintTokens` function.

## Learn

The current transaction in NEO•ONE smart contracts can be accessed using `Blockchain.currentTransaction`. The transaction itself has many useful properties, but for now we are only interested in a few of them. Let's look at an example.

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

In this example, we're verifying that every output that is sent to the contract address (`this.address`) is GAS. We're also checking that there's exactly one reference. A reference is the corresponding `output` for the `input`s of the transaction. Learn more about `input`s and `output`s in the [Blockchain Basics](/docs/blockchain-basics) chapter of the main guide.

## Instructions

  1. Add a check that returns `false` if `references.length === 0` to the `mintTokens` method. We always want a sender for minting tokens, so we expect at least one input.
  2. Add a similar check as the example for verifying that the assets sent to the contract are always `Hash256.NEO`.

## Test

In this chapter the tests verify that we can only send NEO to the contract. If you get stuck, feel free to check out the solution, dealing with UTXO assets can be rather complex, particularly when learning them for the first time.

## Wrap Up

In this chapter we started to learn about processing native UTXO assets received in a transaction. We saw how to access the current transaction, how to fetch the corresponding `output`s for the transaction's `input`s and how to check for outputs that were sent to the contract.
