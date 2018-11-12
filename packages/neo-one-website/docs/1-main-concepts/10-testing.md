---
slug: testing
title: Testing
---
Use your favorite unit test framework to test smart contracts using the NEO•ONE client APIs.

---

[[toc]]

---

## withContracts

The NEO•ONE toolchain generates a helper function called `withContracts` in `one/generated/test.ts` that makes testing a breeze:

```typescript
import { withContracts } from '../generated/test';

describe('Token', () => {
  test('the token has NEP-5 properties', async () => {
    await withContracts(async ({ token }) => {
      const [name, symbol, decimals, totalSupply, initialBalance, owner] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
      ]);
      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(decimals.toNumber()).toEqual(8);
      expect(totalSupply.toNumber()).toEqual(100_000_000);
    });
  });
});
```

By convention, smart contract tests are located in `one/tests`, but you can place them wherever you'd like.

::: warning

Note

In all of our examples we'll use [Jest](https://jestjs.io/) for the testing framework, but the `withContracts` function is framework agnostic, so you may use it with any testing framework.

:::

The `withContracts` function starts up a fresh network for each test case, compiles all of your smart contracts, deploys them to the local network, pre-configures a `Client` as well as a `DeveloperClient` and creates the smart contract APIs. It then passes everything it's setup to an async callback function that you specify where your testing logic should reside. The properties available to your function are:

```typescript
interface TestOptions {
  /**
   * The local network name that the smart contracts have been deployed to and the `client` has been configured with.
   */
  readonly networkName: string;
  /**
   * `Client` that has been pre-configured with the master account for the local network as well as each of the accounts in `accountIDs`.
   */
  readonly client: Client<{
    readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
  }>;
  /**
   * `DeveloperClient` that's been configured to point at the local testing network.
   */
  readonly developerClient: DeveloperClient;
  /**
   * `UserAccountID` of the "master" account - the account that contains ~100 million NEO and ~58 million GAS.
   *
   * This user account is also the currently selected user account in the `Client` and the one that deployed the contracts.
   */
  readonly masterAccountID: UserAccountID;
  /**
   * Private key for the `masterAccountID`.
   */
  readonly masterPrivateKey: string;
  /**
   * 10 additional user accounts that have been configured in the client with varying amounts of NEO and GAS:
   *
   * At index:
   *  0. 0 NEO and GAS
   *  1. 1 NEO and GAS
   *  2. 10 NEO and GAS
   *  3. 100 NEO and GAS
   *  4. 1000 NEO and GAS
   *  5. 10000 NEO and GAS
   *  6. 100000 NEO and GAS
   *  7. 1000000 NEO and GAS
   *  8. 5 NEO and GAS
   *  9. 20 NEO and GAS
   */
  readonly accountIDs: ReadonlyArray<UserAccountID>;
}
```

In addition to the properties listed above, the object will contain a smart contract API object property for each smart contract in your project, configured with the `Client` at the `client` property. The example at the beginning of this section shows how you could access the smart contract API for a smart contract called `Token`.

Within the callback to the `withContracts` function, we can test our smart contracts using the same NEO•ONE client APIs that we use to interact with the contract in production (and that we've discussed over the previous 2 chapters).

The network and clients are setup to run consensus immediately with every transaction, so tests do not have to wait for blocks to be produced every 15 seconds. If you'd like to turn off this behavior, or configure other aspects of `withContracts`, you may pass in an options object as the second parameter:

```typescript
interface WithContractsOptions {
  /**
   * Ignore compiler warnings. Useful during smart contract development.
   *
   * Defaults to `false`.
   */
  readonly ignoreWarnings?: boolean;
  /**
   * Automatically deploy smart contracts using the defaults specified in the constructor arguments.
   *
   * Defaults to `true`.
   */
  readonly deploy?: boolean;
  /**
   * Automatically run consensus whenever a transaction is relayed.
   *
   * Defaults to `true`.
   */
  readonly autoConsensus?: boolean;
  /**
   * Automatically provide the necessary system fee for every transaction to execute.
   *
   * Defaults to `true`.
   */
  readonly autoSystemFee?: boolean;
}
```

For example, to turn off automatic consensus:

```typescript
describe('Token', () => {
  test('has nep-5 properties', async () => {
    await withContracts(
      async ({ token }) => {
        // Test that it has the expected properties
      },
      { autoConsensus: false },
    );
  });
});
```

---

## DeveloperClient

`DeveloperClient` is a class that is configured to point at a local development network. This class provides methods that are useful during testing:

  - `runConsensusNow(): Promise<void>` - trigger consensus to run immediately
  - `fastForwardOffset(seconds: number): Promise<void>` - fast forward the local network by `seconds` into the future. Use this method to test time-dependent smart contracts.
  - `fastForwardToTime(seconds: number): Promise<void>` - fast forward to a particular unix timestamp in the future.
  - `reset(): Promise<void>` - reset the local network to it's initial state starting at the genesis block.
  - `updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void>` - update settings for the private network. Currently only has a property for controlling the seconds per block.

Putting it all together, we might test a time dependent ICO contract like so:

```typescript
describe('Token', () => {
  test('allows participation in the ICO during the allotted time', async () => {
    await withContracts(async ({ token, developerClient }) => {
      // Fast forward to the start of the ICO
      await developerClient.fastForwardOffset(60 * 60);

      // Verify that we can participate in the ICO
      const receipt = await token.mintTokens.confirmed({
        sendTo: [{
          asset: Hash256.NEO,
          amount: new BigNumber(10),
        }],
      });
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }
      expect(receipt.result.value).toEqual(true);

      // Fast forward past the end of the ICO
      await developerClient.fastForwardOffset(24 * 60 * 60);

      // Verify that contributing after the end of the ICO throws an error.
      // We could also do a similar verification above before the start of the ICO.
      let error: Error | undefined;
      try {
        await token.mintTokens.confirmed({
          sendTo: [{
            asset: Hash256.NEO,
            amount: new BigNumber(10),
          }],
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });
});
```
