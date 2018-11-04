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

We create `MapStorage` using the [static](https://www.typescriptlang.org/docs/handbook/classes.html#static-properties) `for` property, which makes it read as "`MapStorage` `for` `Address` to `Fixed<8>`". (Note: we're using generic types here, take a look at the TypeScript [documentation](https://www.typescriptlang.org/docs/handbook/generics.html) for more info.) We're also introducing the `Address` [interface](https://www.typescriptlang.org/docs/handbook/interfaces.html) which is a special kind of `Buffer` that represents a NEO address. You'll see a few types like this in NEO•ONE smart contracts, they're designed such that it makes it difficult to use certain values incorrectly. As a concrete example, you can't pass an arbitrary `Buffer` where an `Address` is expected which helps eliminate bugs.

Notice also that this method is not marked with `@constant` because it modifies the `MapStorage` by calling `set` on it. We won't create a non-constant method in this chapter though, it's only used for illustration.

## Instructions

The token smart contract needs to store the balances of holders of Eon:

  1. Add a `readonly` property `balances` - a `MapStorage` `for` `Address` (the holder) to `Fixed<8>` (the holder's balance).
  2. Add a `@constant` method `balanceOf` that takes a single argument `Address` and returns a `Fixed<8>` from the `balances` property.

## Test

If you run into issues, make sure there are no reported problems. The NEO•ONE compiler will report problems inline and in the problems panel, similar to TypeScript typechecker errors. Check out the tests to see the new `balanceOf` method in action. Then build and run the tests!

## Wrap Up

Easier than last chapter right? Still, we learned about the powerful concept of structured storage which nearly every contract will rely on. We also saw our first specialized `Buffer` type, the `Address`. Once you're done exploring, click `Next` to proceed.
