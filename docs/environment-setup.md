---
id: environment-setup
title: Environment Setup
---
This section will guide you through setting up your environment.

## Requirements

- [Node](https://nodejs.org) >= 8.9.0
  - Linux and Mac: We recommend using [Node Version Manager](https://github.com/creationix/nvm).
  - Windows: We recommend using [Chocolatey](https://chocolatey.org/).
- [yarn](https://yarnpkg.com/docs/install)

## Fork

Follow the instructions at [GitHub Standard Fork & Pull Request Workflow](https://gist.github.com/Chaser324/ce0505fbed06b947d962) to fork the [NEO•ONE repo](https://github.com/neo-one-suite/neo-one).

## Build

Once you have the requirements installed, run the following:
1. `yarn install`
2. `yarn build`

While developing, you can use `yarn watch` to continuously rebuild.

## Test And Run

At this point you should have a locally built version of NEO•ONE. What you do next depends on what you are working on:

- Run tests with `yarn test` or `yarn test-coverage`
- Run [@neo-one/cli](codebase-overview.md#cli) with `node ./packages/neo-one-cli/dist/bin/neo-one`. Note that you should not use `yarn run neo-one` or otherwise run `neo-one` with a Node subprocess, see [#4](https://github.com/neo-one-suite/neo-one/issues/4).


It's typically easiest to manually test other components via [@neo-one/cli](codebase-overview.md#cli). For example, manually testing changes to the NEO node can be done by launching a network via the cli.
