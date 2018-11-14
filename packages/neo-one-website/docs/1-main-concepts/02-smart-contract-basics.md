---
slug: smart-contract-basics
title: Smart Contract Basics
---
NEO•ONE enables writing NEO smart contracts in TypeScript. This chapter will cover the basics of smart contract authoring.

---

[[toc]]

---

## Why TypeScript?

The first question you might ask is "why should I write my smart contract in TypeScript?" Aside from the many benefits of first-class integration in the NEO•ONE toolchain, there are many standalone advantages to NEO•ONE TypeScript smart contracts.

  1. TypeScript smart contracts enforce strict static types, adding an extra safety net of protection against bugs in your code compared to untyped languages.
  2. We can offer an experience that is almost identical to writing normal TypeScript code that runs in the browser or in Node, due to strong support for leveraging the TypeScript type checker within the NEO•ONE compiler.
  3. TypeScript has a strong and growing ecosystem built around it - linters, editor support, documentation and tutorials.
  4. With inline NEO•ONE compiler diagnostics (in addition to the normal TypeScript diagnostics), you're never left wondering if a particular piece of syntax or logic is supported by the NEO•ONE compiler.

The NEO•ONE toolchain currently only supports TypeScript smart contracts due to the wealth of static type information they provide. In the future we'd like to support other languages, but for now we highly recommend writing your smart contracts in TypeScript, even if you've never written TypeScript before.

---

## Toolchain

If you haven't already, prepare your project by following the instructions in the [Environment Setup](/docs/environment-setup) section.

The NEO•ONE toolchain expects all smart contracts in your project to be contained within one parent folder. By default, that folder is `one/contracts`, though this location is [configurable](/docs/configuration). The main command you'll use from the NEO•ONE toolchain is:

```bash
neo-one build
```

This command compiles your smart contracts, sets up a local private network, deploys your smart contracts to that network and generates testing utilities and client APIs for interacting with your smart contract. Appending the command with `--watch` will watch for changes in your smart contracts and automatically run the build command.

---

## First Steps

Every NEO•ONE smart contract starts with a TypeScript source file that exports a single [class](https://www.typescriptlang.org/docs/handbook/classes.html) extending `SmartContract`. The simplest smart contract looks like:

```typescript
export class HelloWorld extends SmartContract {}
```

::: warning

Note

Throughout the guide and examples elsewhere in the documentation, we will refrain from explicitly importing values to keep the examples short and to the point. All values that are not global can be imported from `'@neo-one/smart-contract'`

:::

---

## Mental Model

While the above smart contract is just a shell and doesn't look like it does much, it does have an implicit `constructor` which allows us to create new instances of the class using `new HelloWorld()`. However, unlike a normal TypeScript program, we won't ever explicitly construct instances of a smart contract. Instead, the way to think about your smart contract is that on deployment to the blockchain we automatically construct an instance of it. We then use that one instance for all smart contract method calls. In essence, the smart contract class follows the [singleton pattern](https://en.wikipedia.org/wiki/Singleton_pattern).
