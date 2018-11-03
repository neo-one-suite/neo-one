# Chapter 5: Transfer EON

Earlier this lesson we saw how to invoke a method marked with `@receive`, now we'll take a look at how to invoke the `transfer` method which does not have any decorators.

## Learn

Turns out, there's not much to learn here. Invoking a method without an decorator follows the same two step process that we mentioned in the earlier chapter, the only difference is we can't send native assets along with the invocation. So instead of covering the same material, we'll look at how we can shortcut that two step process if we don't care about knowing when the transaction has been successfully relayed. We can do this by invoking the `confirmed` that is available on every smart contract method. Let's take a look at an example.

```typescript
import { SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  public myMethod(value: string): boolean {
    // do something with value

    return true;
  }
}
```

```typescript
const receipt = await example.myMethod.confirmed('foo');
if (receipt.result.state === 'FAULT') {
  // do something when the transaction failed.
} else {
  // do something when the transaction succeeded.
}
```

Notice how we call `example.myMethod.confirmed` which is just a shortcut for the following:

```typescript
const result = await example.myMethod('foo');
const receipt = await result.confirmed();
```

Every smart contract method has this property, so if, for example, you're not updating the state of a UI in response to a successful relay of the transaction, you can just use the shortcut method.

## Instructions

  1. Implement `handleTransfer` which should call the `transfer` method of the token contract.

Since we're not updating the UI when the transaction is successfully relayed, feel free to use either form of calling `transfer` to implement the method.

## Test

We've added a simple UI for transferring tokens to a specified address. Use the developer tools to get the address of another configured wallet and then, after participating in the ICO, try transferring tokens to that address. You'll notice that the UI updates reactively to the transfer the same way it does for minting tokens. Use the developer tools to switch to the wallet you transferred to in order to see their new balance of EON tokens.

Similar to before, the unit tests simply verify that we can call `handleTransfer` to transfer tokens from one address to another.

## Wrap Up

In this chapter we saw how invoking a smart contract method without decorators is virtually the same as what we saw for `mintTokens`. In the next chapter we'll hook up the `withdraw` method and find that, again, invoking a method with `@sendUnsafe` is very similar.
