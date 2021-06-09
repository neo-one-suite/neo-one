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
- [RushJS](https://rushjs.io/)
- [C# .NET](https://docs.microsoft.com/en-us/dotnet/) version 3.1.401

---

## Build

Once you have cloned the [NEO•ONE repository](https://github.com/neo-one-suite/neo-one) (or preferably your own fork of the repository) you can run the following to build the node entry point

```bash
cd neo-one
rush install
rush build -t @neo-one/node-bin
cd  ./packages/neo-one-node-bin/bin
```

`rush build -t @neo-one/node-bin` will build a bin for the node as well as the `@neo-one` packages that it depends on. For this tutorial we will `cd` into the entry point's build directory to save time. Running the new node then is as simple as

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

You can also add a `.neo-onerc` configuration file anywhere in the app directory (recommended at the root of the repo directory) to apply your configuration by default. See [rc](https://github.com/dominictarr/rc#rc) for more informatio on how NEO•ONE will find and apply the node configuration with an `rc` file.

## Troubleshooting

You may or may not run into environment problems when trying to run the node. The NEO•ONE node now uses the C# NeoVM instead of our own implementation of the NeoVM in TypeScript, which means that NEO•ONE controls C# code through some complicated mechanisms. If you run into problems with running the node then try these steps:

- Add these environment variables to your shell environment:
  - `EDGE_USE_CORECLR=1`
  - `EDGE_APP_ROOT=<path/to/your/project>/node_modules/@neo-one/node-vm/lib/Debug/netcoreapp3.0`
- Install `pkgconfig` on macOS with Homebrew: `brew install pkgconfig`
  - Then add this environment variable: `PKG_CONFIG_PATH=/Library/Frameworks/Mono.framework/Versions/Current/lib/pkgconfig`
  - You then need to re-install your node modules by deleting the `node_modules` folder and then running `npm install` again
- If problems persist then please reach out to us on [Discord](https://discord.gg/S86PqDE)
