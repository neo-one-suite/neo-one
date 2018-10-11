# Chapter 1: Receiving NEO and GAS

In Lesson 2, we're going to add ICO functionality to our token smart contract. The token will

 - Enable minting tokens using NEO.
 - Start and end at a particular block time.
 - Limit the number of tokens minted.
 - Enable withdrawing the contributed NEO.

We'll also create a fully functioning ICO participation UI that live updates when tokens are minted using the NEO•ONE client APIs. There's quite a bit of ground to cover, so let's get started!

As a quick reminder, the same flow applies as in Lesson 1. Write the code -> `Build` -> `Run Tests` -> `Next Chapter` once the tests are passing. If you get stuck, you can also view the full solution by clicking `Show Solution`.

## Learn

The NEO blockchain supports native assets, the two most important ones being NEO and GAS. Native assets are UTXO based and are understood natively by the blockchain. Contrast this with tokens like the one we've built so far which live entirely in custom smart contracts. As a result, they require special handling within smart contracts. Luckily, NEO•ONE smart contracts abstract most of this away and let you focus on the logic of your smart contract. Let's take a look at how we would enable a smart contract to receive native assets.

```typescript
import { receive, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @receive
  public receiveNativeAssets(): boolean {
    return true;
  }
}
```

In this very simple example, we've defined a method annotated with `@receive`. This enables the method to receive native assets of any kind, including NEO and GAS. Methods marked with `@receive` must return a `boolean` value to indicate whether or not the contract wants to receive the assets. Note, however, that there are cases where the contract may still receive assets, despite returning `false`, due to limitations in how NEO handles native UTXO assets. For these cases, we automatically generate a `refundAssets` method that clients of your smart contract may call to refund assets which were not processed by the smart contract (i.e. the smart contract returned `false` or was not actually called).

## Instructions

  1. Add a method called `mintTokens` that's annotated with `@receive` and returns `true`.

In the following chapters we'll start expanding the method with more logic like converting NEO to tokens, but for now, we'll just accept all assets.

## Test

The tests for this chapter simply check that we can send both NEO and GAS to the smart contract using the master account which starts with 100 million NEO and 58 million GAS. Take a look at `Token.test.ts` to see how the NEO•ONE client APIs work for sending assets to a smart contract.

## Wrap Up

In this chapter we learned about receiving native assets. On the other side of `Next Chapter`, we'll start to expand our method with additional verification checks.
