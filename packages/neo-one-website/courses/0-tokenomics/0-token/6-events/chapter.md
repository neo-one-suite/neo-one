# Chapter 7: Events

In this chapter we'll learn about how NEO•ONE smart contracts can emit events. We'll also talk about why and when you would want to emit events from your smart contract.

## Learn

Let's jump right into an example of how to emit an event from a NEO•ONE smart contract.

```typescript
import { Address, createEventNotifier, SmartContract } from '@neo-one/smart-contract';

const notifyAddress = createEventNotifier<Address>('emit', 'address');

export class Example extends SmartContract {
  public emitEvent(addr: Address): void {
    notifyAddress(addr);
  }
}
```

In this very simple example, every time the `emitEvent` method is invoked, the `Example` smart contract emits an event with the name `'emit'` and a parameter `'address'` that is an `Address`. Simple right? The general syntax for `createEventNotifier` is `createEventNotifier<Param0Type, Param1Type, Param2Type, ...>('<event name>', '<param0 name>', '<param1 name>', '<param2 name>', ...)`. Then you just call the returned function whenever you want to emit that event.

Now, what does that actually do? Well, events (also called notifications) are a way for your contract to communicate that something happened on the blockchain to your app front-end (or back-end), which can be 'listening' for certain events and take action when they happen. You might use this to update an external database, do analytics, or update a UI.

## Try

Let's add an event called `transfer` with a `from` `Address | undefined` parameter, `to` `Address | undefined` parameter, and an `amount` `Fixed<8>` parameter. We'll use this later when we define the `transfer` method, but we can also use it now to represent issuing tokens - simply call the event notifier in the `issue` method with `from` set to `undefined` to indicate that we're minting new tokens.

## Test

Recall last chapter we glossed over the `TokenEvent` type in the receipt. Well now that we actually have an event, `transfer`, we can access the events from our issue receipt. Notice in `Token.test.ts` that we added lines 41-49 which verify that the event was emitted as expected.

## Wrap Up

At this point, we have learned pretty much all of the basics of creating a smart contract. In the next chapter we'll put it all together by implementing the `transfer` method.
