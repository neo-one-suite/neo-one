---
slug: methods
title: Methods
---
# Methods

Methods are the core component of smart contract logic.

[[toc]]

## Constructor

The constructor of the smart contract is invoked exactly once on deployment of the smart contract. The constructor can have parameters so that you can deploy with different values on the MainNet vs TestNet vs a local private network, but they must always have a [default](https://www.typescriptlang.org/docs/handbook/functions.html#optional-and-default-parameters) value. The default value is used during automatic deployment to your local private network during manual testing, as well as to the private network used during automated unit tests, so it's typically best to choose defaults that tailor to those two deployments. For example, you might set a time dependent property to a parameter with a default that is computed based on the current time, or you might set an `Address` property, such as the owner, to the current sender address:

```typescript
export class HelloWorld extends SmartContract {
  public constructor(
    // Blockchain.currentBlockTime contains the timestamp of the current block, i.e. the block that
    // the transaction which invoked this method is included in.
    public readonly startTime = Blockchain.currentBlockTime + (60 * 60),
    // Deploy.senderAddress is a special property that is filled in with the Address
    // of the user who deployed the contract.
    public readonly owner = Deploy.senderAddress,
  ) {}
}
```

Note in this example we've used [parameter properties](https://www.typescriptlang.org/docs/handbook/classes.html#parameter-properties) which are a shortcut for declaring a constructor parameter and instance property with a single declaration.

## Instance Methods

Public instance methods come in several flavors but they effectively break down into 3 categories:

  1. Normal instance methods. These have no restrictions and work identically to instance methods in normal TypeScript.
  2. Constant instance methods. Designated with the `@constant` decorator, these methods may not modify smart contract properties.
  3. Native asset instance methods. Designated with the `@receive`, `@sendUnsafe`, `@send` and `@claim` decorators. Read more about these in the [Native Assets](/docs/native-assets) advanced guide.

Public instance methods define the API of the smart contract. In the following example we have two methods. One is a constant method since it's decorated with `@constant`. The other is a normal instance method which modifies the smart contract propery `mutableClosing`.

```typescript
export class HelloWorld extends SmartContract {
  private mutableClosing = 'goodbye';

  public setClosing(closing: string): void {
    this.mutableClosing = closing;
  }

  @constant
  public goodbyeMoon(value: string): string {
    return `${this.mutableClosing} ${value}`;
  }
}
```

Private and protected instance methods are just helper methods, same as normal TypeScript, but be aware that any private or protected methods invoked from a public method must respect the restrictions of the public method. For example, you can't call a private or protected method which modifies a smart contract property from a `@constant` public method.

## Parameter and Return Types

Similar to storage properties, parameter and return types for public instance methods may not be classes or functions.
