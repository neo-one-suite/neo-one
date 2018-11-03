---
slug: calling-smart-contracts
title: Calling Smart Contracts
---
# Calling Smart Contracts

Smart contracts are not very useful in isolation, they typically interact with other smart contracts that make up the building blocks of a larger piece of infrastructure.

## Calling One of Your Smart Contracts

Calling another one of your smart contracts requires using `LinkedSmartContract.for`. Given the following contract in `Foo.ts`:

```typescript
export class Foo extends SmartContract {
  public takeAction(): boolean {
    return true;
  }
}
```

We can get the singleton instance of `Foo` using `LinkedSmartContract.for<Foo>()`:

```typescript
import { Foo } from './Foo';

export class Bar extends SmartContract {
  public callOtherContract(): boolean {
    const foo = LinkedSmartContract.for<Foo>();
    return foo.takeAction();
  }
}
```

Once we have an instance of the contract we can access any of its public properties and methods.

## Calling an Arbitrary Smart Contract

Continuing from the examples above, let's say we want to invoke the `takeAction` method of a smart contract at a given `Address`, i.e. not one of our own smart contracts, but an arbitrary one. Similar to `LinkedSmartContract.for`, we can get the instance of the smart contract using `SmartContract.for<Foo>(address)` where `address` is the `Address` of the smart contract:

```typescript
interface Foo {
  readonly takeAction: () => boolean;
}

export class Bar extends SmartContract {
  public callOtherContract(address: Address): boolean {
    const foo = SmartContract.for<Foo>(address);
    return foo.takeAction();
  }
}
```

Notice that we also have to define the interface of the smart contract explicitly. The instance returned by `SmartContract.for` will match the interface we've defined and then we can access any of its public properties and methods.

::: warning

Note

A common, but advanced, usage pattern for invoking other arbitrary smart contract is to forward argument values to the invoked method. See the advanced guide on [Forward Values](/docs/forward-values) to learn more.

:::
