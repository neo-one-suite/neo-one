# Chapter 8: Transfer

In this chapter we'll use everything we've learned to complete the initial implementation of the Eon token by adding a `transfer` method.

## Learn

Before we jump into implementing the `transfer` method, let's take a moment to discuss when it's appropriate to throw `Error`s vs. return `false` in a smart contract method. For those of you that have experience with other NEO Smart Contract languages, you may notice that rather than returning `false` we always throw an `Error`. Not only is this more idiomatic TypeScript, but throwing an `Error` also has the side effect of reverting all storage changes. This ensures that when an assertion in an operation fails, there are no erroneous storage changes. Note that when your contract is called from another contract, we will always return `false` to that contract so that it has a chance to react to the failure. We do this because there is not (currently) a way for the calling contract to catch errors. Concretely, imagine the `transfer` method is declared to return a `string`. Because every method can throw, the interface when interacting with the contract from another contract will be `string | false`, meaning the method will return `false` if an `Error` occurred. Let's take a look at an example:

```typescript
import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';

interface Token {
  readonly transfer: (from: Address, to: Address, amount: Fixed<8>) => string | false;
}

const tokenAddress = Address.from('APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR');

export class Example extends SmartContract {
  public attemptTransfer(from: Address, to: Address, amount: Fixed<8>): void {
    // Reference a smart contract with an interface that matches Token at tokenAddress.
    const smartContract = SmartContract.for<Token>(tokenAddress);
    if (smartContract.transfer(from, to, amount) === false) {
      // do something on failure
    } else {
      // do something else on success
    }
  }
}
```

In this example, first we attempt a transfer. If it succeeds and returns a string, we run one set of logic. If it fails and returns false, we run a different set of logic. Normally we might use a `try`/`catch` here, but errors don't propagate across smart contract boundaries. If an error is thrown, the entire transaction immediately fails. Instead we expect that the `transfer` method on the `Token` contract we're calling will return `false`.

## Instructions

Alrighty, let's finish up the `Token` contract! Implement a `transfer` method that:

 1. Takes a `from` `Address`, `to` `Address` and `amount` `Fixed<8>` to transfer.
 2. Throws an `Error` when `amount < 0`.
 3. Throws an `Error` when the `from` address is not the caller (using `Address.isCaller`).
 4. Throws an `Error` when `amount` is greater than the `from` `Address`es current balance.
 5. Otherwise, reduces the `from` `Address` balance by `amount` and increases the `to` `Address` balance by `amount`.
 6. Emits a `transfer` event.
 7. And finally, returns `true`. Note that we return `true` on success for compatibility with the NEP-5 standard.

## Test

If you get stuck, don't forget you can always reference the solution by clicking `Show Solution`. The tests for this chapter check a few things:

 1. A valid `transfer` reduces the `from` balance and increases the `to` balance by `amount`, returning `true` and emitting a `transfer` event.
 2. An error is thrown on `amount`s less than 0 or when the `transfer` cannot proceed due to insufficient funds.

## Wrap Up

Congratulations, you've written your first [NEP-5](https://github.com/neo-project/proposals/blob/master/nep-5.mediawiki) token! In the next lesson we'll extend our contract to launch an ICO as well as write a simple front-end to participate in the ICO. When you're ready, click `Next Lesson`. See you on the other side!
