---
slug: events-and-logs
title: Events and Logs
---
# Events and Logs

Smart contracts may emit events to allow listeners to *react* to changes in smart contract state.

[[toc]]

## Events

Decentralized apps commonly need to know the current state of a smart contract, sometimes by employing a centralized storage solution such as a relational database to store the current state in a more efficiently queryable way. Rather than poll the smart contract for the entire state every block, we can react to events emitted by the contract which represent the important state changes.

Create an event notifier using `createEventNotifier` and then invoke it to emit an event:

```typescript
const notifyActionHappened = createEventNotifier<Address, Fixed<8>>(
  'actionHappened',
  'target',
  'value',
);

export class HelloWorld extends SmartContract {
  public action(target: Address, value: Fixed<8>): boolean {
    notifyActionHappened(target, value);

    return true;
  }
}
```

The `createEventNotifier` function requires an event name as the first argument, and any number of strings that define the event parameter names as the following arguments. For each event parameter name, you must define the type of that parameter using a type parameter. In the example above, we've defined an event called `'actionHappened'` with two parameters:

  1. `target` which is an `Address`
  2. `value` which is a `Fixed<8>`

Events must be unique throughout a smart contract.

## Debugging with Logs

Smart contract debugging with NEO•ONE is as simple as adding a `console.log` statement wherever you would in a normal JavaScript program to aid in debugging. All types can be logged as well as converted to strings in a similar fashion to `console.log` in a JavaScript program. The logs will be printed in your terminal when executing smart contract methods through Node. They will also be printed to the developer tools console in your browser.

Don't forget to remove the `console.log` statements before going to production!

