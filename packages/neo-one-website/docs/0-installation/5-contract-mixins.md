---
slug: contract-mixins
title: Contract Mixins
---

NEO•ONE provides mixins for common smart contract patterns.

This guide will walk you through how to use a mixin.

---

[[toc]]

---

## Requirements

Install the following packages if you have not done so:

```zsh
yarn add @neo-one/client @neo-one/cli @neo-one/smart-contract @neo-one/smart-contract-test @neo-one/smart-contract-lib @neo-one/smart-contract-typescript-plugin
```

```zsh
npm install @neo-one/client @neo-one/cli @neo-one/smart-contract @neo-one/smart-contract-test @neo-one/smart-contract-lib @neo-one/smart-contract-typescript-plugin
```

::: warning

Important

The package `@neo-one/smart-contract-lib` contains the mixins and is important to this guide.

:::

---

## What Is A Mixin?

A mixin is a class (abstract or non-abstract) in which some or all of its methods and/or properties are unimplemented.

We use mixin as a way to insert common properties and methods (sometimes required such as in the case of meeting a token standard) into your contract.

::: warning

Tip

You can think of our mixins as a template or a base where you can build your contracts on.

:::

---

## Usage

```typescript
import { SmartContract } from '@neo-one/smart-contract';
// import template of your choice from @neo-one/smart-contract-lib
import { NEP5Token } from '@neo-one/smart-contract-lib';

// Mixins
export class YourContract extends NEP5Token(SmartContract) {
  // 'SmartContract' here can be any other contract (abstract & non-abstract class) that extends SmartContract class
  // 'YourContract' inherits the methods and properties defined in NEP5TokenClass returned by NEP5Token
  // ... your smart contract code.
}
```

If you find the syntax `NEP5Token(SmartContract)` strange, checkout this page on [Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html) from the TypeScript Handbook for more details.

::: warning

Tip

We encourage you to look at the NEP5Token mixin to understand how we are implementing a NEP5 token. Go [here](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/NEP5Token.ts) to see the source code for the NEP5Token mixin

:::

---

## Example

The following example set uses a mixin to design a new token that follows the NEP5 token standard.

::: warning

Note

A token standard simply defines a set of methods and properties that must exist in the token.

:::

`SimpleToken.ts`

SimpleToken is injected with `NEP5Token`'s methods and properties.

```typescript
import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';
import { NEP5Token } from '@neo-one/smart-contract-lib';

export abstract class SimpleToken extends NEP5Token(SmartContract) {
  public readonly owner: Address;
  public readonly decimals: 8 = 8;

  public constructor(owner: Address, amount: Fixed<8>) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, amount);
  }
}
```

`Redtoken.ts`

`RedToken` inherits methods and properties that adheres to the NEP5 token standard because of the mixin. It also inherits everything defined in `SimpleToken`.

```typescript
import { Address, Deploy, Fixed } from '@neo-one/smart-contract';
import { SimpleToken } from './SimpleToken';

export class RedToken extends SimpleToken {
  public readonly name: string = 'RedToken';
  public readonly symbol: string = 'RT';

  public constructor(owner: Address = Deploy.senderAddress, amount: Fixed<8> = 1_000_000_00000000) {
    super(owner, amount);
  }
}
```

---

## Available Templates

- [NEP5Token](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/NEP5Token.ts) - [NEP5 Token Standard](https://docs.neo.org/tutorial/en-us/9-smartContract/What_is_nep5.html)
- [ICO](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/ICO.ts) - Initial Coin Offering.
- Ownership/[Ownable](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/ownership/Ownable.ts) - This mixin provides a means to assign an address as the owner of a contract. Extending this class and adding `this.ownerOnly()`; to the beginning of all public functions will throw an error anytime an address other than the primary makes requests.
- Ownership/[Secondary](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/ownership/Secondary.ts) - This mixin provides a means to mark an address as the primary caller of this contract. Extending this class and adding `this.primaryOnly()`; to the beginning of all public functions will throw an error anytime an address other than the primary makes requests.
