# Chapter 1: Contracts

In Lesson 1, we're going to build a token smart contract from scratch. The token will

 - Expose constants like the token name, symbol and decimals.
 - Maintain a mapping from token holder to amount held.
 - Allow looking up a token holder's balance.
 - Enable transfers between users.
 - Emit an event for every transfer.

In later lessons we'll add more functionality like pre-approving transfers and forwarding arguments to other contracts.

Before getting started, familiarize yourself with the course editor by taking the editor tour. If it hasn't already shown up automatically, or you want to view it again, click the `Tour` button in the editor toolbar at the bottom of the page.

## Learn

Every NEO•ONE smart contract starts with a typescript source file that exports a single class extending `SmartContract`. The simplest smart contract looks like

```typescript
import { SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {}
```

Let's break this down. First, we import `SmartContract` from `@neo-one/smart-contract`. This package contains all of the NEO•ONE smart contract types and is where the majority of imports will come from. `SmartContract` is a basic class that when extended marks the class as a NEO•ONE smart contract. We've extended it with a class called `Example` which will be used for all of the generated variable names in the NEO•ONE client APIs.

## Try

Go ahead and enter the following into the `Token.one.ts` file:

```typescript
import { SmartContract } from '@neo-one/smart-contract';

export class Token extends SmartContract {}
```

This is the shell of a token smart contract. Since we named it `Token`, the variable name `token` will be used in the generated NEO•ONE client APIs. You can see some of the auto-generated code in action in the `Token.test.ts` file. Notice how the `withContracts` helper passes an object with a property called `token`.

## Test

At this point, we have a basic compilable NEO•ONE smart contract. Go ahead and click the `Build` button in the lower right hand corner to compile the smart contract. Then click the `Run Tests` button to verify the smart contract. Once the tests pass, you may proceed to the next chapter by clicking `Next Chapter`.

## Wrap Up

`Token.test.ts` is very basic right now, it just checks that the `Token` smart contract exists and was compiled correctly. In later chapters we'll explore the NEO•ONE client APIs which are used to interact with smart contracts both in the front-end and in tests.

If you ever get stuck, click the `Help` link in the editor toolbar for information on where to get help, including a link to the NEO•ONE Discord where you can get live help. See the solution for a particular chapter by clicking `Show Solution` at the bottom of the course material.
