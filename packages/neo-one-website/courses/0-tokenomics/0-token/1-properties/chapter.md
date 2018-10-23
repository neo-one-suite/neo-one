# Chapter 2: Contract Properties

Great job! Now that we have a shell for our contract, let's learn how to add a few constant properties.

## Learn

We'll start by adding [readonly](https://www.typescriptlang.org/docs/handbook/classes.html#readonly-modifier) constant properties. Just like regular TypeScript, `readonly` properties cannot be changed. Marking a property as [public](https://www.typescriptlang.org/docs/handbook/classes.html#public-private-and-protected-modifiers) will generate a smart contract method with the same name for accessing the property. Note that even if a property is marked as [private](https://www.typescriptlang.org/docs/handbook/classes.html#public-private-and-protected-modifiers), all contract code and storage is publicly accessible, so nothing is ever truly private.

Let's take a look at an example:

```typescript
export class Example extends SmartContract {
  public readonly myStringProperty = 'foo';
}
```

In this example contract we created a [string](https://www.typescriptlang.org/docs/handbook/basic-types.html#string) property called `myStringProperty`. Smart contract callers can read this property by calling the `myStringProperty` method on the smart contract. Using the NEO•ONE client APIs, the property would be accessed as `example.myStringProperty()`.

## Instructions

Let's call the token 'Eon', give it the symbol 'EON' and make it have 8 decimals. We can represent this by adding a few properties to the smart contract:

  1. Add a property called `name` - a `string` with the value `'Eon'`.
  2. Add a property called `symbol` - a `string` property with the value `'EON'`.
  3. Add a property called `decimal` - a `number` property with the value `8`.

## Test

Now that we've added the properties, `Build` the contract and then `Run Tests`. Remember, if you ever get stuck feel free to take a look at the solution code by clicking `Show Solution` at the bottom of the page.

## Wrap Up

In this chapter we learned about the first kind of properties that can be declared in a NEO•ONE smart contract. When you're ready, click `Next` to learn about storage properties!

Before you go, take a look at the updated `Token.test.ts` file to see the newly generated methods on the `token` variable - one for each of the properties that were added to the contract. Hover over the method calls and you'll notice that the properties have the same types as in the smart contract, except they're wrapped in a `Promise`. They are all wrapped in a `Promise` because we need to make an asynchronous invocation of the smart contract in order to access the values. As we continue through the chapters, be sure to hover over the various pieces of the test code to learn a bit about how the generated NEO•ONE client APIs are structured.
