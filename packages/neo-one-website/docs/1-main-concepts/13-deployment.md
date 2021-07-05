---
slug: deployment
title: Deployment
---

You've built your smart contract, tested it and built a dapp around it. Now it's time to deploy.

Productionizing your smart contract for deployment to a network other than your local network requires keeping a few things in mind which we will cover in this chapter.

---

[[toc]]

---

::: warning

Deployment has not been thoroughly tested for N3 yet.

:::

## Deployment Specifics

### Properties

Smart contracts may specify an instance property called `properties` to specify some or all of the properties used during deployment:

```typescript
export class Contract extends SmartContract {
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: '*',
  };
}
```

#### `groups`

Groups is an array of objects that defines what groups your contract belongs to.

#### `permissions`

Permissions is an array of objects that defines what contracts/methods your contract is allowed to call. You only need to define a non-empty array here if you want your contract to be able to call other contracts. A valid permission object will contain a `hash` property or a `group` property, or neither (to denote a wildcard).

For example:

```typescript
export class Contract extends SmartContract {
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: '*',
  };
}
```

#### `trusts`

Trusts is either a wildcard string (`"*"`) or an array of strings that defines which addresses are allowed to call your contract.

If `properties` is not defined then the contract will compile correctly but the compiler will produce a warning to recommend defining the `properties` property. If it's not defined then the compiler will default to

These properties are important for constructing your contract's manifest. The manifest is generated by the NEO•ONE compiler and is vital for deployment.

When a smart contract is deployed, it must explicitly declare the features and permissions it will use. When it is running, it will be limited by its declared list of features and permissions, and cannot do anything beyond the scope of what's defined in the manifest.

### Upgrade

Every NEO•ONE smart contract automatically contains a public `upgrade` method. This method replaces the smart contract code as well as the static metadata associated with the contract while preserving the smart contract's storage. In other words, this method can be used to change the logic of your smart contract without losing the data.

In order to make it possible to upgrade your contract, you _must_ specify the `approveUpgrade` `public` method. This method should return a `boolean` indicating if the `upgrade` is approved:

```typescript
export class Contract extends SmartContract {
  public constructor(public readonly owner = Deploy.senderAddress) {}

  public approveUpgrade(): boolean {
    return Address.isCaller(this.owner);
  }
}
```

Using `Address.isCaller(this.owner)` is the most typical approach.

::: warning

Note

If you do not specify the `approveUpgrade` method, it is impossible for you or anyone else to `upgrade` the contract.

:::

### Destroy

All smart contracts have a `protected` method called `destroy` which any method may use to permanently delete the smart contract. Once `destroy` is called the smart contract can no longer be invoked and the storage is no longer accessible. You're not required to have a method that calls `destroy`, but if you do, it should probably look something like:

```typescript
export class Contract extends SmartContract {
  public constructor(public readonly owner = Deploy.senderAddress) {}

  public permanentlyDestroy(): boolean {
    if (!Address.isCaller(this.owner)) {
      return false;
    }

    this.destroy();

    return true;
  }
}
```

::: warning

Note

While the contract can no longer be invoked and the storage is not accessible, all of the past invocations still exist on the blockchain. The storage can still be accessed by replaying the blockchain from the beginning up until the point it was destroyed.

:::

---

### Migration File

To deploy your contract to a network, you will need to define a `migration` file. The default location for this file is `neo-one/migration.ts`, but it can be [configured](/docs/config-options). A migration file simply exports a function to call the deploy method on your smart contracts with the appropriate arguments. It should look something like this:

```typescript
import BigNumber from 'bignumber.js';
import { MigrationContracts } from '../src/neo-one';

export default ({ token, ico, escrow }: MigrationContracts, _network: string) => {
  token.deploy();
  ico.deploy(undefined, new BigNumber(1566864121), undefined);
  escrow.deploy();
};
```

### MigrationSmartContract

You may have noticed the new type we use in the above `migration` file, `MigrationContracts`. This is another type generated by NEO•ONE for use specifically in `migration` files and while it looks the same as its counterpart `SmartContract` it has a key difference in that there is no `.confirmed(...)` properties for any of its contract methods. This is because during migration _every_ contract invocation will be be awaited before proceeding to this next invocation. This can be useful when you would like to deploy contracts in series or if you would like to do some additional bootstrapping after the deployment of a contract.

As an example, lets say you have an ICO contract and you would like to make sure you are the first person to mint a portion of the tokens. Then, going off the migration file above, we could run something like:

```typescript
import BigNumber from 'bignumber.js';
import { Hash256 } from '@neo-one/client';
import { MigrationContracts } from '../src/neo-one';

export default ({ token, ico, escrow }: MigrationContracts, _network: string) => {
  token.deploy();
  // here we set the startTime of the ICO to be immediate
  ico.deploy(undefined, new BigNumber(0), undefined);
  ico.mintTokens([{ amount: new BigNumber(10), asset: Hash256.NEO }]);
  escrow.deploy();
};
```

This will ensure that after deploying the `ico` contract (and confirming it is deployed) the next action before deploying the `escrow` contract is to mint some of the ICO tokens to the currently selected `UserAccount`. While a more elegant and safe solution might be to allow the owner of the ICO to mint tokens before the timer has started this should make it clear how you can bootstrap a contract during migration.

## Deploying to a Public Network

Once you have successfully configured your `migration` file as explained above you are all set to deploy your Smart Contract! Using the set of [networks](/docs/config-options) defined in `.neo-one.config.js` you can deploy using the command:

```bash
yarn neo-one deploy --network <network>
```

where `network` is one of the keys provided by your configuration. By default `yarn neo-one deploy` will use the `test` key.

::: warning

Note

We HIGHLY recommend deploying to both a local private network _and_ the Neo TestNet before attempting to deploy to the MainNet.

:::