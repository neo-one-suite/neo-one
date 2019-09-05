---
slug: client-apis
title: Client APIs
---

Now it's time to take a look at the client APIs and learn how to interact with smart contracts from a dapp.

The NEO•ONE client APIs are organized into two packages, `@neo-one/client` which contains the most commonly used functionality, and `@neo-one/client-full` which contains extended but rarely used functionality. In general a dapp developer only needs to concern themselves with the APIs offered by `@neo-one/client`. Learn more about the `@neo-one/client-full` APIs in the [Extended Client APIs](/docs/extended-client-apis) advanced guide.

---

[[toc]]

---

## Client

The `@neo-one/client` APIs center around instances of the `Client` class. The `Client` class abstracts away user accounts and even how those accounts are provided to your dapp, for example, they might come from an extension like NEX, dapp browser like nOS or through some other integration.

::: warning

Tip

Do not roll your own wallet when creating a dapp. This fractures the ecosystem and in the worst case, requires users to trust every dapp with their private keys. Instead, configure your `Client` to work with one of the existing wallets. Read more in the [User Accounts](/docs/user-accounts) advanced guide.

:::

The `Client` class also contains a few methods that may be useful in the course of developing a dapp:

- `getCurrentUserAccount(): UserAccount | undefined` - Returns the currently selected `UserAccount`. Returns `undefined` if there are no `UserAccount`s.
- `getCurrentNetwork(): NetworkType` - Returns the currently selected network, a string that will be `'main'` for the MainNet, `'test'` for the TestNet, and typically `'local'` for a local private network.
- `getAccount(id: UserAccountID): Promise<Account>` - Returns an object containing the native asset balances for a given `UserAccountID`.

The `Client` class also contains two methods for creating transactions.

```typescript
class Client {
  public async transfer(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction>>;
  public async transfer(transfers: readonly Transfer[], options?: TransactionOptions): Promise<TransactionResult>;

  public async claim(optionsIn?: TransactionOptions): Promise<TransactionResult>;
}
```

- `transfer` creates a transaction for transferring native assets from the currently selected account (by default) to the specified address(es).
- `claim` creates a transaction for claiming unclaimed GAS for the currently selected account.

We'll go into more detail on the shape of the `TransactionResult` object and the semantics of creating transactions in the next chapter.

All methods that relay transactions to the blockchain optionally accept a `TransactionOptions` object (or an extension of it) for customizing the relayed transaction:

```typescript
interface TransactionOptions {
  /**
   * The `UserAccount` that the transaction is "from", i.e. the one that will be used for native asset transfers, claims, and signing the transaction.
   *
   * If unspecified, the currently selected `UserAccount` is used as the `from` address.
   *
   * DApp developers will typically want to leave this unspecified.
   */
  from?: UserAccountID;
  /**
   * Additional attributes to include with the transaction.
   */
  attributes?: readonly Attribute[];
  /**
   * An optional network fee to include with the transaction.
   */
  networkFee?: BigNumber;
  /**
   * A maximum system fee to include with the transaction. Note that this is a maximum, the client APIs will automatically calculate and add a system fee to the transaction up to the value specified here.
   *
   * Leaving `systemFee` `undefined` is equivalent to `new BigNumber(0)`, i.e. no system fee.
   *
   * A `systemFee` of `-1`, i.e. `new BigNumber(-1)` indicates no limit on the fee. This is typically used only during development.
   */
  systemFee?: BigNumber;
}
```

Putting this all together, if we wanted to transfer funds to another account, but only if the account is empty, we would do:

```typescript
const account = await client.getAccount(otherAccountID);
if (account.balances[Hash256.NEO] === undefined) {
  await client.transfer.confirmed(new BigNumber(10), Hash256.NEO, otherAccountID.address);
}
```

We'll learn more about the `confirmed` property in the next chapter. Also take note of the `Hash256.NEO` property, which works just like the `Hash256.NEO` property in smart contracts and can be imported directly from `@neo-one/client`.

---

## Toolchain Code Generation

The NEO•ONE toolchain generates many files that contain helpers and APIs that are essential for dapp development. Running `neo-one build` will emit TypeScript files. Let's briefly cover what each one contains.

::: warning

Note

The output directory for generated files is configurable. You can also change the configuration to emit pure JavaScript files instead of TypeScript. See the [Configuration](/docs/configuration) reference for details.

:::

For each contract, the toolchain will emit 3 files:

- `src/neo-one/<ContractName>/abi.ts` - Contains the ABI that generates the client smart contract APIs at runtime that we'll discuss in the next chapter.
- `src/neo-one/<ContractName>/contract.ts` - Contains the smart contract definition, which contains the ABI, the source maps for the contract and a mapping from network name to deployed address for the smart contract. Initially the network mapping will only contain the `local` network which represents your local development network. Once you deploy your smart contract to the TestNet or MainNet, it will also contain deployed contract addresses for those networks. The client APIs automatically choose which address to work with based on the network of the user account that is initiating the request. This file also contains a helper function for creating the smart contract APIs given a `Client`.
- `src/neo-one/<ContractName>/types.ts` - Contains the TypeScript type definitions for the smart contract client APIs.

5 files will also be emitted that are common to all of your smart contracts:

- `src/neo-one/client.ts` - Contains helper functions for creating a fully configured `Client`. The `Client` is also configured automatically for local development with 11 user accounts that each have varying amounts of NEO and GAS. Additionally contains helper functions for creating `DeveloperClient`s which can be used to control your local development environment. These are generally passed on to the NEO•ONE Developer Tools which we'll talk about in a later chapter.
- `src/neo-one/react.tsx` - Contains two react components, that when used together allow you to easily access all of the tools you need to write a dapp with React throughout your component tree. Read more in the [React](/docs/react) advanced guide. We also provide similar tools for apps written in [Angular](/docs/angular) or [Vue](/docs/vue)!
- `src/neo-one/sourceMaps.ts` - Contains all of the smart contract source maps. These source maps are not included in the production build in order to reduce the bundle size.
- `src/neo-one/test.ts` - Contains the `withContracts` test helper. We'll learn more about this helper in the following chapters.
- `src/neo-one/contracts.ts` - Contains the `Contracts` type whose properties are the smart contract APIs for your dapp.

---

## Integration

Integrating the NEO•ONE client APIs in a vanilla JavaScript or TypeScript application is very simple - assuming we have a contract called `Token` and we're in the `src/index.ts` file using the default NEO•ONE toolchain paths:

```typescript
import { createClient, createTokenSmartContract } from './neo-one';

const client = createClient();
const token = createTokenSmartContract(client);
```

Now we can use both the base blockchain APIs offered by the `Client` class and the generated smart contract APIs that correspond to the `Token` contract.

::: warning

Note

As you prepare your dapp for production, you'll likely want to configure additional `UserAccountProvider`s in the `Client`. Learn more about `UserAccount`s and `UserAccountProvider`s in the [User Accounts](/docs/user-accounts) advanced guide.

:::

---

## Utilities

`@neo-one/client` exports many utility functions for working with private keys, addresses, public keys and script hashes:

- The most common come in the form of conversion functions: `<fromFormat>To<toFormat>`, for example, `privateKeyToAddress`. See the full list in the [@neo-one/client](/reference/@neo-one/client) reference.
- `createPrivateKey` returns a new private key.
- `decryptNEP2`, `encryptNEP2` and `isNEP2` implement [NEP-2](https://github.com/neo-project/proposals/blob/master/nep-2.mediawiki)
