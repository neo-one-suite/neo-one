---
id: testing
title: Testing
---
Once you've written you smart contract, it's time to test.  This guide will walk you through how to test your smart contract with NEO•ONE.

## Your Smart Contract API
You've finished writing the first version of your smart contract and you've run `yarn neo-one build` to compile and deploy your smart contract to a local private network.
In addition, the `yarn neo-one build` command also generates some files for you stored in the `../generated` directory relative to your contract.  The files specific to your contract
will be in the `../generated/<Your Contract Name>` directory.  You can find the generated files for the NEO•ONE Playground [here](https://github.com/neo-one-suite/neo-one-playground/tree/master/one/generated).

The most relevant generated file is the file called `types.ts` which lives your contract's generated directory.  This file serves as the front-end API for your smart contract.  You'll notice two main differences
between your smart contract definition file and the front-end API.
* Smart Contract methods return [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
  * Blockchain is inherently asynchronous as there is a time delay between blocks.
* Some types are converted to their front-end versions.
  * For example, Integers and Fixed point numbers are converted to [BigNumbers](https://github.com/MikeMcl/bignumber.js/).

As a concrete example, take a method which returns a contract's token balance for a given address. In the smart contract definition file, it might look like this:
```ts
import { Address, constant, Integer, SmartContract } from '@neo-one/smart-contract'

export class MyContract extends SmartContract {

  ...

  @constant
  public checkBalance(address: Address): Integer {
    // checks balance
  };

  ...
```
The front-end api will look like this:
```ts
import { AddressString, SmartContract } from '@neo-one/client';
import BigNumber from 'bignumber.js';

export interface MyContractSmartContract extends SmartContract {
  ...

  readonly checkBalance(address: AddressString) => Promise<BigNumber>

  ...
```

This file serves both as a reference for your smart contract's front-end api as well as types you can import to your front-end.

## Testing with Jest
NEO•ONE was built to allow your smart contracts to be tested with the [jest](https://jestjs.io/) testing framework.  In the NEO•ONE Playground, you can find the test files [here](https://github.com/neo-one-suite/neo-one-playground/tree/master/one/tests).
To setup your smart contract test, you will need to import the generated testing helper, `withContracts`:
```ts
import { withContracts } from '../generated/test'
```
This helper resets and redeploys your contracts to a local private network and gives you access to some helpful tools to help you interact with your smart contract and the blockchain in your test:
* yourSmartContract
  * Your smart contract will be available by its name in camel case and gives you full access to your smart contract api.
* client
  * The NEO•ONE client api is your main resource for interfacing with the blockchain.  You can create wallets, scrape blocks, and much more.  Learn about the client api in detail [here](/docs/en/client.html).
* developerClient
  * The developerClient allows you to interface with the blockchain in ways that only make sense during development.  You can force consensus, fast forward the network, and much more.  Learn about the developerClient api in detail [here]().
* masterAccountID
  * A master wallet with plenty of NEO and GAS for you to play with.
* networkName
  * The name of the local private network network your contract is deployed on.

To use `withContracts` in your test, simply call it at the top of your test.  Its only argument is an asynchronous callback which forwards all of the above tools.  Then, your test is written like a standard jest test inside of this callback.
To give an example, lets look at how you would write a test to check that `checkBalance` is working.
```ts
import { createPrivateKey } from '@neo-one/client';
import { withContracts } from '../generated/test';

describe('MyContract', () => {
  test('checkBalance', async () => {
    await withContracts(async ({ client, developerClient, myContract, masterAccountID, networkName }) => {

      // use the client to create a new wallet
      const newWallet = await client.providers.memory.keystore.addAccount({
        network: networkName,
        privateKey: createPrivateKey(),
      });

      // use the smart contract api to call checkBalance for the new wallet's address
      const balance = await myContract.checkBalance(newWallet.account.id.address);

      // use matchers to confirm you expect the new wallet's balance to be 0
      expect(balance.toString()).toEqual('0');
    }
  }
}
```

That's it!  The full power of jest is available to you for testing every aspect of your smart contract running on a local private network.
