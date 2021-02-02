---
slug: codebase-overview
title: Codebase Overview
---

NEO•ONE is a very large project, which is organized into 50+ interdependent packages. Below is a breakdown
of what each package is used for, grouped by functionality.

---

[[toc]]

---

## Client

### neo-one-client

Exports nearly everything from `neo-one-client-common` and `neo-one-client-core`, plus `DeveloperTools` from `neo-one-developer-tools`.

### neo-one-client-common

One of the core client packages, which provides APIs for cryptography, commonly used client functions, reading binary input, building scripts, and more.

### neo-one-client-core

The core client package, which exports the NEO•ONE Client, which is used to construct and send transactions, read accounts, hold keys, read the blockchain, and much more.

### neo-one-client-full

Exports nearly everything from `neo-one-client` and `neo-one-client-full-core`.

### neo-one-client-full-common

Exports common models.

### neo-one-client-full-core

Contains an extension of the Client in `neo-one-client-core` which provides extra APIs and functionality, plus the ReadClient, and more.

### neo-one-client-switch

Provides NEO•ONE Client functionality that switches between NodeJS and browser environments.

## Node

### neo-one-node

Contains the `FullNode` class which is used by the NEO•ONE CLI, `neo-one-node-bin`, and for testing purposes.

### neo-one-node-bin

Contains the `bin` for staring the NEO•ONE node.

### neo-one-node-blockchain

Primarily contains the `Blockchain` class which handles nearly every blockchain function for the node.

### neo-one-node-browser

Creates the full NEO•ONE node used in the browser, especially for the NEO•ONE website courses.

### neo-one-node-browser-worker

The web worker wrapper for the NEO•ONE node used in the browser.

### neo-one-node-concensus

Handles concensus for the node.

### neo-one-node-core

Contains all the objects for Accounts, Blocks, Transactions, Contracts, Headers, etc. used in the node and other packages.

### neo-one-node-http-rpc

Creates the actual HTTP server used by the node for relaying RPC calls.

### neo-one-node-neo-settings

Handles the node settings, like creating the genesis block, defining the governing token, and setting other key blockchain constants.

### neo-one-node-network

Contains the functionality for relaying information between the NEO•ONE node and other nodes in the network.

### neo-one-node-offline

Handles offline operations for the node, like dumping and loading chainfile data.

### neo-one-node-protocol

Handles the protocol for connecting to other nodes in the network.

### neo-one-node-rpc-handler

Contains the function which creates the RPC handlers for the node. These handlers are what are called by the node when it receives RPC requests.

### neo-one-node-storage-cache

Handles storage data caching for the node.

### neo-one-node-storage-common

Contains common functions used by node storage.

### neo-one-node-storage-levelup

Creates the storage and the storage APIs used by the node to store and access blockchain data.

### neo-one-node-tools

Primarily provides the entrypoint for restoring a NEO•ONE node from blockchain data, like in a chainfile.

### neo-one-node-vm

Contains the NEO•ONE implementation of the NeoVM, used in the NEO•ONE node and used for testing the compiler.

### neo-one-http

Contains very basic Koa HTTP server utils.

### neo-one-http-context

Contains very basic server utils, plus common functions and constants.

## CLI

### neo-one-cli

This is the main entrypoint for the NEO•ONE CLI code. It handles all NEO•ONE CLI commands.

### neo-one-cli-common

Handles more CLI functionality, like configuration, setting up wallets, setting up a NEO•ONE Client, etc.

### neo-one-cli-common-node

Contains more CLI features, like configuration and network setup.

## Compiler

### neo-one-smart-contract

Exports declaration files that define custom types used in a NEO•ONE smart contract.

### neo-one-smart-contract-codegen

Generates helpers for invoking smart contracts, and generates other code for creating dApps around smart contracts.

### neo-one-smart-contract-compiler

The largest package in NEO•ONE. Contains the entire smart contract compiler, which creates the actual compiled NeoVM bytecode.

### neo-one-smart-contract-compiler-node

Creates the environment for compiling smart contracts, which is then used in the CLI and other packages.

### neo-one-smart-contract-lib

Defines NEP17 tokens and ICOs.

### neo-one-smart-contract-test

Creates the environment for testing smart contracts.

### neo-one-smart-contract-test-browser

Creates the environment for testing smart contracts in the browser.

### neo-one-smart-contract-test-common

Runs smart contract unit tests.

### neo-one-smart-contract-typescript-plugin

Creates a plugin for the NEO•ONE smart contract compiler.

## Website

### neo-one-react

Primarily creates and exports a `FromStream` React component for subscribing to `Observables` in React.

### neo-one-react-common

Creates additional React components that are used by the NEO•ONE website and exports everything from `neo-one-react-core`.

### neo-one-react-core

Creates all the base React components that are used by the NEO•ONE website and other React components.

### neo-one-website

Contains the entire NEO•ONE website.

### neo-one-worker

Contains helpers for creating and connecting web workers, especially for the NEO•ONE website.

### neo-one-local-browser

Handles a lot of the setup and execution of the courses on the NEO•ONE website, like loading files into a browser-implemented
DB, compiling smart contracts, deploying contracts, testing contracts, etc.

### neo-one-local-browser-worker

A web worker wrapper for `neo-one-local-browser`.

### neo-one-local-singleton

Contains functions that are used in the browser for the NEO•ONE courses.

### neo-one-editor

Contains the code for the code editor used in the NEO•ONE website.

### neo-one-editor-server

Contains the code for the code editor server used in the NEO•ONE website.

## Build

### neo-one-build-common

Common build modules.

### neo-one-build-tests

Environment setup for running Jest unit and end-to-end tests.

### neo-one-build-tools

Contains all the build tools for checking, cleaning, formatting, preparing, and building NEO•ONE packages.

### neo-one-build-tools-web

Contains all the webpack compilers and build configurations, primarily for the NEO•ONE website.

## Other

### neo-one-logger

Handles almost all the logging for NEO•ONE packages.

### neo-one-logger-config

Handles configuration for `neo-one-logger`.

### neo-one-developer-tools

Provides the interface for controlling a private development network.

### neo-one-developer-tools-frame

Creates the developer tools iframe for controlling a private network.

### neo-one-ts-utils

Primarily exports TypeScript compiler API helper functions for use in build tools, the compiler, and more.

### neo-one-typescript-concatenator

Handles the concatenation of multiple TypeScript files into one file for the TypeScript compiler.

### neo-one-utils

Contains various helper functions, utilities, and constants that are used throughout NEO•ONE.

### neo-one-utils-node

Contains various helper functions, utilities, and constants that are used primarily in the node.
