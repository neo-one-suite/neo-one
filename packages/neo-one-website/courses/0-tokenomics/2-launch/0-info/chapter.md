# Chapter 1: Display ICO Info

In this chapter we'll begin to learn how we can interact with the smart contract using the NEO•ONE client APIs. We'll start by building a front-end for our ICO using React, however the NEO•ONE client APIs are framework agnostic, so you may use them with any front-end framework.

Before we dive in though, let's quickly go over the new window you might have noticed in the editor. On the right hand side is a live preview of the React dapp we'll be building throughout this lesson. Right now it shows an error, because the method we're implementing in this chapter is currently empty, but once you've added the implementation the results will appear immediately. Every pane (including this one) is resizable, so if you're feeling a bit tight on space, be sure to resize as needed.

## Learn

Recall from previous chapters that NEO•ONE client APIs are automatically generated and correspond one-to-one with the properties and methods of your smart contract. For example, given the following contract:

```typescript
import { SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  public readonly myProperty = 'foo';
}
```

We can fetch the `myProperty` value in a dapp with:

```typescript
const myProperty = await example.myProperty();
expect(myProperty).toEqual('foo');
```

In the coming chapters we'll explain where the `example` value which represents our smart contract comes from, but for now we'll just assume that it's available. Notice that even though it's defined as a property in the smart contract, we still call it like a function and that function returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) which we must [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). This is what we mean when we say the generated smart contract client APIs "correspond one-to-one", while not identical, it functions very similarly to the smart contract. We return a `Promise` in particular because all communication with the blockchain is inherently asynchronous. For example, in this case we need to make a request to a node to fetch the current value.

## Instructions

Implement the `getTokenInfo` method, by returning the expected result type.

  1. Fetch each property using `token.<property-name>()`.

Since we'll be fetching multiple properties, you'll want to `await` a [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) to fetch them in parallel.

## Test

Once you've correctly implemented `getTokenInfo`, you should see the properties displayed in a simple table. The tests for this chapter are located in `utils.test.ts`, go ahead and click `Run Tests` once you're done implementing `getTokenInfo` to check your answer. Once they pass, click `Next` to proceed to the next chapter! Remember, if you ever get stuck, click `Show Solution` to view the complete solution for this chapter.

## Wrap Up

In this chapter we got our first taste of using the NEO•ONE client APIs to fetch properties from our token smart contract. Next we'll learn how to make use of the `balanceOf` constant method of our smart contract. Take a look at the `ICO.tsx` to see how the `getTokenInfo` function is used - if it doesn't make much sense, don't worry! We'll explain everything in that file in future chapters.

Before you go, try clicking the NEO•ONE icon in the lower left hand side of the preview pane. This reveals a developer toolbar with handy functionality for controlling the local node your smart contract is deployed to, as well as a full wallet implementation for testing. Play around with it and hover over the various buttons to familiarize yourself with what's possible. Head on over to the [documentation](/docs/dapps#developer-tools) for a full description of the functionality available with the developer tools as well as instructions on how to integrate them with your dapp for testing.
