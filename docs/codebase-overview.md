---
id: codebase-overview
title: Codebase Overview
---
NEO•ONE is organized as a [monorepo](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9) using [lerna](https://github.com/lerna/lerna) and [yarn](https://yarnpkg.com/en/) workspaces. This section will give you an overview of the NEO•ONE codebase organization, its packages and conventions, and the implementation.

## Top-Level Folders

After cloning the NEO•ONE repository, you will see a few top-level folders in it:

- [.github](https://github.com/neo-one-suite/neo-one/tree/master/.github) contains markdown documents consumed by GitHub like issue templates.
- [decls](https://github.com/neo-one-suite/neo-one/tree/master/decls) contains [Flow] type declarations for external packages. Note that we prefer to fork [flow-typed](https://github.com/flowtype/flow-typed) definitions directly into this folder in case we need to make changes.
- [docs](https://github.com/neo-one-suite/neo-one/tree/master/docs) contains all of the Markdown documentation that appears on this site.
- [packages](https://github.com/neo-one-suite/neo-one/tree/master/decls) contains metadata (such as `package.json`) and the source code (`src` subdirectory) for all packages in the NEO•ONE repository. **If your change is related to the code, the src subdirectory of each package is where you’ll spend most of your time.**
- [scripts](https://github.com/neo-one-suite/neo-one/tree/master/scripts) contains scripts and other supporting files for building and testing.
- [website](https://github.com/neo-one-suite/neo-one/tree/master/website) contains the code necessary for this site.

## Tests

Tests for each package follow this structure:

- Tests are located under `./packages/<package>/src/__tests__`
- Common test data is located under `./packages/<package>/src/__data__`
- Mocks are located under `./packages/<package>/src/__mocks__`

## Packages

At a high level, NEO•ONE provides a few main components, but the functionality for each may be spread across many packages. Packages typically should be focused on doing one thing and one thing well. What follows is a breakdown of each of the main components by package

### Core

The [@neo-one/client-core](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-client-core) package contains the base NEO blockchain types and interfaces shared between the Node and Client packages.

### Node

NEO•ONE implements a full node for the NEO blockchain across the following packages:

- [@neo-one/node-blockchain](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-blockchain) makes use of a Storage and VM implementation to implement the core logic for persisting a block.
- [@neo-one/node-data-backup](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-data-backup) contains logic for backing up and restoring a data path via different providers, e.g. MegaNZ and Google Cloud. This is used for backing up and restoring leveldb, though it's not limited to just leveldb Storage implementations.
- [@neo-one/node](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node) combines most of the other packages listed here to implement a NEO full node.
- [@neo-one/node-levelup](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-blockchain) implements the Storage interface using a levelup compatible db.
- [@neo-one/node-neo-settings](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-neo-settings) is a very simple package that just functions to create the standard MainNet and TestNet settings for use with `neo-one-node-blockchain`.
- [@neo-one/node-network](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-network) implements the low-level Network protocol for joining a mesh network.
- [@neo-one/node-protocol](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-protocol) implements the high-level Node protocol for passing messages on the mesh Network. It also contains the Consensus logic.
- [@neo-one/node-core](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-core) is similar to `neo-one-client-core` and contains the NEO blockchain types and interfaces shared between Node packages. In particular, it contains common abstractions like the Storage and VM interfaces used between packages.
-  [@neo-one/node-offline](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-offline) is a simple package that implements bootstrapping a new Blockchain using a serialized Block file, typically called chain.acc. Mostly useful when we need to change the underlying Storage interfaces in a backwards incompatible way and need to generate a new backup, otherwise just restoring from `neo-one-node-data-backup` is preferrable.
- [@neo-one/node-rpc](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-rpc) contains the RPC server implementation
- [@neo-one/node-vm](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-node-vm) contains the NEO VM implementation

### Client

The [@neo-one/client](https://github.com/neo-one-suite/neo-one/tree/master/packages/neo-one-client) contains a higher level API for pulling data from and interacting with the blockchain through the RPC interface.

### Server

### CLI

## Code Conventions

- 2 spaces for indentation (no tabs).
- 80 character line length strongly preferred.
- Prefer `'` over `"`.
- ES6 syntax
- Use [Flow] types.
- Use semicolons;
- Trailing commas,
- Avd abbr wrds.

[Flow]: https://flow.org/
