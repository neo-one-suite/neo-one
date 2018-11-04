# Chapter 6: Support Every NEP-5 Token

We now have a fully functioning Escrow contract for Eon tokens. But what if we want to have an escrow account for another NEP-5 token? In it's current form, we'd need to deploy a new contract that points to the other token. Instead of deploying an escrow contract for every token, let's generalize the contract to support any NEP-5 token.

## Learn

In order to generalize the contract we'll need to be able to invoke the `transfer` method of an arbitrary contract. Let's take a look at an example of how that can be done:

```typescript
import { Address, Fixed, declareEvent, SmartContract } from '@neo-one/smart-contract';

interface ExampleToken {
  readonly transfer: (from: Address, to: Address, amount: Fixed<8>) => boolean;
}
declareEvent<Address | undefined, Address | undefined, Fixed<8>>('transfer', 'from', 'to', 'amount');

export class Example extends SmartContract {
  public invokeTransfer(from: Address, to: Address, amount: Fixed<8>, asset: Address): boolean {
    const token = SmartContract.for<ExampleToken>(asset);

    return token.transfer(from, to, amount);
  }
}
```

In this example we're forwarding the transfer call to the contract at the given `tokenAddress`. Compared to before, we replaced the `LinkedSmartContract.for<Token>()` call that referenced our own `Token` contract with a `SmartContract.for<ExampleToken>(tokenAddress)` call that references a contract that has the interface `ExampleToken` at `tokenAddress`. Besides that, the return value is identical - we can call any contract method defined by the `ExampleToken` interface, which in this case just contains the `transfer` method.

We can also declare the events that we expect our smart contract to emit due to calling other smart contracts. Before when we used `LinkedSmartContract.for<Token>()`, the `Token` contract's events were automatically pulled in as possible events for the `Escrow` contract to emit. We can use `declareEvent` with the same type parameters and parameter names as we did for the `'transfer'` in order to have the same effect when using `SmartContract.for<ExampleToken>(tokenAddress)` - that is, now the generated NEO•ONE client APIs will include the `'transfer'` event in transaction receipts.

## Instructions

Rather than go step by step through every change, we'll make this a bit more challenging than previous chapters and give a more high level description of what needs to be done.

  1. Remove the `Token` import and construct an interface called `Token` with a `transfer` method just like the example above. Use `declareEvent` to declare the `'transfer'` event that we expect the tokens we invoke to emit.
  2. Make the `balances` have keys that are a triplet of `Address` corresponding to `[from, to, asset]`.
  3. Modify each of the methods in the `Escrow` contract to take an additional `asset` `Address` parameter. Use this parameter throughout. - create the contract using `SmartContract.for<Token>(asset)`, add it to the emitted events, etc.

## Test

The tests for this chapter are identical to the previous one with the exception that we additionally pass the Eon `Token` contract address as the final parameter to each method. We also expect that each of the events contain an `asset` parameter equal to the `Token` address.

## Wrap Up

This chapter generalized the `Escrow` contract to work with any NEP-5 token. But what if we want to have an escrow account with NEO or GAS? In the next chapter we'll look at how we can make NEO conform to the NEP-5 standard so that we can use it in the `Escrow` contract.
