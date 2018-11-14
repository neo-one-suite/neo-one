---
id: getting-started
title: Getting Started
---

NEO•ONE was designed from the ground up to be easily installed and used to get your
dapp up and running quickly.

## Requirements

- [Node](https://nodejs.org) >= 8.9.0 (We recommend the latest version)
  - Linux and Mac: We recommend using [Node Version Manager](https://github.com/creationix/nvm).
  - Windows: We recommend using [Chocolatey](https://chocolatey.org/).
- [yarn](https://yarnpkg.com/docs/install)
- For the best experience, we recommend using [VSCode](https://code.visualstudio.com/).

## Installation

Install NEO•ONE using [npm](https://www.npmjs.com/):

```ts
npm install -g @neo-one/cli
```

Or via [yarn](https://yarnpkg.com/):

```ts
yarn global add @neo-one/cli
```

## Check out some dapps!

To get a feel for what you can do with NEO•ONE, we suggest you start by looking through the [NEO•ONE Playground](https://github.com/neo-one-suite/neo-one-playground).
Here you will see how NEO•ONE can take you through the full journey of dapp development.
* Writing and compiling smart contracts with the NEO•ONE typescript compiler.
* Building and deploying your smart contracts to a local private network using a single command.
* Testing your deployed smart contrtacts with the [jest](https://jestjs.io/) testing framework.
* Turning those smart contracts into dapps by connecting them to a front-end with help of the NEO•ONE client api.

Once your have installed the above requirements, simply clone the [NEO•ONE Playground](https://github.com/neo-one-suite/neo-one-playground) and run the following command
from the playground's root directory:

```ts
yarn neo-one build
```
That single command does all the following:
* Starts a local private network
* Adds a handful of wallets to that private network with NEO and GAS preloaded into them
* Compiles and deploys the playground smart contracts to the private network

To interact with these dapps in your browser, run:
```ts
yarn start
```
That's it!  Start playing with some dapps running on a local private network, right in your browser!  If you want to learn more, check out our tutorials and documentation (in progress...).
