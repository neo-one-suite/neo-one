# Chapter 3: Storage Properties

Awesome work! Next up is learning about storage properties. We'll also write our first constant method! As a heads up, this chapter is a beefy one because we need to introduce quite a few concepts in order to have a fully functioning contract.

## Learn

Contract properties that are not `readonly` are automatically stored inside of contract storage, meaning they persist between invocations of methods of your smart contract. In order to understand what that means a bit more clearly, let's take a step back and talk about what happens when you deploy your smart contract.

Every NEO•ONE smart contract has an automatically generated method called `deploy` which is based on the `constructor` of your smart contract. It's created whether or not you have an explicit constructor and must be invoked when the contract is published to the blockchain to initialize it. Using the NEO•ONE client APIs, the `deploy` method is called automatically and atomically when the contract is published, so you never have to worry about it.

Now, back to contract storage properties. The way to think about how the smart contract we're building works is that when it's published to the blockchain we construct it, i.e. we call the equivalent of `new Token()`. Then for every invocation we use that one instance, so any changes to storage properties are persisted between invocations.

Let's take a look at an example:

```typescript
import { Fixed, SmartContract, constant } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  private mutableMyFixedProperty: Fixed<8> = 8_00000000;

  @constant
  public get myFixedProperty(): Fixed<8> {
    return this.mutableMyFixedProperty;
  }
}
```

In this example we created a mutable `Fixed<8>` property called `mutableMyFixedProperty`. Let's break this down. It initially has the value of `8_00000000` when the smart contract is published and deployed, i.e. the same as if we had constructed it using `new Example()`. Whenever we change the value of the property, it will be persisted between invocations.

We've also introduced a few other concepts here. The first is the `Fixed` type - this type has no impact on how the smart contract executes, but it does change how the automatically generated NEO•ONE client APIs function. All numbers in a NEO smart contract must be integers (up to 256 bits, to be precise), so typically we use an integer multiplied by a power of 10 to represent decimals. In this case, `Fixed<8>` is telling the compiler that this number actually represents a fixed point number with 8 decimal places. Notice how we also use the underscore syntax to help relay that fact as well - rather than `800000000` we use `8_00000000` so that it's clearer to the reader that the supply is actually `8` and not `800000000`. The NEO•ONE client APIs use this information to return `BigNumber`s with the correct number of decimal places, so in this case, if we called `example.myFixedProperty()` we would receive a `BigNumber` with the value of `8`. That was quite a bit of explanation and if it doesn't make perfect sense right now, don't worry, it'll become clearer as we move through the chapters and add more tests.

Finally, we have our first method, a getter that's been marked as `@constant`. This just tells the compiler that the method does not modify any storage properties, and thus can be invoked without submitting a transaction to the blockchain. Again, this will become more clear once we see how non-constant methods are invoked in the tests in later chapters.

## Instructions

Phew, that was a lot of information to absorb at once. The good news is, now you get to try it out!

  1. Add a property called `mutableSupply` - a `Fixed<8>` with the value of `0`.
  2. Add a `@constant` getter method called `totalSupply` which just returns the value of `mutableSupply`.

## Test

Once you're done and there are no reported problems, go ahead and click `Build` and `Run Tests`. While they're running, take a look at `Token.test.ts` and you'll notice that we added another call to our `token` smart contract - `token.totalSupply()` - corresponding to the new `totalSupply` getter that was added.

## Wrap Up

In this chapter we learned about the `Fixed` type, how to declare storage properties, and constant methods. Quite a lot, if you've made it this far you should be proud. Click `Next` and we'll see you on the other side!
