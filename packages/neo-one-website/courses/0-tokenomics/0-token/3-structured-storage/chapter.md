# Chapter 4: Structured Storage

Primitive storage properties are useful, but most contracts will want some kind of structured storage. In this chapter we'll learn about `MapStorage`, a structured storage class that enables storing a mapping from keys to values.

## Learn

`MapStorage` works almost identically to a JavaScript `Map`, the only difference is it doesn't have a `size` property. Let's take a look at an example:

```typescript
import { Address, Fixed, MapStorage, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  private readonly myMapStorage = MapStorage.for<Address, Fixed<8>>();

  public myMethod(addr: Address): Fixed<8> {
    this.myMapStorage.set(addr, 10);
    const value = this.myMapStorage.get(addr)

    return value === undefined ? 0 : value;
  }
}
```

We create `MapStorage` using the static `for` property, which makes it read as "`MapStorage` `for` `Address` to `Fixed<8>`". We're also introducing the `Address` type which is a special kind of `Buffer` that represents a NEO address. You'll see a few types like this in NEO•ONE smart contracts, they're designed such that it makes it difficult to use certain constructs incorrectly. As a concrete example, you can't pass an arbitrary `Buffer` where an `Address` is expected which helps eliminate bugs.

Notice also that this method is not marked with `@constant` because it modifies the `MapStorage` by calling `set` on it. We won't create a non-constant method in this chapter though, it's only used for illustration.

## Try

We need to store the balances of holders of Eon, so let's add a `readonly` property `balances` for a `MapStorage` from `Address` (the holder) to `Fixed<8>` (the holder's balance). Let's also add a `@constant` method to make it easy to query a holder's balance. The method should be called `balanceOf`, take a single argument `Address` and return a `Fixed<8>` from the `balances`.

## Test

If you run into issues, make sure there are no reported problems. The NEO•ONE compiler will report problems inline and in the problems panel, similar to TypeScript typechecker errors. Check out the tests to see the new `balanceOf` method in action. Then build and run the tests!

## Wrap Up

Easier than last chapter right? Still, we learned about a powerful concept - structured storage - that most if not all contracts will rely on. We also saw our first specialized `Buffer` type, the `Address`. Once you're done exploring, click `Next Chapter` to proceed.
