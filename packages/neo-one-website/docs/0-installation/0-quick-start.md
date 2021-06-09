---
slug: quick-start
title: Quick Start
---

::: warning

Important

This page is intended to guide you through a quick setup to develop, test, and deploy your smart contract. We assume you have a general knowledge of blockchain, smart contract development, and TypeScript.

:::

::: warning

Tip

- If you want to learn the concepts from the ground up and learn by doing, check out our [Tutorial](/tutorial) and reference the concepts listed in [Docs](/docs/hello-world) when something is not clear.

- If you want to learn with a real-world example, check out our [Course](/course) which you can follow and see how things are tested. Also keep the [Docs](/docs/hello-world) page handy for reference.

:::

**NEO•ONE** makes coding, testing and deploying Neo dapps easy, fast, efficient and enjoyable.

---

[[toc]]

---

## Installations

1. Install [NodeJS](https://nodejs.org) >= 10.16.0 (We recommend using v10.16.0)

   - Linux and Mac: [Node Version Manager](https://github.com/creationix/nvm). (`recommended`)
   - Windows: We recommend using [Chocolatey](https://chocolatey.org/). (`recommended`)

2. Install [C# .NET](https://docs.microsoft.com/en-us/dotnet/) version 3.1.401
3. Add a `global.json` file to the root of your project repo with this JSON:

```json
{
  "sdk": {
    "version": "3.1.401"
  }
}
```

This tells your local C# .NET runtime to use version 3.1.401 in this repo, even if you have newer versions installed on your machine.

4. Follow the [installation instructions for Create React App](https://reactjs.org/docs/create-a-new-react-app.html#create-react-app) to make a new project.

   - Be sure to invoke Create React App with the `--template typescript` in order to enable TypeScript support: `npx create-react-app token --template typescript`

5. Install NEO•ONE using either [yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

```bash
yarn add @neo-one/cli@prerelease @neo-one/client@prerelease @neo-one/smart-contract@prerelease @neo-one/smart-contract-test@prerelease @neo-one/smart-contract-lib@prerelease @neo-one/smart-contract-typescript-plugin@prerelease
```

```bash
npm install @neo-one/cli@prerelease @neo-one/client@prerelease @neo-one/smart-contract@prerelease @neo-one/smart-contract-test@prerelease @neo-one/smart-contract-lib@prerelease @neo-one/smart-contract-typescript-plugin@prerelease
```

6. Run `yarn neo-one init` or `npx neo-one init`

The command above generates a sample `HelloWorld.ts` smart contract, a sample test for the contract `HelloWorld.test.ts`, a config file `.neo-one.config.ts`, and a `neo-one` folder with important modules.

---

## Troubleshooting

You may or may not run into environment problems when using the CLI, trying to test your smart contract, or other NEO•ONE functions that use the NEO•ONE node. The NEO•ONE node now uses the C# NeoVM instead of our own implementation of the NeoVM in TypeScript, which means that NEO•ONE controls C# code through some complicated mechanisms. If you run into problems with running a node (such as when running `neo-one init` or `neo-one build`) then try these steps:

- Add these environment variables to your shell environment:
  - `EDGE_USE_CORECLR=1`
  - `EDGE_APP_ROOT=<path/to/your/project>/node_modules/@neo-one/node-vm/lib/Debug/netcoreapp3.0`
- Install `pkgconfig` on macOS with Homebrew: `brew install pkgconfig`
  - Then add this environment variable: `PKG_CONFIG_PATH=/Library/Frameworks/Mono.framework/Versions/Current/lib/pkgconfig`
  - You then need to re-install your node modules by deleting the `node_modules` folder and then running `npm install` again
- Try running the NEO•ONE CLI command using `sudo`, such as: `sudo npx neo-one init`
- If problems persist then please reach out to us on [Discord](https://discord.gg/S86PqDE)

To see a demonstration of environment setup go to our YouTube channel for helpful videos: https://www.youtube.com/channel/UCya5J1Tt2h-kX-I3a7LOvtw

---

## A Contract in NEO•ONE

Every NEO•ONE smart contract starts with a TypeScript source file that exports a single [class](https://www.typescriptlang.org/docs/handbook/classes.html) extending `SmartContract`.

```typescript
import { SmartContract } from '@neo-one/smart-contract';

// Token is the contract name
export class Token extends SmartContract {
  public readonly mutableSupply: Fixed<8> = 0;

  @constant
  public get totalSupply(): Fixed<8> {
    return this.mutable;
  }
}
```

::: warning

Note

- Types for smart contract development can be imported from `@neo-one/smart-contract`

- Types for testing can be imported from `@neo-one/client`

:::

---

## A Test in NEO•ONE

Run the tests using `yarn test` OR `npm test`. It's a convention to put smart contract tests under `src/__tests__/`, e.g. `src/__tests__/Token.test.ts`.

```typescript
/**
 * @jest-environment node
 */
import { withContracts } from '../neo-one/test';

describe('Token', () => {
  test('exists', async () => {
    // "token" is the contract name
    await withContracts(async ({ token }) => {
      expect(token).toBeDefined();
    });
  });
});
```

::: warning

Note

`withContracts()` is a generated helper that will expose all your contracts, their methods and properties along with other useful options. See [Testing](docs/testing) for more details.

:::

---

## Quick Commands

### Build

```bash
yarn neo-one build
```

Run `yarn neo-one build` when you are done making changes to the contract(s). It not only builds the necessary code for the contract(s) but also updates the generated types and helpers. Specifically the command will:

1. Start up a local private Neo network (if one has not already been started).
2. Setup wallets for testing with various amounts of NEO and GAS.
3. Compile the project's smart contract(s).
4. Deploy the smart contracts to the private Neo network.
5. Generate code for use in your decentralized app.

### Test

Run your tests with:

```bash
yarn test
```

or

```bash
npm test
```

::: warning

Note

For more command line help and options, check out the [CLI](/docs/cli) page.

:::

---

## Client Integration

Integrating the NEO•ONE client APIs in a vanilla JavaScript or TypeScript application is very simple - assuming we have a contract called `Token` and we’re in the `src/index.ts` file using the default NEO•ONE toolchain paths:

```typescript
import { createClient, createTokenSmartContract } from './neo-one';

const client = createClient();
const token = createTokenSmartContract(client);
// "Token" is the name of this example smart contract
// for example:
// if your contract name is Test
// then the function will become createTestSmartContract()
```

Check out our [Client APIs](/docs/client-apis) page for more details.

---

## Deploy

### Checklist before deploying to TestNet:

1. Get a Neo wallet
2. Get TestNet GAS in your wallet
3. Create a migration file

You first need a wallet, the wallet's private key and sufficient GAS to deploy.

### Wallet set-up:

1. Go to `https://neotracker.io/`
2. Go to `“Wallet”` tab.
3. Click on `“New Wallet”`.
4. Enter a password (make sure you save this password), which is used to unlock the wallet later.
5. Click on `"Download Encrypted Key"` (this will generate a `.txt` file that can be used to unlock your wallet via `“Keystore File”` option).
6. Save the private key somewhere secure.
7. Click `Continue` to view your wallet.
8. (Optional) Generate a PDF of your wallet by clicking on `“Print paper wallet”`
9. (Optional) Scroll down to `“Details”` when viewing your wallet to access the options of the previous steps (such as to view your private key or download a keystore file).

### Migration File:

Create a `migration.ts` (`migration.js` if using JS) at the path specified in your NEO•ONE configuration file.

::: warning

Tip

Visual Studio Code might display single child folders in "compact form" and prevent you from creating a new file under `neo-one` folder. Disable "compact folder" in "settings" if needed.

:::

Example:

```typescript
import { MigrationContracts } from '../src/neo-one';

export default ({ token, ico, escrow }: MigrationContracts, _network: string) => {
  token.deploy();
};
```

::: warning

Note

Deployment has not been thoroughly tested yet for N3. It _should_ work, but there may be bugs, so be aware and feel free to bring up issues and ask questions in our [Discord](https://discord.gg/S86PqDE) server. For more details on deployment specifics and migration files, check out the [Deployment](/docs/deployment) page.

:::

### Get Test coins

You can get test coins automatically from https://neowish.ngd.network/neo3/#/

If you need more than that. You must apply through Neo website. Please follow the instructions here: https://docs.neo.org/docs/en-us/network/testnet.html#applying-for-test-coin-from-neo-website

::: warning

Note

- It costs about 500 GAS to deploy a simple contract. Checkout [System Fees](https://docs.neo.org/docs/en-us/sc/fees.html) for more details.
- You should then be able to see the assets in your wallet at https://testnet.neotracker.io

:::

### Deploy to TestNet:

```bash
yarn neo-one deploy
```

### Deploy to MainNet (or others):

```bash
yarn neo-one deploy --network <network>
```

Where `network` is one of the keys provided by your configuration (`.neo-one.config.ts`) under the `networks` property. By default `neo-one deploy` will use the `test` key.

::: warning

Note

We **HIGHLY** recommend deploying to both a local private network and the Neo TestNet before attempting to deploy to the MainNet.

:::

## Explore with NEO Tracker

NEO Tracker doesn't currently support N3, so you will have to use another explorer to see your deployed contracts.
