---
slug: playground
title: Playground
---
# Playground

The NEO•ONE Playground showcases what's possible with NEO•ONE.

This guide will walk you through getting started with the [NEO•ONE Playground](https://github.com/neo-one-suite/neo-one-playground).

## Requirements

  - [Node](https://nodejs.org) >= 8.9.0 (We recommend the latest version)
  - [yarn](https://yarnpkg.com/)

## Installation

```bash
git clone https://github.com/neo-one-suite/neo-one-playground.git
yarn install
```

## Compile

```bash
yarn neo-one build
```

This will start up a local network, compile the smart contracts located in the `/one/contracts` directory and publish them to your local network. Add `--watch` command to listen for changes to the smart contracts and trigger automatic recompilation and deployment.

## Start the Playground

```bash
yarn start
```

This will open a browser window with the playground. Feel free to modify the files in the `src` directory to get a feel for using the NEO•ONE client APIs.

## Run the tests

```bash
yarn test
```

Smart contract tests in the playground are written in Jest and are located in the `/one/tests` directory. Play around with them to see how easy it is to test smart contracts!
