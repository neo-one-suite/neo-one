# Chapter 6: Methods

Congratulations on making it this far! Now that we've set the stage, it's time to get to the meat of a smart contract - methods that modify internal state. To start, we'll add a method for issuing tokens, read on to learn how!

## Learn

We saw how to make constant methods using the `@constant` decorator, but now let's look at what happens when we have a non-constant method.

```typescript
import { Address, Fixed, MapStorage, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  private readonly myMapStorage = MapStorage.for<Address, Fixed<8>>();

  public myMethod(addr: Address): Fixed<8> {
    this.myMapStorage.set(addr, 10);
    const value = this.myMapStorage.get(addr);

    return value === undefined ? 0 : value;
  }
}
```

Look familiar? This is the same example from Chapter 3: Structured Storage. In terms of the smart contract, there's not much to add, a method that does not have the `@constant` decorator can mutate primitive and structured storage properties. Otherwise, they're free to contain any valid TypeScript just like `@constant` methods.

The main difference for the NEO•ONE client APIs is that non-constant methods require relaying a transaction to the blockchain. This makes sense because a non-constant method by definiton mutates storage, and we need to persist those changes to the blockchain.

## Instructions

1. Add a simple method `issue` which takes two parameters, the `Address` to issue tokens to and a `Fixed<8>` for the amount of tokens to issue. This method should do two things:
   1. Increase the balance of the `Address` by the `Fixed<8>` amount.
   2. Increase the `mutableSupply` by the `Fixed<8>` amount.
2. Add a check for `Address.isCaller(owner)` and throw an `Error` if it does not return true.

## Test

Take a look at the tests for this chapter in `Token.test.ts`. Notice how unlike the `@constant` methods and `readonly` properties, we check that the invocation succeeded. We also have a test that makes sure the invocation failed when the `from` address is not the `owner`.

Hover over the return values and you'll see that they return a `InvokeReceipt<void, TokenEvent>`, which is the "receipt" for the confirmed transaction on the blockchain. When a transaction, like a smart contract invocation, is relayed to the blockchain, we wait for it to be confirmed in a block. Once it has been confirmed, we receive a “receipt” of that confirmation which lets us know whether the transaction succeeded and gives us access to any return values. Since the `issue` method doesn't return anything, we receive a `void` value in the receipt. We'll talk more about `TokenEvent` in the next chapter, so for now you can ignore that.

In our test, we use the shortcut method `confirmed` to do both steps in one call, but you can also make two invocations - in later lessons we'll cover both in more detail. Another thing you might notice is that the NEO•ONE client APIs generate methods that are nearly identical to the methods you've defined in your smart contract, making it feel like you're just calling the same methods you defined.

## Wrap Up

Now that we know how to make methods, we'll really start picking up the pace in future chapters and get into the meat of the `Token` functionality. Click `Next` to proceed!
