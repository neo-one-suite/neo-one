---
slug: node-source
title: Building From Source
---

In this brief walk-through we will show you how to build the NEO•ONE Node from source code.

This can be useful for local debugging and if you would like to make your own contribution to the node repository.

---

[[toc]]

---

## Requirements

- [Node](https://nodejs.org) >= 10.16.0 (We recommend the latest version)
  - Linux and Mac: We recommend using [Node Version Manager](https://github.com/creationix/nvm).
  - Windows: We recommend using [Chocolatey](https://chocolatey.org/).
- [Yarn](https://yarnpkg.com/) (recommended)

---

## Build

Once you have cloned the [NEO•ONE repository](https://github.com/neo-one-suite/neo-one) (or preferably your own fork of the repository) you can run the following to build the node entry point

```bash
cd neo-one
yarn install
yarn build:node
cd  ./dist/neo-one/packages/neo-one-node-bin/bin/
```

`yarn build:node` will build a bin for the node as well as the `@neo-one` packages that it depends on. For this tutorial we will `cd` into the entry point's build directory to save time. Running the new node then is as simple as

```bash
node neo-one-node
```

## Configure

[Configuration Reference](/docs/node-configuration)

When running the node locally it is quite easy to apply a configuration file compared to docker since we don't have to mount it to a container. An example configuration for syncing the node

```bash
## path/to/config.json
{
  "node": {
    "rpcURLs": {
      "http://seed6.ngd.network:10332",
      "http://seed10.ngd.network:10332"
    }
  }
}
```

Can be run using:

```bash
node neo-one-node --config /path/to/config.json
```

Individual options can also be layered on top of our configuration:

```bash
node neo-one-node --config /path/to/config.json --environment.logger.level=trace
```

Finally you have the option of adding a `.neo-onerc` app configuration file anywhere in the app directory (recommended at `/neo-one/`) to apply your configuration by default. See [rc](https://github.com/dominictarr/rc#rc) for more info on `rc` files.
