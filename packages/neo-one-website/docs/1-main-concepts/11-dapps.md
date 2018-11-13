---
slug: dapps
title: Decentralized Apps
---
Building a decentralized app doesn't have to be hard, use these tools from NEO•ONE to make it quick and easy.

In addition to the client APIs we've already walked through, there are a few properties on the `Client` that help make your app reactive. We'll also cover using the NEO•ONE Developer Tools to help speed up manual testing of your dapp.

---

[[toc]]

---

## Reactive

NEO•ONE uses [Observables](http://reactivex.io/) with [RxJS](http://reactivex.io/rxjs) to enable reactivity in dapps. The `Client` class has several `Observable` properties that can be subscribed to in order to update application state and the application UI. The most commonly used is the `block$` property:

```typescript
class Client {
  /**
   * Emits a value whenever a block is persisted to the blockchain.
   *
   * Immediately emits the latest block/network when subscribed to.
   */
  public readonly block$: Observable<{
    readonly block: Block;
    readonly network: NetworkType;
  }>
}
```

The `Observable` emits a value whenever a new block is persisted to the blockchain for the given network. The `network` property corresponds to the currently selected user account's network. The `Observable` automatically updates to start emitting new blocks from another network whenever the underlying network changes due to a change in the selected user account.

We can update application state that depends on new blocks by subscribing to the `block$` `Observable`:

```typescript
client.block$.subscribe(({ block, network }) => {
  // Update application state using the latest block and network
})
```

::: warning

Tip

If you're using React, check out the `FromStream` component in the [React](/docs/react) advanced guide for a streamlined way to integrate `Observable`s in your application.

:::

One common use-case is to update the user balance whenever a new block is persisted. For example, if we're displaying the user's NEO and GAS balance:

```typescript
client.block$.pipe(
  switchMap(async () => {
    const userAccount = client.getCurrentUserAccount();
    if (userAccount === undefined) {
      return undefined;
    }

    const account = await client.getAccount(userAccount.id)

    return { neo: account.balances[Hash256.NEO], gas: account.balances[Hash256.GAS] };
  }),
).subscribe((result) => {
  if (result === undefined) {
    // Update the UI when a user account is not selected
  } else {
    const { neo, gas } = result;
    // Update the UI with the new neo and gas values.
  }
});
```

This is a fairly common pattern, so `Client` already exposes an `Observable` for it:

```typescript
class Client {
  /**
   * Emits a value whenever a new user account is selected and whenever a block is persisted to the blockchain.
   *
   * Immediately emits the latest value when subscribed to.
   */
  public readonly accountState$: Observable<
    | {
        readonly currentUserAccount: UserAccount;
        readonly account: Account;
      }
    | undefined
  >;
}
```

Thus, we can simplify the above example to just:

```typescript
client.accountState$.subscribe((result) => {
  if (result === undefined) {
    // Update the UI when a user account is not selected
  } else {
    const neo = result.account.balances[Hash256.NEO];
    const gas = result.account.balances[Hash256.GAS];
    // Update the UI with the new neo and gas values.
  }
})
```

Take a look at the [@neo-one/client](/docs/client) reference for details on all available `Observable`s.

---

## Developer Tools

NEO•ONE Developer Tools simplify the process of developing and manually testing your dapp. They contain all of the functionality necessary to control your private network:

  - Immediately run consensus
  - Fast forward to a future time
  - Reset the local network to it's initial state
  - Full wallet implementation with the same set of pre-configured wallets as tests
  - Settings for controlling automatic consensus and system fees, seconds per block and adding NEP-5 token addresses to the wallet
  - Notifications when transactions are confirmed with links to view the transaction on a local NEO Tracker instance

Enabling the Developer Tools is easy:

```typescript
const client = createClient();
const developerClients = createDeveloperClients();
const localClients = createLocalClients();
DeveloperTools.enable({ client, developerClients, localClients });
```

Simply use the generated helper functions in `one/generated/client.ts` to construct the various clients the Developer Tools require and then call `enable`.

::: warning

Note

If you've integrated NEO•ONE using the [React](/docs/react) advanced guide, then the Developer Tools are automatically enabled with no additional calls or configuration required.

:::

When building for production, the Developer Tools are automatically replaced with an empty implementation, so they won't show up for your users nor affect the bundle size.
