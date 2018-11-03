# Chapter 5: Withdraw Contributions

We almost have a fully functioning ICO smart contract, though it's missing one piece of functionality that's critical to our fundraising efforts: a way to withdraw the contributed NEO. In this chapter we'll learn about the `@sendUnsafe` decorator, which will allows us to withdraw NEO from the smart contract.

## Learn

Similar to `@receive`, we can decorate a method with `@sendUnsafe` to allow native assets to be sent from the smart contract to the desired address when invoking a smart contract method. Again, like `@receive`, it must return a boolean that indicates if the transfer should proceed.

The decorator is "unsafe" because it should only be used in cases where it's not possible for a malicious actor to invoke the method - if they can, it's possible for them to construct a parallel set of calls that result in the method returning `true` when in fact only one of the calls should have been allowed. Read more about this limitation in the [documentation](/docs/native-assets).

In short, you only want to decorate a method with `@sendUnsafe` when the method checks that the caller is a "superuser", i.e. someone who is not going to attempt to cheat the contract. The most common case is to simply call `Address.isCaller(this.owner)` which checks that the method was only invoked by the owner of the smart contract. Let's take a look at an example.

```typescript
import { Address, Deploy, sendUnsafe, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  public constructor(public readonly owner = Deploy.senderAddress) {}

  @sendUnsafe
  public sendNativeAssetsUnsafe(): boolean {
    return Address.isCaller(this.owner);
  }
}
```

In this example, we simply check that the caller of the method is the owner of the smart contract - if that's the case, then the native asset transfer is allowed to proceed.

What if we want to safely send assets? NEO•ONE supports that too, we'll talk about the safe counterpart to the `@sendUnsafe` decorator, `@send`, in a later lesson.

## Instructions

  1. Add a method called `withdraw` that's decorated with `@sendUnsafe` and returns `true` when `Address.isCaller(this.owner)`.

## Test

We've updated `Token.test.ts` to verify that we can invoke the `withdraw` method to withdraw assets from the smart contract and that non-owners cannot invoke the method. Take a look at `Token.test.ts` to see how the NEO•ONE client APIs work for sending assets from a smart contract using the `@sendUnsafe` decorator.

## Wrap Up

Congratulations, you've built a fully functioning ICO smart contract! Now we just need a way for people to actually participate in the ICO through a UI, otherwise we'll likely not see many participants since not everyone is technical enough to construct the smart contract invocations themselves. We'll do that and more in the next lesson, see you on the other side!
