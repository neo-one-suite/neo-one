---
slug: hello-world
title: Hello World
---

The smallest NEO•ONE smart contract looks like this

```typescript
export class HelloWorld extends SmartContract {}
```

This smart contract doesn't do a whole lot, in fact it does nothing, but this is the smallest compilable smart contract.

---

[[toc]]

---

## How to Read This Guide

In this guide, we will work through creating a dapp with NEO•ONE starting from writing the smart contract, to building and deploying the smart contract, to testing the smart contract, and all the way up to interacting with the smart contract from a dapp UI. Once you master the basics through this guide, you'll be able to create complex dapps using NEO•ONE.

::: warning

Tip

This guide is designed for people who prefer **learning concepts step by step**. If instead you'd like to learn by doing, check out the [tutorial](/tutorial). This guide can also serve as a complementary resource to the tutorial.

:::

This chapter provides an overview and serves as the first chapter in a step-by-step guide about the main NEO•ONE concepts. In the navigation sidebar you'll find a list of all its chapters. On a mobile device, access the guide navigation by pressing the button in the bottom right corner of your screen.

Each chapter in this guide builds on the lessons learned in earlier chapters. **You can learn most of NEO•ONE by reading the “Main Concepts” guide chapters in the order they appear in the sidebar.** If you plan to use only one piece of NEO•ONE, then you might find it useful to skip around to the parts that are relevant to you.

---

## Expected Knowledge

NEO•ONE is a JavaScript library so we'll assume you have a basic understanding of the JavaScript language. **If you're not sure, we recommend taking a [JavaScript tutorial](https://developer.mozilla.org/en-US/docs/Web/JavaScript/A_re-introduction_to_JavaScript) to check your knowledge level**. It might take some time to complete, but then you won't be trying to learn both NEO•ONE and JavaScript at the same time.

NEO•ONE itself is written in [TypeScript](http://www.typescriptlang.org/) and throughout the guide we will use TypeScript, however the guide assumes no prior knowledge. We will introduce TypeScript specific concepts as they're used, with links to documentation to learn more.

---

## Let's Get Started!

At the bottom of each page in the guide, including this one, you'll find the link to the [next chapter of the guide](/docs/blockchain-basics) right before the website footer.
