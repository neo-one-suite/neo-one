# Chapter 1: Pre-Approved Transfers

Before we get started on the Escrow contract, we need to enable other contracts to interact with the EON Token contract on behalf of a user. There's two primary ways to do this, we'll learn about one in this chapter and the other in the next lesson.

As a quick reminder, remember that you can build the contracts by clicking `Build` at the bottom of the editor and you can run the tests by clicking `Run Tests`. Once the tests pass, you may proceed to the next chapter by clicking `Next`. If you ever get stuck, click `Show Solution` to view the solution code for the chapter.

## Learn

Recall from previous lessons that we used `Address.isCaller` to verify that a particular action, e.g. `transfer`, was both directly called by and approved by the given address. This means that a smart contract won't be able call `transfer` on behalf of another user, even if they've signed the transaction. We make this stronger check that the call is both approved AND direct because if we only checked that it was approved, i.e. the transaction was signed by the address, a malicious contract could drain the account of all NEP-5 tokens or related assets by simply calling every transfer method of every NEP-5 token.

Therefore, we'll need another mechanism to enable a smart contract to take action on behalf of another user. Let's take a look at an example.

```typescript
import { Address, Blockchain, SetStorage, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  public readonly preapprovedActions = SetStorage.for<[Address, Address]>();

  public approveAction(for: Address, by: Address): boolean {
    if (!Address.isCaller(for)) {
      return false;
    }

    this.preapprovedActions.add([for, by]);

    return true;
  }

  public revokeAction(for: Address, by: Address): boolean {
    if (!Address.isCaller(for)) {
      return false;
    }

    this.preapprovedActions.delete([for, by]);

    return true;
  }

  public action(for: Address): boolean {
    if (
      !Address.isCaller(for) &&
      (Blockchain.currentCallerContract === undefined || !this.preapprovedActions.has([for, Blockchain.currentCallerContract]))
    ) {
      return false;
    }

    // Take the action

    return true;
  }
}
```

In this example, we have a method `action` that represents taking an action on the parameter `for` `Address`. Like before, we check if `for` is the caller of the method. We've also added a check to see if the current calling contract, which can be accessed with the `Blockchain.currentCallerContract` property, has been preapproved to take the action. Notice that `Blockchain.currentCallerContract` may be `undefined`, that's because `Blockchain.currentCallerContract` will be `undefined` if the call was initiated directly by a user, and not through another smart contract.

If the exact mechanics here seems a bit confusing, don't worry, it will become more clear in the following chapter when we make use of the pre-approval with our Escrow contract.

A user can preapprove a contract by invoking the `approveAction` method, which first checks to see that the user is the caller and if so, adds the `by` parameter `Address` to the `preapprovedActions` `SetStorage`. We're using `SetStorage` for the first time here - like `MapStorage`, `SetStorage` works identically to a `Set` with the one exception that you can't get the `size` of it.

## Instructions

We're going to implement quite a bit this chapter, but most of it will just be reinforcing what we've learned in previous chapters with `Blockchain.currentCallerContract` thrown in. Remember, if you feel like you're not sure how to proceed, you can always check the solution by clicking `Show Solution`. Alternatively, you can take a look at the tests to see if you're on the right track.

Before diving into the detailed instructions, at a high level we want to enable users to approve smart contracts to make transfers for a given maximum amount on their behalf. We'll enable this by implementing a few methods, `approveSendTransfer` which will add to our approvals, `revokeSendTransfer` which will revoke an approval and `approvedTransfer` which will return the current amount approved for transferring. We'll hold off on modifying the `transfer` method to make use of approvals until one of the following chapters where we can properly test it. Let's get started!

  1. Add a `private` `readonly` `MapStorage<[Address, Address], Fixed<8>>` property called `approvedTransfers`. The first `Address` in the pair represents the user `Address` that is approving the second `Address` in the pair to transfer up to the `Fixed<8>` value amount of tokens.
  2. Add a `@constant` `approvedTransfer` method which takes two parameters, a `from` `Address` and a `by` `Address | undefined` and returns a `Fixed<8>` approved amount that the `by` `Address` can transfer on behalf of the `from` `Address`.
  3. Add an `approveSendTransfer` method which takes a `from` `Address`, a `by` `Address` and an `amount` `Fixed<8>` that the `from` `Address` wants to pre-approve transfers for the `by` `Address`. Remember to check for invalid inputs!
  4. In the `approveSendTransfer` method, invoke an event notifier that emits an event called `'approveSendTransfer'` for the `from`, `by`, and `amount` arguments.
  5. Add a `revokeSendTransfer` method which takes a `from` `Address`, a `by` `Address` and an `amount` `Fixed<8>` that the `from` `Address` wishes to revoke the pre-approve for.
  6. In the `revokeSendTransfer` method, invoke an event notifier that emits an event called `'revokeSendTransfer'` for the `from`, `by`, and `amount` arguments.


## Test

Phew, that was quite a bit. You should feel quite proud of yourself for implementing all of that! We've added a new test case (and skipped the old tests) which verifies the `approveSendTransfer` and `revokeSendTransfer` methods, once the tests pass you may proceed to the next chapter.

## Wrap Up

In this chapter we took a look at how we can pre-approve actions by smart contracts on behalf of other users by using the `Blockchain.currentCallerContract` property. We also exercised much of what we learned in the previous lessons by implementing multiple methods that enable approving and revoking transfers. On the other side of the `Next` button we'll start building our Escrow contract!
