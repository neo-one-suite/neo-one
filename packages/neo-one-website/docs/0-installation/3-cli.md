---
slug: cli
title: CLI
---

The NEO•ONE CLI is your entry point for all of NEO•ONE's functionality.

Run `yarn neo-one --help` to see the CLI commands available and their descriptions.
Run `yarn neo-one <command> --help` to see what arguments are available for that command.
Run `yarn neo-one --version` to get the version of NEO•ONE that you are running.

The NEO•ONE CLI will look for a configuration file named `.neo-one.config.ts` or `.neo-one.config.js`. If you need to provide a path to your configuration file for whatever reason you can provide an optional `--configPath <path/to/config>` argument to any of these CLI commands, which will tell NEO•ONE where to find your config file for that command. The path must be exact and must end with the exact file name. This option should not be needed.

---

[[toc]]

---

## neo-one init

Initializes a new project in the current directory. This will create a default `.neo-one.config.ts` configuration file,
a sample `Hello World` smart contract in `neo-one/contracts/HelloWorld.ts`, and a unit test in
`src/__tests__/HelloWorld.ts`.

| Argument       | Type      | Default | Description                                                                                                           |
| -------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `--react`      | `boolean` | `false` | Setting this to true will generate an example. React component that uses the `HelloWorld` smart contract              |
| `--typescript` | `boolean` | `false` | Setting this to true will initialize a TypeScript NEO•ONE project including generating a default `tsconfig.json` file |

---

## neo-one build

Builds the project and deploys it to the local development network based on the configuration found in the
NEO•ONE config file.

| Argument  | Type      | Default | Description                                       |
| --------- | --------- | ------- | ------------------------------------------------- |
| `--reset` | `boolean` | `false` | Setting this to true will reset the local project |

---

## neo-one generate

Compiles the smart contracts and generates the code helpers. This is a portion of what the `neo-one build` command does without starting a private network and deploying the contracts.

---

## neo-one new

Create new resources. `neo-one new private-key` is the only available option for now, which will generate a
new private key.

---

## neo-one start

Start NEO•ONE services. This command takes one argument after the command (`neo-one start <arg>`) which
can be either `network` or `neotracker`. `neo-one start network` will start the local development network.
`neo-one start neotracker` will start the local NEO Tracker instance.

---

## neo-one stop

Stop NEO•ONE services. This command takes one argument after the command (`neo-one stop <arg>`) which
can be either `network` or `neotracker`. `neo-one stop network` will stop the local development network.
`neo-one stop neotracker` will stop the local NEO Tracker instance.

---

## neo-one deploy

Deploys the project using the migration file.

| Argument    | Type     | Default  | Description                     |
| ----------- | -------- | -------- | ------------------------------- |
| `--network` | `string` | `"test"` | Network to run the migration on |

---

## neo-one info

Prints the project configuration.

---

## neo-one compile

Compiles a project's smart contracts and outputs the code to a local directory. You can set the arguments for this command
either in the NEO•ONE config file (ie. `.neo-one.config.ts`) or as a CLI argument. A CLI argument will override what is found in the config file. If an argument is not defined as a CLI argument and is not defined in the config file then the below defaults will be used.

| Argument    | Type      | Default             | Description                                                                  |
| ----------- | --------- | ------------------- | ---------------------------------------------------------------------------- |
| `--outDir`  | `string`  | `neo-one/compiled`  | Directory to output the compiled code                                        |
| `--path`    | `string`  | `neo-one/contracts` | Path to the smart contract directory                                         |
| `--json`    | `boolean` | `true`              | Output the contract with the JSON format                                     |
| `--avm`     | `boolean` | `false`             | Output the contract with the AVM format                                      |
| `--debug`   | `boolean` | `false`             | Output additional debug information                                          |
| `--opcodes` | `boolean` | `false`             | Output the AVM in a human-readable format for debugging (requires `--debug`) |

---

## neo-one convert

Converts values from one type to another.

This command takes two arguments after the command (`neo-one convert <input/type> <input>`) which
can be either `address`, `private-key`, `public-key`, `script-hash`, or `wif` and then the input value. This will convert the input value from the designated input type to various output formats and prints them to stdout. For example `neo-one convert private-key <your/private/key>` will print the private key, WIF, address, public key, and script hash for that private key.

---

## neo-one console

Starts a REPL with project contracts and NEO•ONE Client APIs.

| Argument     | Type    | Default     | Description                                     |
| ------------ | ------- | ----------- | ----------------------------------------------- |
| `--networks` | `array` | `["local"]` | Networks to initialize before starting the REPL |
