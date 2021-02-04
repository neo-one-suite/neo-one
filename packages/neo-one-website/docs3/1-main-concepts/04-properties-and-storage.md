---
slug: properties-and-storage
title: Properties and Storage
---

NEO•ONE stores persistent data in the class properties of the smart contract.

---

[[toc]]

---

## Properties and Accessors

Using the mental model of a singleton instance of our smart contract, it becomes clear that all properties of the smart contract are automatically persisted between invocations of the smart contract, just like a normal class instance. In TypeScript we can declare several types of instance properties of a class - [private, protected, public and readonly](https://www.typescriptlang.org/docs/handbook/classes.html#public-private-and-protected-modifiers). The following example explores each of these:

```typescript
export class HelloWorld extends SmartContract {
  public mutableString = 'goodnightMoon';
  public readonly string = 'goodnightMoon';
  protected mutableNumber = 0;
  protected readonly number = 0;
  private mutableBoolean = true;
  private readonly boolean = true;
}
```

Each property uses the property initializer syntax which sets the initial value at construction.

One thing to consider in the mental model of smart contracts is that at a low-level smart contracts only have methods. So when we define a `public` `readonly` property, it will be translated to a method of the same name that takes no arguments and returns the current value of the property. A `public` mutable property, like `mutableString` above, will translate to two methods, a method of the same name that takes no arguments and returns the current value of the property and a method called `set<property>` that takes one argument and sets the value of that property to the argument. For example, `mutableString` will translate to `mutableString` and `setMutableString` methods.

[Property accessors](https://www.typescriptlang.org/docs/handbook/classes.html#accessors) work identically to properties in terms of the low-level translation to exposed smart contract methods.

::: warning

Note

Properties declared as `protected` or `private` are only "private" within the scope of TypeScript - all NEO smart contracts have fully public storage, so no property is ever truly private. In other words, do not store sensitive data within a `private` property with the expectation that no one can view it

:::

---

## Structured Storage

Properties work well for storing primitive values and while you can use an `Array`, `Set` or `Map` as a property for storing structured data, this will store the entire container in a single key in smart contract storage. This is not very efficient, so instead NEO•ONE offers similarly named `ArrayStorage`, `SetStorage` and `MapStorage` classes. These classes are special in that they may only be used as properties of a smart contract class:

```typescript
export class HelloWorld extends SmartContract {
  private readonly mapStorage = MapStorage.for<string, number>();
  private readonly setStorage = SetStorage.for<string>();
  private readonly arrayStorage = ArrayStorage.for<string>();
}
```

Notice that we construct the structured storage classes using the [static](https://www.typescriptlang.org/docs/handbook/classes.html#static-properties) `for` method and 1-2 [type parameters](https://www.typescriptlang.org/docs/handbook/generics.html), which makes it read as "<structured storage> for <type>". For example, the `mapStorage` property is a "MapStorage for string to number".

Aside from the limitations mentioned above, each of the structured storage classes work identically to their `Array`, `Set` and `Map` counterparts.

---

## Storage Types

The only limitation on storage types is that you cannot use an instance of a class or a functon. This is because we cannot reliably serialize and deserialize arbitrary instances when we store the values in the underlying smart contract storage. For similar reasons, we cannot store arbitrary functions. However, you may declare a `readonly` property that is a function. This can be useful for declaring event notifiers as properties of the class:

```typescript
export class Contract extends SmartContract {
  private readonly notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
    'transfer',
    'from',
    'to',
    'amount',
  );
}
```

We'll learn more about event notifiers in a later chapter of the guide.
