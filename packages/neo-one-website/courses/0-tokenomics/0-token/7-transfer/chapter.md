# Chapter 8: Transfer

In this chapter we'll use everything we've learned to complete the initial implementation of the Eon token by adding a `transfer` method.

## Learn

Before we jump into implementing the `transfer` method, let's take a moment to discuss when it's appropriate to throw `Error`s vs. return `false` in a smart contract method. The general rule of thumb is that you should throw errors in "exceptional" cases and return `false` from a method to indicate failure for all other cases. What's an "exceptional" case? One where the caller has made a fundamental error in invoking your method. One concrete example is parameter bounds checking, for example, our `transfer` method will throw an `Error` when the `amount` to be transferred is less than `0`. Attempting to transfer less than `0` indicates a programmer error, i.e. the invocation is just fundamentally broken. Contrast this to attempting to transfer when the `from` balance is less than the desired amount to `transfer` - in this case we would return `false`. Since there is not (currently) a way to catch errors when invoking another smart contract, it makes sense to return `false` to enable patterns like the following:

```typescript
import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';

interface Token {
  readonly transfer: (from: Address, to: Address, amount: Fixed<8>) => boolean;
}

const tokenAddress = Address.from('APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR');

export class Example extends SmartContract {
  public attemptTransfer(from: Address, to: Address, amount: Fixed<8>): void {
    // Reference a smart contract with an interface that matches Token at tokenAddress.
    const smartContract = SmartContract.for<Token>(tokenAddress);
    if (smartContract.transfer(from, to, amount)) {
      // do something on success
    } else {
      // do something else on failure
    }
  }
}
```

In this example, first we attempt a transfer. If it succeeds and returns true, we run one set of logic. If it fails and returns false, we run a different set of logic. Normally we might use a `try`/`catch` here, but errors don't propagate across smart contract boundaries. If an error is thrown, the entire transaction immediately fails. Instead we expect that the `transfer` method on the `Token` contract we're calling will return `false`.

## Instructions

Alrighty, let's finish up the `Token` contract! Implement a `transfer` method that:

 1. Takes a `from` `Address`, `to` `Address` and `amount` `Fixed<8>` to transfer.
 2. Throws an `Error` when `amount < 0`.
 3. Returns `false` when the `from` address is not the caller (using `Address.isCaller`).
 4. Returns `false` when `amount` is greater than the `from` `Address`es current balance.
 5. Otherwise, reduces the `from` `Address` balance by `amount` and increases the `to` `Address` balance by `amount`.
 6. Emits a `transfer` event.
 7. And finally, returns `true`.

## Test

If you get stuck, don't forget you can always reference the solution by clicking `Show Solution`. The tests for this chapter check a few things:

 1. A valid `transfer` reduces the `from` balance and increases the `to` balance by `amount`, returning `true` and emitting a `transfer` event.
 2. An error is thrown on `amount`s less than 0.
 3. `false` is returned when the `transfer` cannot proceed due to insufficient funds.

## Wrap Up

Congratulations, you've written your first [NEP-5](https://github.com/neo-project/proposals/blob/master/nep-5.mediawiki) token! In the next lesson we'll extend our contract to launch an ICO as well as write a simple front-end to participate in the ICO. When you're ready, click `Next Lesson`. See you on the other side!
