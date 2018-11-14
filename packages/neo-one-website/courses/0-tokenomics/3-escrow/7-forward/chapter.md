# Chapter 8: Forward Arguments

We've learned in previous chapters that one technique for safe interaction between smart contracts is to pre-approve actions that the other contract may take on behalf of a user account. In this chapter, we'll learn how we can enable safe interactions through inversion of control - that is, we'll allow other contracts a chance to react to an action taken.

This chapter will be quite dense as we dive into a rather advanced, but powerful, concept, so be prepared!

## Learn

We'll structure the inversion of control through convention, that is, whenever we take an action `foo` who's target is a smart contract, we'll invoke `approveReceiveFoo` on that contract. This enables a key interaction between smart contracts - the target contracts not only react to the action, but they can disallow it entirely. Let's take a look at an example.

```typescript
import { Address, ForwardValue, SmartContract } from '@neo-one/smart-contract';

interface ActionContract {
  readonly approveReceiveTakeAction: (
    value: string,
    ...args: ForwardValue[]
  ) => boolean;
}

export class Example extends SmartContract {
  public takeAction(value: string, on: Address, ...approveArgs: ForwardValue[]): boolean {
    const contract = Contract.for(on);
    if (contract !== undefined && !Address.isCaller(on)) {
      const smartContract = SmartContract.for<ActionContract>(on);
      if (!smartContract.approveReceiveTakeAction(value, ...approveArgs)) {
        return false;
      }
    }

    return true;
  }
}
```

Let's break this down piece by piece. We have a method called `takeAction` which expects two arguments, a `string` called `value` and the target of the action, an `Address` call `on`. We also have a [rest parameter](https://www.typescriptlang.org/docs/handbook/functions.html#rest-parameters) with a new type, `ForwardValue`. A `ForwardValue` is an opaque type that could be anything and is intended not to be used by the current method, but instead "forwarded" to another smart contract method. In a moment we'll show how that works in the client APIs which will make it a bit more clear how these forwarded arguments are used and why they're useful.

Inside of the `takeAction` method we check to see if the `on` `Address` is a contract address by attempting to create the contract for `on`, i.e. `Contract.for(on)`. If it exists, then the result will be defined. Then we instantiate the `SmartContract` for `on` and invoke its `approveReceiveTakeAction` method, forwarding any additional arguments we received in our invocation. Notice that we also check that the `on` `Address` is not the current caller, since there would be no point in invoking the contract that called us to see if the current call is approved - by virtue of being called by that contract we can safely assume the call is approved.

Let's look at another example contract that implements the `approveReceiveTakeAction` method.

```typescript
import { SmartContract, ForwardedValue } from '@neo-one/smart-contract';

export class OtherExample extends SmartContract {
  public approveReceiveTakeAction(value: string, otherValue: ForwardedValue<string>): boolean {
    // Do something with `value` and `otherValue`, potentially returning `false`.

    return true;
  }
}
```

Here we've again specified the `value` argument from the `takeAction` call that we're approving. We've also specified that we expect a `ForwardedValue` of type `string`. Similar to the `Fixed` type, the `ForwardedValue` type does not have any effect on the execution semantics of the smart contract, rather it effects the generated NEO•ONE client APIs. Before we take a look at the client APIs, let's recap what we've seen so far.

  1. Smart contracts can (and should) specify rest parameters that they will forward to an invocation on another contract to approve the action.
  2. Smart contracts can specify that they expect forwarded values on methods that they expect to be called by another smart contract.

Now let's put it all together with how one would invoke the `takeAction` method.

```typescript
// Assume we're working with a known `network`
const otherExampleAddress = otherExample.definition.networks[network].address;
const receipt = await example.takeAction(
  'value',
  otherExampleAddress,
  ...otherExample.forwardApproveReceiveTakeActionArgs('otherValue')
);
```

Here we see the generated NEO•ONE client APIs in action for `ForwardedValue`s. By marking the `otherValue` parameter as a `ForwardedValue`, the `forwardApproveReceiveTakeActionArgs` method is generated. This method is intended to be spread as the rest parameter for the `takeAction` method.

With `ForwardValue`, `ForwardedValue` and the convention of approving actions taken where the target is a smart contract, we have all the ingredients required to allow safe smart contract interaction in a single transaction. Try implementing it for yourself in the next section to enable the `Escrow` contract to manage balances in a single transaction.

## Instructions

We'll need to modify both the `Token` contract and the `Escrow` contract to enable single transaction deposits. In the `Token` contract:

  1. Add a rest parameter `approveArgs` with type `ForwardValue[]`.
  2. Use the same pattern as the first example above to invoke a method called `approveReceiveTransfer` on the `to` `Address` if it's a smart contract (and not the current caller).

In the `Escrow` contract:

  1. Add a method `approveReceiveTransfer` which has a `from` `Address`, an `amount` `Fixed<8>` and a `to` `ForwardedValue<Address>` parameter.
  2. If `Blockchain.currentCallerContract` is `undefined`, return `false`
  3. Increase the escrow balance of `from`, `to` and `Blockchain.currentCallerContract` (as the asset) by `amount`.
  4. Emit a `'balanceAvailable'` notification.
  5. Return `true`.

## Test

The tests for this chapter verify the same end result as previous chapters' `Escrow` contract tests. However, notice that the pre-approve and deposit process has been replaced with a single call to the `Token` contract `transfer` method with forwarded arguments. We've copied the relevant code below:

```typescript
const escrowAmount = new BigNumber(100);
const escrowAddress = escrow.definition.networks[networkName].address;
const transferReceipt = await token.transfer.confirmed(
  masterAccountID.address,
  escrowAddress,
  escrowAmount,
  ...escrow.forwardApproveReceiveTransferArgs(toAccountID.address),
);
```

## Wrap Up

This chapter introduced the concept of reactive contracts with forwarded values. By making it this far, you've started from scratch, potentially with zero knowledge of smart contracts, implemented not one, but two full smart contracts, built the UI for an ICO and learned the fundamentals of developing dapps on NEO. Congratulations!

We've reached the end of the course, but your journey into dapp development is just beginning. From here you can start on another course (coming soon!) or get started with [setting up a local development environment](/docs/environment-setup) with NEO•ONE to build your own unique dapp. We've covered the majority of the topics in the [Main Guide](/docs/hello-world) as well as a few from the [Advanced Guide](/docs/native-assets), but you may still find them useful.

If you enjoyed the course or if you have any feedback at all, let us know! Click the smiley face in the lower right hand side of the editor to Tweet us feedback. We'd love to hear from you! Alternatively, click the `Help` button to find other channels like Discord where you can come tell us what you think.

Thanks for taking part in the course, we hope you enjoyed it!
