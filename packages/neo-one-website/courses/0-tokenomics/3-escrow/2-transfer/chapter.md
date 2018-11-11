# Chapter 3: Escrow Transfer

Now that we have the shell of the Escrow contract we can learn how to interact with other smart contracts. In this chapter we'll cover how to use the EON `Token` contract from our `Escrow` contract as well as cover a few other things to keep in mind when invoking other contracts.

## Learn

Let's dive right in with an example:

Given a contract `Foo` with event `calledFizz` in `Foo.ts`

```typescript
import { createEventNotifier, SmartContract } from '@neo-one/smart-contract';

const notifyCalledFizz = createEventNotifier<string>('calledFizz', 'value');

export class Foo extends SmartContract {
  public fizz(value: string): boolean {
    notifyCalledFizz(value);

    return true;
  }
}
```

We can invoke the contract in another contract `Bar` in `Bar.ts` like so:

```typescript
import { LinkedSmartContract, SmartContract } from '@neo-one/smart-contract';
import { Foo } from './Foo';

export class Bar extends SmartContract {
  public bang(value: string): boolean {
    const contract = LinkedSmartContract.for<Foo>();

    return contract.fizz(value);
  }
}
```

Simple, right? All we have to do is import the contract `Foo` from the `Bar` file and use the special static method `for` on `LinkedSmartContract` to get a reference to the deployed `Foo` contract which we can then call. The events of the linked smart contract also get automatically merged into the events of the calling smart contract, e.g. in this case, `'calledFizz'` will automatically be an event in the generated NEO•ONE client APIs for `Bar`. And with that, we can start implementing!

## Instructions

We need to make two changes in this chapter. First, we need to modify the Token contract to use the `approvedTransfers` property along with the `Blockchain.currentCallerContract` contract to allow transfers. Second, we need to modify the Escrow contract to transfer the tokens from the `from` address to the Escrow contract address, which can be accessed with `this.address`.

Let's break it down:

  1. Add a check for an existing `approvedTransfer` by the `Blockchain.currentCallerContract` in the `transfer` method of the `Token` contract.
  2. If there is an existing approved transfer, and that approval amount is greater than or equal to the desired amount, allow the transfer to proceed and reduce the approved amount by the transfer amount.
  2. Create an instance of the `Token` contract in the `Escrow` contract using `LinkedSmartContract.for` in `depsoit`.
  3. Invoke the `transfer` method of that instance with the `from` `Address` of the `deposit` call as the `from` parameter, `this.address` as the `to` parameter and the `amount` of the `deposit` call as the `amount` parameter.
  4. If the result of the `transfer` is true, proceed with the remainder of the `deposit` logic. Otherwise, `return` `false`.

## Test

The tests for this chapter verify both the `Token` contract and the `Escrow` contract by running through the following scenario:

  1. Fast forward and mint tokens.
  2. Pre-approve a transfer of tokens to another address.
  3. Call deposit for the tokens pre-approved in 2/

We also verify that it returns `false` if the transfer is not pre-approved.

## Wrap Up

In this chapter we used the `Blockchain.currentCallerContract` property we learned about earlier, as well as, learned how to call one smart contract from another. In the next chapter we'll flesh out the remainder of the Escrow contract.
