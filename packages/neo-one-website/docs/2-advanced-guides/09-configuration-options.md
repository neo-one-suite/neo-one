---
slug: config-options
title: Configuration Options
---

NEO•ONE compiler configuration options

Configure NEO•ONE for your project.

## Config File

An [initialized environment](https://neo-one.io/tutorial#Setup-for-the-Tutorial) will have a `.neo-one.config.ts` file within the project root.

### Example NEO•ONE configuration file

The `.neo-one.config.ts` configuration file may look something like this:

```typescript
import { defaultNetworks } from '@neo-one/cli';

export default {
  contracts: {
    // NEO•ONE will look for smart contracts in this directory.
    path: 'neo-one/contracts',
  },
  artifacts: {
    // NEO•ONE will store build and deployment artifacts that should be checked in to vcs in this directory.
    path: 'neo-one/artifacts',
  },
  migration: {
    // NEO•ONE will load the deployment migration from this path.
    path: 'neo-one/migration.js',
  },
  codegen: {
    // NEO•ONE will write source artifacts to this directory. This directory should be committed.
    path: 'src/neo-one',
    // NEO•ONE will generate code in the language specified here. Can be one of 'javascript' or 'typescript'.
    language: 'typescript',
    // NEO•ONE will generate client helpers for the framework specified here. Can be one of 'react', 'angular', 'vue' or 'none'.
    framework: 'react',
    // Set this to true if you're using an environment like Expo that doesn't handle browserifying dependencies automatically.
    browserify: false,
    // Set this to true if you're running in codesandbox to workaround certain limitations of codesandbox.
    codesandbox: false,
  },
  network: {
    // NEO•ONE will store network data here. This path should be ignored by your vcs, e.g. by specifiying it in a .gitignore file.
    path: '.neo-one/network',
    // NEO•ONE will start the network on this port.
    port: 9040,
  },
  // NEO•ONE will configure various parts of the CLI that require network accounts using the value provided here, for example, when deploying contracts.
  // Refer to the documentation at https://neo-one.io/docs/configuration for more information.
  networks: defaultNetworks,
  neotracker: {
    // NEO•ONE will start an instance of NEO Tracker using this path for local data. This directory should not be committed.
    path: '.neo-one/neotracker',
    // NEO•ONE will start an instance of NEO Tracker using this port.
    port: 9041,
    // Set to true if you'd like NEO•ONE to skip starting a NEO Tracker instance when running 'neo-one build'.
    skip: false,
  },
};
```

## Networks

While we provide defaults for deployment networks it is also possible to use your own! You can provide a `name` and `rpcURL` to our [helper](https://github.com/neo-one-suite/neo-one/blob/ea855d82640550cb00830ea8a4596c8b01108cf7/packages/neo-one-cli-common-node/src/networks.ts#L5) which will prompt you to provide a list of `privateKeys` for use on the network when deploying _or_ you can provide your own UserAccountProvider, such as:

```typescript
const keystore = new LocalKeyStore(new LocalMemoryStore());
keystore.addUserAccount('exampleNetwork', 'PRIVATE_KEY');
export default {
//...
  networks: {
    exampleNetwork: new LocalUserAccountProvider({
      keystore,
      provider: new NEOONEProvider([{ 'exampleNetwork', 'exampleRpcURL.io/rpc'}])
    })
  }
}
```

::: warning

Note

While hard coding the `LocalUserAccountProvider` is a viable option in testing this also requires storing a `privateKey` as plain text in a file that would traditionally be checked into version control, i.e github. For this reason we recommend only using a hard coded value for local on-the-fly testing / debugging.

:::
