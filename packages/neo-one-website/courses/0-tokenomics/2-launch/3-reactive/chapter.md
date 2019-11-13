# Chapter 4: Reactive Updates

The NEO•ONE client APIs use `Observable`s to make your dapps reactive. For example, `Observable`s allow them to easily update whenever a new block is broadcast on the network. If you're not familiar with `Observable`s, take a look at the extensive documentation at [ReactiveX](http://reactivex.io/). NEO•ONE uses [RxJS](https://rxjs-dev.firebaseapp.com/), so keep the documentation for both handy while you work through this chapter. [Rx Visualizer](https://rxviz.com/) is also a helpful tool for visualizing `Observable`s. With that said, we will walk through the steps of using `Observable`s in detail in this chapter, so if you'e never used them before, don't worry.

In this chapter we'll learn how to make our dapp reactive by automatically updating the UI when a user has participated in the ICO.

## Learn

Up until this point we've mainly interacted with the automatically generated smart contract APIs that correspond to our smart contract. The NEO•ONE client APIs also include a class called `Client` for more generic interactions with the NEO blockchain.

The `Client` class abstracts interaction with the blockchain using `UserAccount`s which are uniquely identified by a `UserAccountID` - a network (e.g. main network, test network, local network) and a NEO address. During initialization of your dapp you'll configure a `Client` with various `UserAccountProvider`s that serve to provide `UserAccount`s to the `Client`. For example, you might configure a `LocalUserAccountProvider` if you've implemented a full wallet in your dapp, though more commonly you would configure a `UserAccountProvider` that works with an existing wallet like NEO Tracker, nOS or NEX. By using the `Client` abstraction (also used by the generated smart contract APIs) throughout your dapp you can easily switch between and use different providers without changing a single line of your business logic.

Once configured, the `Client` instance serves as the entrypoint for interacting with and reading from the NEO blockchain beyond interacting with your smart contract. In this chapter, we'll focus on reacting to changes in the blockchain, but you can take a look at the [reference](/reference/@neo-one/client) on the `Client` APIs for a full description of what's available.

The two most commonly used properties of the `Client` are the `block$` `Observable` and the `currentUserAccount$` `Observable`. By subscribing to the `block$` `Observable` we can easily update the UI in response to new blocks created on the blockchain. By subscribing to the `currentUserAccount$` `Observable` we have access to the currently selected account, regardless of which provider it's associated with.

Let's take a look at an example.

```typescript
import { Address, constant, Fixed, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @constant
  public myConstantFunction(address: Address): Fixed<8> {
    // do something with address and return a Fixed<8> value
  }
}
```

```typescript
import { combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const value$ = combineLatest([client.currentUserAccount$, client.block$]).pipe(
  switchMap(async ([userAccount]) => {
    const value = await example.myConstantFunction(userAccount.id.address);

    return value;
  }),
);
```

Here we have a simple smart contract that returns a `Fixed<8>` value for a given `Address`, similar to the `balanceOf` function of the Eon smart contract. We combine the latest values of the `currentUserAccount$` and `block$` `Observable`s which results in another `Observable` that contains a pair of the latest `UserAccount` and `Block`. We then `pipe` that stream of values into the [`switchMap`](https://rxjs-dev.firebaseapp.com/api/operators/switchMap) operator which transforms the stream of values with an async function, returning the latest value from the `myConstantFunction` of the smart contract. Finally, we would subscribe to the stream of values in order to do something with each one, for example update a UI. Abstractly, this allows us to automatically call `myConstantFunction` with the current `UserAccount`'s address every time the current `UserAccount` changes or a new `Block` is added.

Because using `Observable`s to reactively update a UI is a very common pattern in developing dapps, NEO•ONE offers a React component, `FromStream`, which helps simplify integrating with React. Using the above stream for example, we could reactively update a UI with the following:

```tsx
<FromStream createStream={() => value$}>{(value) => <div>{value}</div>}</FromStream>
```

Now whenever the `value$` `Observable` from the above example emits a new `value`, the UI will automatically update with that value.

## Instructions

1. Implement the `createTokenInfoStream$` method. This method should return an `Observable` that calls the `getTokenInfo` function similar to the above examples, i.e. whenever the current user account changes or a new block comes in.

Remember, if you get stuck, you can click `Show Solution` to see the solution. If this is your first time working with `Observable`s they may seem a bit mysterious, but over time you'll add common patterns for using them to your toolbelt.

## Test

Once you've implemented the `createTokenInfoStream$` function correctly, try participating in the ICO and you should see the UI update reactively to the contribution. You can also try switching wallets using the developer tools, which will update the "Your Balance:" entry.

The tests verify the stream by checking the emitted values update reactively to contributions.

Before heading to the next chapter, take a look at how the `ICO` component (in `ICO.tsx`) uses the `FromStream` component we mentioned earlier to reactively update the UI in a very succint way. You'll also see how we're getting the `token` smart contract and `client` values - through the `WithContracts` component. This is a component that automatically wires up a React application to allow easy access to the functionality you need to interact with your dapp. Learn more about the React integration in the [documentation](/docs/react). Writing your app in Angular or Vue? No problem! Check out our [Angular](/docs/angular) or [Vue](/docs/vue) advanced guides to learn about to tools we provide.

## Wrap Up

In this chapter we took a whirlwind tour through `Observable`s and how they can be used to reactively update your dapp's UI. At this point, we have a fully reactive UI for participating in an ICO. We'll take a look at how we can invoke the `transfer` and `withdraw` methods in the next two chapters.
