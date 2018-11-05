---
slug: configuration
title: Configuration
---
# Configuration

NEO•ONE requires no configuration to get started, but you can customize certain aspects of the toolchain.

NEO•ONE uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) to load configuration with the name `one`. This means that you can configure the toolchain using

  - "one" as a property in `package.json`
  - an "rc file" named "one" with extensions `.json`, `.yaml`, `.yml` or `.js`.

## Options

Options use dot syntax to indicate an object property. For example, `paths.contracts` means the `contracts` property of the object at the `paths` property of the root configuration object.

## Reference

[[toc-reference]]

#### `paths.contracts` [string]

Default: `one/contracts`

This options tells NEO•ONE where your smart contracts are located.

#### `paths.generated` [string]

Default: `one/generated`

NEO•ONE uses this directory for all generated files that should be checked in with the project. The files generated here will typically also be used in your smart contract tests and in your dapp.

#### `codegen.javascript` [boolean]

Default: `false`

By default, NEO•ONE generates TypeScript source files in the `paths.generated` directory. Set this option to `true` to instead generate pure `JavaScript` sources.
