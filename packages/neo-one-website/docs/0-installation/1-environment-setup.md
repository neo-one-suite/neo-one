---
slug: environment-setup
title: Environment Setup
---
# Environment Setup

NEO•ONE was designed to get your dapp up and running quickly.

This page describes how to setup NEO•ONE using `yarn` or `npm`.

## Requirements

- [Node](https://nodejs.org) >= 8.9.0 (We recommend the latest version)
  - Linux and Mac: We recommend using [Node Version Manager](https://github.com/creationix/nvm).
  - Windows: We recommend using [Chocolatey](https://chocolatey.org/).

## Installation

NEO•ONE is organized into multiple individual packages. Use as much or as little as you like. Each package may be installed using either [yarn](https://yarnpkg.com/) (`yarn add <package name>`) or [npm](https://www.npmjs.com/) `npm install <package name>`.

For interacting with smart contracts, you should install

 - `@neo-one/client` - Main entrypoint to the most common NEO•ONE client APIs.

For local network and smart contract management, you should install

 - `@neo-one/cli` - Provides the `neo-one` cli command which manages common tasks like building and deploying smart contracts and spinning up local networks.

In addition to the above, if you're developing TypeScript smart contracts using NEO•ONE, you should install

 - `@neo-one/smart-contract` - TypeScript definitions for available smart contract APIs.
 - `@neo-one/smart-contract-test` - TypeScript smart contract testing utilitiees.
 - `@neo-one/smart-contract-typescript-plugin` - TypeScript language server plugin for inline compiler diagnostics in your favorite IDE.

### Editor Setup

In order to have inline compiler diagnostics from your IDE, you'll need to configure the IDE to use your local TypeScript installation as well as configure the `@neo-one/smart-contract-typescript-plugin`. These instructions are for [VSCode](https://code.visualstudio.com/), but they should be similar for any editor that supports TypeScript Intellisense.

  1. Ensure `@neo-one/cli` and `@neo-one/smart-contract-typescript-plugin` are installed.
  2. Run `yarn neo-one init`. This will create a `tsconfig.json` file in the configured smart contract directory (by default, `./one/contracts`).
  3. Click the TypeScript version number in the lower right hand side of your editor and choose "Use Workspace Version"

That's it! Enjoy inline smart contract compiler diagnostics.
