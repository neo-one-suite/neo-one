# Chapter 7: Contract NEO

In the last chapter we extended the `Escrow` contract with support for all NEP-5 tokens. In this chapter we'll look at how we can make native assets like `NEO` and `GAS` conform to the NEP-5 standard so that they may be used in contracts that expect NEP-5 tokens like `Escrow`. We can make `NEO` work like a NEP-5 token by constructing a contract that accepts `NEO` and converts it 1:1 for `CNEO`. It should also accept `CNEO` and convert it 1:1 for `NEO`. The mechanism for converting `NEO` to `CNEO` is the same as minting tokens for an ICO, so in this chapter we'll focus on how we convert `CNEO` back into `NEO`. We'll also talk about how to claim the accrued `GAS` in a smart contract that has been sent `NEO`.

Note that `CNEO` and `CGAS` are already deployed to the mainnet, so if you are developing a contract that wants to use `NEO` or `GAS`, it may be prudent to use `CNEO` and `CGAS` instead as they're generally easier to work with from smart contracts.

## Learn

Recall from Lesson 2 that we used the `@sendUnsafe` decorator in order to withdraw ICO contributions. To recap that chapter, `@sendUnsafe` is an unsafe way of enabling native assets to be sent from the contract, as it potentially allows the equivalent of double spends - that is, a user can construct a series of parallel transactions that enable them to withdraw more than they should be allowed to. NEO•ONE supports another decorator `@send` which eliminates the attack vector by requiring two transactions to withdraw from the contract. At a high level, every send happens in two phases:

  1. The user "marks" the assets they wish to withdraw from the contract by constructing a transaction that sends those assets back to the smart contract.
  2. The user then constructs a transaction that withdraws the previously "mark"ed assets to the desired address.

With NEO•ONE, this process is implemented transparently both in terms of the implementation in the smart contract as well as actually invoking the methods in the NEO•ONE client APIs. Simply decorate a method with the `@send` decorator as before and return `true` if the transaction should proceed, and `false` otherwise. The method may optionally accept one argument in addition to any user defined arguments; a `Transfer` object. The `Transfere` object contains a `to` `Address` property that the assets will be sent to, an `asset` `Hash256` property corresponding to the asset to be sent, and an `amount` `Fixed<8>` property that will be sent. Typically your method will want to accept the `Transfer` argument in order to validate the transaction. Let's take a look at an example.

```typescript
import { send, SmartContract, Transfer } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @send
  public withdraw(value: string, transfer: Transfer): boolean {
    // Check internal state against the provided arguments and return false if the transfer should not proceed.

    // Otherwise, return true.
    return true;
  }
}
```

Simple right? In this example we're declaring a method `withdraw` that can be used to send assets from the contract. It accepts one parameter, a `string` called `value`. It additionally expects the optional `Transfer` argument. To make this a bit more concrete, let's take a look at how one can send assets from a contract using a method decorated with `@send`.

```typescript
import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';

const sendPhaseOneReceipt = await example.withdraw.confirmed('value', {
  asset: Hash256.NEO,
  amount: new BigNumber(10),
  to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
});
const sendPhaseTwoReceipt = await example.completeSend.confirmed(sendPhaseOneReceipt.transaction.hash);
```

Notice how invoking a method marked with `@send` is identical to invoking a normal method - we simply provide the arguments expected by the contract method. Do note that the final argument, the `Transfer` object is mandatory, regardless of whether or not the contract expects it as the final argument, because it is used to construct the transaction that marks the native assets for withdrawal. Once the first transaction is confirmed, we call `completeSend` with the transaction hash of the first transaction to finalize the withdrawal. Notice that `completeSend` is generated automatically by the NEO•ONE client APIs and may be used as the second step for any method marked with `@send`.

Before we move on to using the `@send` decorator in a smart contract, let's quickly cover how we can claim the accumulated `GAS` of a smart contract that has had `NEO` sent to it. We can decorate a method with `@claim` to allow `GAS` to be claimed when invoking that method. With that said, there are things that make `@claim` methods different:

  1. `@claim` methods may not modify contract storage. They act like `@constant` methods.
  2. `@claim` methods may not access `Blockchain.currentTransaction`, instead they may optionally accept the `ClaimTransaction` that the method was invoked in as the final argument.

Let's take a look at an example:

```typescript
import { ClaimTransaction, claim, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @claim
  public claimGAS(transaction: ClaimTransaction): boolean {
    // Check internal state against the ClaimTransaction and return false if the claim should not proceed.

    // Otherwise, return true.
    return true;
  }
}
```

Just like the other method decorators, we return `true` or `false` to indicate if the claim should proceed. Methods marked with `@claim` are invoked just like a normal method, so we'll skip showing another example and let you dive into trying out these 2 decorators.

## Instructions

We've started you off with a partial NEP-5 implementation of `CNEO`, it's up to you to implement the methods marked with `@send` and `@claim`.

The `unwrap` method should do the following:

  1. Return `false` if the `asset` transferred is not `NEO`.
  2. Return `false` if the balance of the `to` address of the `Transfer` is less than the `amount` of the `Transfer`
  3. Deduct `amount` from the balance of the `to` address.
  4. Deduct `amount` from the `mutableSupply` of the contract.
  5. Emit a transfer notification with `undefined` set as the `to` address (which represents burning the token)
  6. Return `true`.

Since there's not currently an efficient way to allow users to claim `GAS` for their `CNEO`, we'll make the `claim` method do the following:

  1. Return `true` if `Address.isCaller(this.owner)`.

Then at least the owner of `CNEO` can claim and distribute `GAS`.

## Test

The tests for this chapter verify that `CNEO` can be unwrapped and GAS can be claimed. They're worth checking out to see how the smart contract methods are invoked in action. They also test the NEP-5 functionality by using `CNEO` with the `Escrow` contract.

## Wrap Up

This chapter introduced the `@send` and `@claim` decorators and used them to implement `CNEO`, a NEP-5 compatible wrapper around `NEO`. At this point, we have 3 fully functioning smart contracts, but you may have noticed that the interaction between them is a bit cumbersome. Currently we require two transactions, a pre-approval transaction followed by the actual action. In the next chapter we'll look at how we can modify the NEP-5 contract to support both the transfer (without pre-approval) and the action in a single safe transaction.
