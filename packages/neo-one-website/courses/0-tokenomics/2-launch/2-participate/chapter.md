# Chapter 3: Participate in the ICO

Now we get to the fun part, invoking a non-constant method on our smart contract. We'll cover how to do that for normal methods and ones marked with `@receive` and then you'll put that knowledge to use to implement a callback handler that participates in the ICO. We'll also have an opportunity to play with the NEO•ONE developer tools.

## Learn

Smart contract methods that are not constant require relaying a transaction on the network. Typically you'll want to wait for the transaction to be confirmed in order to update the UI as well as to respond to any errors during the process. The generated NEO•ONE client APIs enable this through a two step process.

First, invoke the smart contract method which will return a `Promise<TransactionResult>`. The `TransactionResult` object contains two properties, `transaction` which is the full transaction object that was relayed to the network, and `confirmed` which is a function we can call to wait for the transaction to be confirmed.

Thus, the second step of the process is to call `confirmed` which returns a `Promise<InvokeReceipt>`. This `InvokeReceipt` contains many useful properties, like the `event`s that were emitted during execution as well as the final `result` of the smart contract. To learn more, take a look at the detailed [documentation](/docs/smart-contract-apis#methods) on invoking smart contract methods.

Methods marked with `@receive` also take an additional argument for the native assets to send with the invocation. Let's take a look at an example:

```typescript
import { receive, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @receive
  public myReceive(value: string): boolean {
    // do something with value + received assets

    return true;
  }
}
```

```typescript
import { Hash256 } from '@neo-one/client';

const result = await example.myReceive('foo', {
  sendTo: [{
    asset: Hash256.NEO,
    amount: new BigNumber(10),
  }]
});
const receipt = await result.confirmed();
if (receipt.result.state === 'FAULT') {
  // do something when the transaction failed.
} else {
  // do something when the transaction succeeded.
}
```

In this example, we follow the two step process outlined above by first calling the `myReceive` method, followed by calling the `confirmed` method. We can check if the transaction was successful by checking the `receipt.result.state` property. Notice how we invoke the `myReceive` method with `'foo'` as the argument for the `value` parameter in the smart contract and additionally pass an object with a `sendTo` property. This `sendTo` property is only allowed for methods marked with `@receive` and it allows us to specify the native assets to send along with the transaction - in this case we've specified that we want to send `10` `NEO` to the contract along with the transaction.

## Instructions

  1. Implement the `handleMint` method by calling `token.mintTokens` with the given amount.
  2. Return the result of calling `confirmed`.

## Test

The tests for this chapter add a call to the `handleMint` method and verify that the mint failed or was successful similar to the tests for minting tokens in chapter 3 - that is, if it's before the ICO start time, it fails; during, succeeds; after, fails. In fact, the methods you implemented in the last few chapters are the exact same as the logic in testing our implementation of the smart contract in previous lessons.

We've also updated the UI to make use the `handleMint` method with a text input for the amount and a button to contribute. Try it out and you'll notice that contributing fails because the ICO hasn't started. Click the NEO•ONE icon in the lower left and then click on the "Fast Forward" button (the one with the counter of seconds since last block) to fast forward by 1 hour. Then try contributing again and it should succeed.

## Wrap Up

In this chapter we learned how to invoke smart contract methods as well as how to send assets to methods marked with `@receive`. If you played around with the UI and the developer tools, you may have noticed that the UI did not update to reflect the contribution - we'll tackle improving that in the next chapter!
