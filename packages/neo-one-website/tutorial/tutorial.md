This tutorial serves as an introduction to NEO•ONE and does not assume any prior knowledge.

---

[[toc]]

---

## Before We Get Started

This tutorial focuses on creating a token, but even if you have no plans to build a token, give this tutorial (or the course) a chance. The techniques you’ll learn in the tutorial are fundamental to building decentralized apps with NEO•ONE, and mastering it will give you a deep understanding of NEO•ONE.

::: warning

Tip

This tutorial is designed for people who prefer to learn by doing. If you prefer learning concepts from the ground up, check out our [step-by-step guide](/docs/hello-world). You might find this tutorial and the guide complementary to each other.

:::

The tutorial is divided into 3 sections:

1. [Setup](/tutorial#Setup) will give you a **starting point** to follow the tutorial.
2. [Create a Token](/tutorial#Create-a-Token) will teach you the **fundamentals** of NEO•ONE smart contract development.
3. [DApps](/tutorial#DApps) will cover how to **integrate** NEO•ONE into your DApps.

While each section follows from the previous, you don't have to complete the entire tutorial to get value out of it. We'll cover a broad range of topics, so don't feel the need to try to complete the tutorial all in one sitting.

While all snippets in the tutorial can be copy-pasted, we recommend typing the solutions directly into your editor in order to reinforce the learnings.

---

## Setup

### Prerequisites

NEO•ONE is a JavaScript library so we'll assume you have a basic understanding of the JavaScript language. **If you're not sure, we recommend taking a [JavaScript tutorial](https://developer.mozilla.org/en-US/docs/Web/JavaScript/A_re-introduction_to_JavaScript) to check your knowledge level**. It might take some time to complete, but then you won't be trying to learn both NEO•ONE and JavaScript at the same time.

NEO•ONE itself is written in [TypeScript](http://www.typescriptlang.org/) and throughout the tutorial we will use TypeScript, however the tutorial assumes no prior knowledge. We will introduce TypeScript specific concepts as they're used, with links to documentation to learn more.

The tutorial assumes general familiarity with blockchain and the NEO blockchain in particular. Check out the [Blockchain Basics](/docs/blockchain-basics) chapter of the main guide if you are unfamiliar with the general concepts of blockchain or need a refresher.

The tutorial will leverage [React](https://reactjs.org). If you'd prefer to use another front-end framework, or no framework at all, that's okay too! We'll only briefly cover how to use React with NEO•ONE and otherwise it will primarily be used to show how one might integrate NEO•ONE with a front-end framework, so in-depth knowledge of React is not required.

Finally, we'll use [Jest](https://jestjs.io/) for testing our smart contracts, however, note that NEO•ONE may be used with any testing framework.

### Setup for the Tutorial

This tutorial assumes you'll be working with a local development environment.

Here's how to setup your local development environment:

1. Install [Node](https://nodejs.org) >= 10.16.0 (We recommend the latest version)

- Linux and Mac: We recommend using [Node Version Manager](https://github.com/creationix/nvm).
- Windows: We recommend using [Chocolatey](https://chocolatey.org/).

2. Install [C# .NET](https://docs.microsoft.com/en-us/dotnet/) version 5.0.302

3. Add a `global.json` file to the root of your project repo with this JSON:

```json
{
  "sdk": {
    "version": "5.0.302"
  }
}
```

This tells your local C# .NET runtime to use version 5.0.302 in this repo, even if you have newer versions installed on your machine.

4. Follow the [installation instructions for Create React App](https://reactjs.org/docs/create-a-new-react-app.html#create-react-app) to make a new project.

- Be sure to invoke Create React App with `--template typescript` in order to enable TypeScript support: `npx create-react-app token --template typescript`

5. Change your current working directory into your new `token` directory created by `create-react-app` by running `cd token` or `cd <path/to/your/new/token/directory>`

6. Install NEO•ONE using either [yarn](https://yarnpkg.com/)

```bash
yarn add @neo-one/cli@prerelease @neo-one/client@prerelease @neo-one/smart-contract@prerelease @neo-one/smart-contract-test@prerelease @neo-one/smart-contract-lib@prerelease @neo-one/smart-contract-typescript-plugin@prerelease
```

```bash
npm install @neo-one/cli@prerelease @neo-one/client@prerelease @neo-one/smart-contract@prerelease @neo-one/smart-contract-test@prerelease @neo-one/smart-contract-lib@prerelease @neo-one/smart-contract-typescript-plugin@prerelease
```

7. Add environment variables to get the NEO•ONE node working:

- On **Windows**:

  - Add these environment variables to your shell environment:
    - `EDGE_USE_CORECLR=1`
    - `EDGE_APP_ROOT=<path/to/project>/node_modules/@neo-one/node-vm/lib/bin/Debug/net5.0`
      - If after adding `EDGE_APP_ROOT` and `EDGE_USE_CORECLR` to the shell environment you still get errors then add the same `EDGE_APP_ROOT` variable before the shell command that you are trying to run with NEO•ONE. For example: `EDGE_APP_ROOT=<path/to/project>/node_modules/@neo-one/node-vm/lib/bin/Debug/net5.0 npx neo-one start network`.

- On **macOS**:
  - Add these environment variables to your shell environment:
    - `EDGE_USE_CORECLR=1`
    - `EDGE_APP_ROOT=<path/to/project>/node_modules/@neo-one/node-vm/lib/bin/Debug/net5.0`
      - If after adding `EDGE_APP_ROOT` and `EDGE_USE_CORECLR` to the shell environment you still get errors then add the same `EDGE_APP_ROOT` variable before the shell command that you are trying to run with NEO•ONE. For example: `EDGE_APP_ROOT=<path/to/project>/node_modules/@neo-one/node-vm/lib/bin/Debug/net5.0 npx neo-one start network`.
  - Install `pkgconfig` on macOS with Homebrew: `brew install pkgconfig`
    - Then add this environment variable: `PKG_CONFIG_PATH=/Library/Frameworks/Mono.framework/Versions/Current/lib/pkgconfig`
    - You then need to re-install your node modules by deleting the `node_modules` folder and then running `npm install` again

8. Run `yarn neo-one init` or `npx neo-one init`

This command initializes a NEO•ONE project with a `Hello World` smart contract under `neo-one/contracts/HelloWorld.ts`, a unit test under `src/__tests__/HelloWorld.test.ts`, and a config file,`.neo-one.config.ts`. For this tutorial, we will be building a `Token` from the ground up, so you can go ahead and delete the two `HelloWorld` files. We also recommend taking a moment to [setup your editor](/docs/environment-setup#Editor-Setup) to take advantage of inline NEO•ONE compiler diagnostics.

9. Review the available [configuration options](/docs/config-options) and update your `.neo-one.config.ts` file as needed.

10. Test your setup using `npx neo-one start network`. The output should be something like `{"level":30,"time":1625855073745,"service":"node","service":"blockchain","name":"neo_blockchain_start","msg":"Neo blockchain started.","v":1}`. You may need to use `sudo` depending on your project configuration.
    - If you run into problems, then please reach out to us on [Discord](https://discord.gg/S86PqDE)

- This tutorial uses the default options. To follow along, nothing needs to be changed.

## Troubleshooting

You may or may not run into environment problems when using the CLI, trying to test your smart contract, or other NEO•ONE functions that use the NEO•ONE node. The NEO•ONE node now uses the C# NeoVM instead of our own implementation of the NeoVM in TypeScript, which means that NEO•ONE controls C# code through some complicated mechanisms. If you run into problems with running a node (such as when running `neo-one init` or `neo-one build`) then try these steps:

- Add these environment variables to your shell environment:
  - `EDGE_USE_CORECLR=1`
  - `EDGE_APP_ROOT=<path/to/project>/node_modules/@neo-one/node-vm/lib/bin/Debug/net5.0`
    - If after adding `EDGE_APP_ROOT` and `EDGE_USE_CORECLR` to the shell environment you still get errors then add the same `EDGE_APP_ROOT` variable before the shell command that you are trying to run with NEO•ONE. For example: `EDGE_APP_ROOT=<path/to/project>/node_modules/@neo-one/node-vm/lib/bin/Debug/net5.0 npx neo-one start network`.
- Install `pkgconfig` on macOS with Homebrew: `brew install pkgconfig`
  - Then add this environment variable: `PKG_CONFIG_PATH=/Library/Frameworks/Mono.framework/Versions/Current/lib/pkgconfig`
  - You then need to re-install your node modules by deleting the `node_modules` folder and then running `npm install` again
- Try running the NEO•ONE CLI command using `sudo`, such as: `sudo npx neo-one init`

To see a demonstration of environment setup go to our [YouTube channel](https://www.youtube.com/channel/UCya5J1Tt2h-kX-I3a7LOvtw) for helpful videos.

### Help, I'm Stuck!

If you get stuck, check out the [Help](/docs/getting-started#Help) section. In particular, come chat with us on [Discord](https://discord.gg/S86PqDE), we're more than happy to assist in any way we can.

---

## Create a Token

Now that you're all setup, let's get started!

### Basic Smart Contract

Every NEO•ONE smart contract starts with a TypeScript source file that exports a single [class](https://www.typescriptlang.org/docs/handbook/classes.html) extending `SmartContract`. So we'll start by creating the file `neo-one/contracts/Token.ts` with the following:

```typescript
import { SmartContract } from '@neo-one/smart-contract';

export class Token extends SmartContract {}
```

::: warning

Note

For brevity, from here on we will not include the `import` statement for smart contract types and values as they may all be imported from `'@neo-one/smart-contract'`. Note also that we will not include the full contract source code in each snippet, instead each snippet will be purely additive, so you can assume all of the code seen so far is also included in the class.

:::

This smart contract doesn't do a whole lot, in fact it does nothing, but this is the smallest compilable smart contract. Let's go ahead and build it to familiarize ourself with the NEO•ONE toolchain by running `yarn neo-one build`. This command will:

1. Start up a local private NEO network (if one has not already been started).
2. Setup wallets for testing with various amounts of NEO and GAS.
3. Compile the project's smart contracts
4. Deploy the smart contracts to the private NEO network.
5. Generate code for use in your decentralized app.

Additionally, you may run `yarn neo-one build` OR `npx neo-one build` with the `--reset` flag to reset the network. Running with `--watch` will execute the above process whenever you make a change to your smart contracts.

### Testing

Throughout the tutorial we'll write tests for each piece of smart contract functionality. Run the tests using `yarn test` OR `npm test`. It's convention to put smart contract tests under `src/__tests__/`, e.g. `src/__tests__/Token.test.ts`. This way, jest will automatically pick up the tests without any additional configuration. Create a new file `src/__tests__/Token.test.ts` and add the following:

```typescript
/**
 * @jest-environment node
 */
import { withContracts } from '../neo-one/test';

describe('Token', () => {
  test('exists', async () => {
    await withContracts(async ({ token }) => {
      expect(token).toBeDefined();
    });
  });
});
```

::: warning

Note

For brevity, from here on we will only include the `withContracts` call and the testing code that validates the most recently added piece of logic. Feel free to organize your tests however you'd like. You may split them up into many tests, but be aware that there is a small, but not insignificant, constant overhead to each test for setting up the local test network.

:::

Here we see the first generated artifact from step 5/ of `neo-one build` - the `withContracts` test helper. This helper works exactly the same as `neo-one build` with two exceptions; it does not generate code and it creates an isolated environment each time it's called. The helper expects an async callback method that it will invoke with the NEO•ONE client and smart contract APIs, the accounts with various amounts of NEO and GAS and a `DeveloperClient` for controlling the test network. We'll see how to use all of these later in the tutorial.

Let's dive into implementing the token.

### Contract Properties

We'll start by adding [readonly](https://www.typescriptlang.org/docs/handbook/classes.html#readonly-modifier) constant properties. Just like regular TypeScript, `readonly` properties cannot be changed. Marking a property as [public](https://www.typescriptlang.org/docs/handbook/classes.html#public-private-and-protected-modifiers) will generate a smart contract method with the same name for accessing the property. Note that even if a property is marked as [private](https://www.typescriptlang.org/docs/handbook/classes.html#public-private-and-protected-modifiers), all contract code and storage is publicly accessible, so nothing is ever truly private.

Let's add a few primitive properties to the `Token` smart contract:

```typescript
export class Token extends SmartContract {
  public readonly name = 'Eon';
  public readonly symbol = 'EON';
  public readonly decimals = 8;
}
```

Now we'll want to test that we can access these properties and they have the expected values:

```typescript
await withContracts(async ({ token }) => {
  const [name, symbol, decimals] = await Promise.all([token.name(), token.symbol(), token.decimals()]);
  expect(name).toEqual('Eon');
  expect(symbol).toEqual('EON');
  expect(decimals.toNumber()).toEqual(8);
});
```

Notice how we're using methods that correspond directly with the property names in our smart contract. The return types also correspond directly to the types in the smart contract, with a few notable exceptions. First, and most importantly, they return a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) which resolves with the value of the property. We return a `Promise` in particular because all communication with the blockchain is inherently asynchronous. For example, in this case we need to make a request to a node to fetch the current value of the property.

Another exception you may have noticed is that we're calling `toNumber` on the `decimals` value. That's because we always return a `BigNumber` from the smart contract APIs, due to JavaScript's limitations around arbitrary size integer and floating point numbers.

### Storage Properties

Next we'll add properties for storing the balance of each `Address` that holds tokens as well as the total supply.

```typescript
export class Token extends SmartContract {
  private mutableSupply: Fixed<8> = 0;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();
}
```

Before diving into these properties, let's describe the mental model for TypeScript smart contracts. The way to think about how the smart contract we're building works is that when it's published to the blockchain we construct it, i.e. we call the equivalent of `new Token()`. Then for every invocation we use that one instance, so any changes to storage properties are persisted between invocations. In short, our smart contract follows the [singleton pattern](https://en.wikipedia.org/wiki/Singleton_pattern).

So, we can see that `mutableSupply` acts as persistent storage of the current supply in our smart contract. But what about `balances`? We initialize this property with the `MapStorage` [static](https://www.typescriptlang.org/docs/handbook/classes.html#static-properties) `for` property, which makes it read as "`MapStorage` `for` `Address` to `Fixed<8>`". (Note: we're using generic types here, take a look at the TypeScript [documentation](https://www.typescriptlang.org/docs/handbook/generics.html) for more info.) `MapStorage` and its related classes `SetStorage` and `ArrayStorage` work identically to their `Map`, `Set` and `Array` counterparts, however they're optimized for persistent smart contract storage. In particular, the main difference is if we declared a `Map` property, the entire `Map` would be stored in one storage key of the smart contract, bounding the total possible size of the `Map`, whereas `MapStorage` stores each value in a separate key.

We're also introducing the `Address` [interface](https://www.typescriptlang.org/docs/handbook/interfaces.html) which is a special kind of `Buffer` that represents a NEO address. You'll see a few types like this in NEO•ONE smart contracts, they're declared in a way that makes them difficult to use incorrectly. As a concrete example, you can't pass an arbitrary `Buffer` where an `Address` is expected which helps eliminate bugs.

Finally, you may be wondering what the `Fixed<8>` type is. The `Fixed` [type](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-aliases) has no impact on how the smart contract executes, but it does change how the automatically generated NEO•ONE client APIs function. All numbers in a NEO smart contract must be integers (up to 256 bits, to be precise), so typically we use an integer multiplied by a power of 10 to represent decimals. In this case, `Fixed<8>` is telling the compiler that this number actually represents a fixed point number with 8 decimal places. We use this information to automatically convert the integer value to the corresponding decimal value in the `BigNumber`s that are used in the client APIs.

Since we made these properties `private`, we'll have to wait until the next section to test them.

### Constant Methods

Let's add two methods [decorated](https://www.typescriptlang.org/docs/handbook/decorators.html#decorators) with `@constant` in order to expose the two private properties we added last section:

```typescript
export class Token extends SmartContract {
  @constant
  public get totalSupply(): Fixed<8> {
    return this.mutableSupply;
  }

  @constant
  public balanceOf(address: Address): Fixed<8> {
    const balance = this.balances.get(address);

    return balance === undefined ? 0 : balance;
  }
}
```

We've added a [getter](https://www.typescriptlang.org/docs/handbook/classes.html#accessors) that's been [decorated](https://www.typescriptlang.org/docs/handbook/decorators.html#decorators) with `@constant`. This just tells the compiler that the method does not modify any storage properties, and thus can be invoked without submitting a transaction to the blockchain. Similarly, we've added a method for fetching the balance at a particular `Address`. Testing these methods works much the same as accessing properties:

```typescript
await withContracts(async ({ token, accountIDs }) => {
  const [totalSupply, balance] = await Promise.all([token.totalSupply(), token.balanceOf(accountIDs[0].address)]);
  expect(totalSupply.toNumber()).toEqual(0);
  expect(balance.toNumber()).toEqual(0);
});
```

Notice how the methods correspond 1:1 to what's been declared in the smart contract. We're also making use of one of the automatically generated `UserAccountID`s as the `balanceOf` `Address` argument. You can find the full list of automatically generated `UserAccountID`s in the [testing](/docs/testing) section of the docs.

### Constructors

Every NEO•ONE smart contract has an automatically generated method called `deploy` which is based on the `constructor` of your smart contract. It's created whether or not you have an explicit constructor and must be invoked when the contract is published to the blockchain to initialize it. Using the NEO•ONE client APIs, the `deploy` method is called automatically and atomically when the contract is published, so you never have to worry about it.

So far we've been using an implicit constructor by defining class properties with values. We can also declare a constructor to run arbitrary logic when the smart contract is deployed:

```typescript
export class Token extends SmartContract {
  public constructor(public readonly owner: Address = Deploy.senderAddress) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
  }
```

Here we've defined a constructor that takes one argument, an `Address` [parameter property](https://www.typescriptlang.org/docs/handbook/classes.html#parameter-properties) that will be the `owner` of the contract. The first thing you might notice is that we provide [default](https://www.typescriptlang.org/docs/handbook/functions.html#optional-and-default-parameters) values for every constructor argument. This is mandatory in NEO•ONE smart contracts because we use these default values when we automatically deploy your smart contract for automated and local manual testing. Since we also use a generated address to deploy the contract, referred to as the `masterAccountID` in tests and elsewhere, NEO•ONE provides a special value `Deploy.senderAddress` that sets the default value to whichever address deployed the contract.

`Address.isCaller` allows you to determine if the provided `Address` invoked this contract. In this example, we do a sanity check that the `owner` is the one who deployed the smart contract, which eliminates the possibility of accidentally setting the `owner` to an address that the publisher of the smart contract doesn't own.

Since the `withContracts` helper already automatically deploys our contract, we don't need to add anything more to the tests to verify the constructor works as expected.

### Methods

We can enable transferring tokens by adding a `transfer` method:

```typescript
export class Token extends SmartContract {
  public transfer(from: Address, to: Address, amount: Fixed<8>): boolean {
    // Sanity check that amount.
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    // Verify that the `from` `Address` has approved this call.
    if (!Address.isCaller(from)) {
      throw new Error('from Address did not approve the transfer');
    }

    // Sanity check that the `from` `Address` has enough balance
    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      throw new Error('From balance is insufficient');
    }

    // Update balances accordingly
    const toBalance = this.balanceOf(to);
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, toBalance + amount);

    return true;
  }
}
```

Unlike methods decorated with `@constant`, normal instance methods may modify contract properties. Otherwise, they work the same as `@constant` methods and may contain arbitrary TypeScript code. Take a look at the comments in the above example for a detailed look at what we're doing on each line (and why we're doing it).

For those of you that have experience with other NEO Smart Contract languages, you may notice that rather than returning `false` we always throw an `Error`. Not only is this more idiomatic TypeScript, but throwing an `Error` also has the side effect of reverting all storage changes. This ensures that when an assertion in an operation fails, there are no erroneous storage changes. Note that when your contract is called from another contract, we will always return `false` to that contract so that it has a chance to react to the failure. We do this because there is not (currently) a way for the calling contract to catch errors.

The main difference for the NEO•ONE client APIs is that non-constant methods require relaying a transaction to the blockchain. This makes sense because a non-constant method by definiton mutates storage, and we need to persist those changes to the blockchain. We'll have to wait until the next section to test our `transfer` method since we don't currently have a way of creating tokens.

### Assets

All tokens, including native assets NEO and GAS, operate like the one we've built so far which live entirely in custom smart contracts. As a result, they require special handling within smart contracts. Luckily, NEO•ONE smart contracts abstract most of this away and let you focus on the logic of your smart contract.

Let's add the `mintTokens` method to our `Token` smart contract to enable minting new tokens.

```typescript
export class Token extends SmartContract {
  @receive
  public mintTokens(): void {
    // Get the latest NEO transfers to this contract
    const transfers = Blockchain.currentNEOTransfers.filter(
      (transfer) => transfer.to !== undefined && transfer.to.equals(this.address),
    );
    if (transfers.length === 0) {
      throw new Error('Invalid mintTokens');
    }

    // Get the minter address from the current transaction sender
    const sender = Blockchain.currentTransaction.sender;

    // Sum up the amount of NEO sent to the contract from the sender.
    // Note that the minter will have to make these transfers before calling `mintTokens`
    let amount = 0;
    // tslint:disable-next-line: no-loop-statement
    for (const transfer of transfers) {
      if (transfer.from !== undefined && transfer.from.equals(sender)) {
        amount += transfer.amount * this.amounterPerNEO;
      }
    }

    this.issue(sender, amount);
  }

  private issue(address: Address, amount: Fixed<8>): void {
    // Update the balance
    this.balances.set(address, this.balanceOf(address) + amount);
    // Update the supply
    this.mutableSupply += amount;
  }
}
```

Notice that we access the current transaction using `Blockchain.currentTransaction`. The transaction itself has many useful properties, but for now we are only interested in the `notifications` property. The `notifications` defines the notifications produced by the transaction. Each notification will have a `scriptHash` property, an `eventName` property, and a `state` property. We can parse these properties to see what events were triggered by the transaction. In this case we want to see Transfer events that were produced by the NeoToken native contract, which will tell us how much was transfered, from what address, and to what address.

Now that we can mint tokens, let's see how we can test both `transfer` and `mintTokens`. Note that any NEO•ONE types necessary in your tests should be imported from `@neo-one/client`:

```typescript
import { Hash160 } from '@neo-one/client';
import BigNumber from 'bignumber.js';

...

await withContracts(async ({ token, accountIDs }) => {
  // We'll use this account for minting because it starts with 10 NEO in it
  const accountID = accountIDs[2];
  const amount = new BigNumber(10);

  // Mint the tokens and verify the transaction succeeds
  const mintTokensResult = await token.mintTokens({
    sendTo: [
      {
        amount,
        asset: Hash160.NEO,
      },
    ],
    from: accountID,
  });
  const mintTokensReceipt = await mintTokensResult.confirmed();
  if (mintTokensReceipt.result.state === 'FAULT') {
    throw new Error(mintTokensReceipt.result.message);
  }
  expect(mintTokensReceipt.result.value).toBeUndefined();

  // Check that balance and total supply were updated appropriately
  const [balance, totalSupply] = await Promise.all([token.balanceOf(accountID.address), token.totalSupply()]);
  expect(balance.toNumber()).toEqual(amount.toNumber());
  expect(totalSupply.toNumber()).toEqual(amount.toNumber());

  // Attempt a transfer
  const toAccountID = accountIDs[1];
  const transferAmount = new BigNumber(3);
  const transferReceipt = await token.transfer.confirmed(accountID.address, toAccountID.address, transferAmount, {
    from: accountID,
  });
  if (transferReceipt.result.state === 'FAULT') {
    throw new Error(transferReceipt.result.message);
  }
  expect(transferReceipt.result.value).toEqual(true);

  // Validate the balances are updated appropriately and the total supply has not changed.
  const [fromBalance, toBalance, afterTotalSupply] = await Promise.all([
    token.balanceOf(accountID.address),
    token.balanceOf(toAccountID.address),
    token.totalSupply(),
  ]);
  expect(fromBalance.toNumber()).toEqual(amount.minus(transferAmount).toNumber());
  expect(toBalance.toNumber()).toEqual(transferAmount.toNumber());
  expect(afterTotalSupply.toNumber()).toEqual(amount.toNumber());
});
```

Phew, quite a bit, but we're testing a lot of functionality here. Recall that we mentioned that normal instance methods (as well as native asset methods) require relaying a transaction on the network. Typically you'll want to wait for the transaction to be confirmed in order to update the UI as well as to respond to any errors during the process. The generated NEO•ONE client APIs enable this through a two step process.

First, invoke the smart contract method which will return a `Promise<TransactionResult>`. The `TransactionResult` object contains two properties, `transaction` which is the full transaction object that was relayed to the network, and `confirmed` which is a function we can call to wait for the transaction to be confirmed.

Second, call `confirmed` which returns a `Promise<InvokeReceipt>`. This `InvokeReceipt` contains many useful properties, like the `event`s that were emitted during execution as well as the final `result` of the smart contract invocation. To learn more, take a look at the detailed [documentation](/docs/smart-contract-apis#methods) on invoking smart contract methods.

Putting it all together, we see both forms of invoking smart contract methods in the above snippet. When we mint tokens, we use the 2-step form, and when we transfer we use the 1-step or shortcut form.

### Wrapping Up

At this point we have a fully functioning, although simplistic, token contract. Head to the next section to learn about integrating a dapp with the NEO•ONE client and smart contract APIs. Once you have it integrated, try it out with the React boilerplate that was generated with create-react-app!

---

## DApps

This section will take a look at how we can integrate the token smart contract into a dapp.

### Client and Smart Contract APIs

Integrating NEO•ONE with your dapp is similar to testing your smart contracts - we simply use the generated helper methods:

```typescript
import { createClient, createTokenSmartContract } from './neo-one';

const client = createClient();
const token = createTokenSmartContract(client);
```

Now we can use both the base blockchain APIs offered by the `Client` class and the generated smart contract APIs that correspond to the `Token` contract. The `token` value here is identical to the one we've been using in testing, meaning all the skills you've learned in testing smart contracts translate directly to using them in your dapp.

::: warning

Note

As you prepare your dapp for production, you'll likely want to configure additional `UserAccountProvider`s in the `Client`. Learn more about `UserAccount`s and `UserAccountProvider`s in the [User Accounts](/docs/user-accounts) advanced guide.

:::

### React

If you're using React to power your dapp, the NEO•ONE toolchain offers two components that aid in integration: `ContractsProvider` and `WithContracts`. Check out the [React](/docs/react) advanced guide for more details.

### Angular

If you're using Angular to power your dapp, the NEO•ONE toolchain offers an Angular Service to aid in integration: `ContractsService`. Check out the [Angular](/docs/angular) advanced guide for more details.

### Vue

If you're using Angular to power your dapp, the NEO•ONE toolchain offers a tool to aid in integration: `contractsService`. Check out the [Vue](/docs/vue) advanced guide for more details.

### Developer Tools

Regardless of the front-end framework you're using, the NEO•ONE Developer Tools contain all of the functionality necessary to control your private network and are simple to integrate:

```typescript
import { createClient, createDeveloperClients } from './neo-one';
import { DeveloperTools } from '@neo-one/client';

const client = createClient();
const developerClients = createDeveloperClients();
DeveloperTools.enable({ client, developerClients });
```

Read more in the [Developer Tools](/docs/dapps#Developer-Tools) section of the main guide.
