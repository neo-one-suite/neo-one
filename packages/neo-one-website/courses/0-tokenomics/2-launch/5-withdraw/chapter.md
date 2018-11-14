# Chapter 6: Withdraw NEO

We've seen how to invoke normal smart contract methods, methods decorated with `@receive` and now we'll learn how to invoke a method decorated with `@sendUnsafe`. Since this turns out to be very similar to methods marked with `@receive`, we'll also cover a few `Client` methods that will be used in the implementation for this chapter.

## Learn

Like `@receive`, methods marked with `@sendUnsafe` allow specifying native assets to include with the transaction. This time, however, you specify them with `sendFrom` since we'll be sending assets from the smart contract to another address. Let's take a look at an example.

```typescript
import { sendUnsafe, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @sendUnsafe
  public mySendUnsafe(value: string): boolean {
    // do something with value + assets to be sent

    return true;
  }
}
```

```typescript
import { Hash256 } from '@neo-one/client';

const result = await example.mySendUnsafe('foo', {
  sendFrom: [{
    asset: Hash256.NEO,
    amount: new BigNumber(10),
    to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
  }]
});
const receipt = await result.confirmed();
if (receipt.result.state === 'FAULT') {
  // do something when the transaction failed.
} else {
  // do something when the transaction succeeded.
}
```

In this example, we're invoking the method `mySendUnsafe` with the argument `'foo'` and also specifying that we want to send `10` NEO from the contract to the given address. Notice how the invocation is very similar to how we invoked methods decorated with `@receive`.

Before we move on to the instructions for this chapter, let's take a quick look at how we can fetch the balances for a given account so that when we use the `withdraw` function of the EON contract, we know how much is available to withdraw.

We can use the method `getAccount` on the `Client` to fetch the current balance of all native assets for a given network and address, called a `UserAccountID` within the NEO•ONE client APIs. One thing to note about the NEO•ONE client APIs is that they're not only address agnostic, as in they will use whichever address is currently selected, but they're also network agnostic. We haven't needed to specify a network (or address) explicitly thus far because all of the smart contract methods automatically use the network of the currently selected account. The currently selected account also automatically signs every transaction.

Now, back to `getAccount` - we can get the currently selected account using `getCurrentUserAccount`. Note that this may return an `undefined` value if no account is selected, or more commonly, if the user has not enabled access to their external account through nOS, NEX or NEO Tracker. Assuming it's defined, we now have the network that the `Client` is currently operating with.

We can pull the address of our deployed smart contract for a particular network through the `definition` property of the smart contract. Let's take a look at an example:

```typescript
import { Hash256 } from '@neo-one/client';

const userAccount = client.getCurrentUserAccount();
if (userAccount !== undefined) {
  const network = userAccount.id.network;
  const contractAddress = example.definition.networks[network].address;
  const contractID = { network, address: contractAddress };
  const contractAccount = await client.getAccount(contractID);
  const neoBalance = contractAccount.balances[Hash256.NEO] as BigNumber | undefined;
  // do something with the contract account and/or the neo balance.
}
```

In this example, we get the currently selected `UserAccount` and if it's defined, we use it to fetch the `Account` of the `Example` contract on the `UserAccount`'s network. Notice that we type cast the `balances` value for `Hash256.NEO` to `BigNumber | undefined` - this is because if the balance of that account is 0, then it might not be defined in the `balances` object. However, in TypeScript, it's rather inconvenient to declare the value type of an object as possibly undefined, so we just need to remember to cast it when we're accessing the value of a particular asset.

## Instructions

Implement `handleWithdraw`:

  1. Fetch the current NEO balance of the token contract account.
  2. Invoke `withdraw` using the current NEO balance as the amount to withdraw and the current `UserAccount` as the address to withdraw to.

## Test

Once you've implemented `handleWithdraw` you can test it out by participating in the ICO (don't forget to fast forward by an hour to the ICO start time) and then clicking the `Withdraw` button. The tests will also verify that `handleWithdraw` is implemented correctly, that is, by verifying that the entirety of the contributions are withdrawn from the token contract account.

## Wrap Up

In this chapter we saw how to invoke a smart contract method decorated with `@sendUnsafe` using the NEO•ONE client APIs. We also saw how we can use the `Client` to get the currently selected `UserAccount` as well as fetch the balance of an arbitrary `Account`. Finally, we were able to pull the address of our Eon contract with the `definition` property.

And with that, we've implemented a UI for the entire Eon token smart contract. Not bad for 6 chapters. In case you want to play around with the UI implementation itself, we've made the `ICO.tsx` file writable. The original `ICO.tsx` content can be found in the `Show Solution` menu in case you want to revert back.

In the next lesson, we'll create an escrow contract that uses our Eon token as well as modify the Eon token itself to enable other contracts to easily interact with it. See you on the other side!
