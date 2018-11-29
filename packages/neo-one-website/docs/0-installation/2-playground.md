---
slug: playground
title: Playground
---
The NEO•ONE Playground showcases what's possible with NEO•ONE.

This guide will walk you through getting started with the [NEO•ONE Playground](https://github.com/neo-one-suite/neo-one-playground).

---

[[toc]]

---

## Requirements

  - [Node](https://nodejs.org) >= 8.9.0 (We recommend the latest version)
  - a package manager: [yarn](https://yarnpkg.com/)   **OR**   npm (distributed with Node)

---

## Installation

```bash
git clone https://github.com/neo-one-suite/neo-one-playground.git
cd neo-one-playground
# npm install
yarn install
```

---

## Compile

```bash
# npm run neo-one build
yarn neo-one build
```

This will start up a local network, compile the smart contracts located in the `one/contracts` directory and publish them to your local network. Add `--watch` to listen for changes to the smart contracts and trigger automatic recompilation and deployment.

---

## Start the Playground

```bash
# npm run start
yarn start
```

This will open a browser window with the playground. Modify the files in the `src` directory to get a feel for using the NEO•ONE client APIs.

---

## Run the tests

```bash
# npm test
yarn test
```

Smart contract tests in the playground are written in Jest and are located in the `one/tests` directory. Play around with them to see how easy it is to test smart contracts!
