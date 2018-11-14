---
slug: environment-setup
title: Environment Setup
---
NEO•ONE was designed to get your dapp up and running quickly.

This page describes how to setup NEO•ONE using `yarn` or `npm`.

---

[[toc]]

---

## Requirements

- [Node](https://nodejs.org) >= 8.9.0 (We recommend the latest version)
  - Linux and Mac: We recommend using [Node Version Manager](https://github.com/creationix/nvm).
  - Windows: We recommend using [Chocolatey](https://chocolatey.org/).

---

## Installation

**If you're just getting started**, try out one of the following toolchains for setting up your project:

  - [Create React App](https://github.com/facebook/create-react-app) - Generates a [React](https://reactjs.org/) starter app.
  - [Angular CLI](https://cli.angular.io/) - Generates an [Angular](https://angular.io/) starter app.
  - [Vue CLI](https://cli.vuejs.org/) - Generate a [Vue](https://vuejs.org/) starter app.

**Once you have a project setup**, the next step is to add NEO•ONE to it. NEO•ONE is organized into multiple individual packages. Use as much or as little as you like. Each package may be installed using either [yarn](https://yarnpkg.com/) (`yarn add <package name>`) or [npm](https://www.npmjs.com/) (`npm install <package name>`). Each package has the form `@neo-one/<name>`, for example, `@neo-one/client`.

Not sure which packages to use from NEO•ONE? Go ahead and install everything mentioned on this page, and then follow the [main guide](/docs/hello-world) or the [tutorial](/tutorial). By the end of it you'll know which features of NEO•ONE you're using and which packages to keep. Install everything with yarn by running:

```bash
yarn add @neo-one/client @neo-one/cli @neo-one/smart-contract @neo-one/smart-contract-test @neo-one/smart-contract-typescript-plugin
```

Install everything with npm by running:

```bash
npm install @neo-one/client @neo-one/cli @neo-one/smart-contract @neo-one/smart-contract-test @neo-one/smart-contract-typescript-plugin
```

Know what you want to use from NEO•ONE? Read on to see which packages to install for specific functionality.

For interacting with smart contracts, you should install

 - `@neo-one/client` - Main entrypoint to the most common NEO•ONE client APIs.

For local network and smart contract management, you should install

 - `@neo-one/cli` - Provides the `neo-one` cli command which manages common tasks like building and deploying smart contracts and spinning up local networks.

In addition to the above, if you're developing TypeScript smart contracts using NEO•ONE, you should install

 - `@neo-one/smart-contract` - TypeScript smart contract standard library.
 - `@neo-one/smart-contract-test` - TypeScript smart contract testing utilitiees.
 - `@neo-one/smart-contract-typescript-plugin` - TypeScript language server plugin for inline compiler diagnostics in your favorite IDE.

### Editor Setup

Configure your IDE to use your local TypeScript installation and the `@neo-one/smart-contract-typescript-plugin` in order to take advantage of inline compiler diagnostics. These instructions are for [VSCode](https://code.visualstudio.com/), but they should be similar for any editor that supports TypeScript IntelliSense.

  1. Ensure `@neo-one/cli` and `@neo-one/smart-contract-typescript-plugin` are installed.
  2. Run `yarn neo-one init`. This will create a `tsconfig.json` file in the configured smart contract directory (by default, `one/contracts`).
  3. Open a TypeScript file, then click the TypeScript version number in the lower right hand side of your editor and choose "Use Workspace Version"

That's it! Enjoy inline smart contract compiler diagnostics.
