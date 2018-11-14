---
slug: deployment
title: Deployment
---
You've built your smart contract, tested it and built a dapp around it. Now it's time to deploy.

Productionizing your smart contract for deployment to a network other than your local network requires keeping a few things in mind which we will cover in this chapter.

---

[[toc]]

---

## Deployment Specifics

### Properties

Smart contracts may specify an instance property called `properties` to specify some or all of the properties used during deployment:

```typescript
export class Contract extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'Alex DiCarlo',
    email: 'foo@bar.com',
    description: 'This Contract is the best one.',
  };
}
```

These properties have no impact on the execution of the contract, they're simply extra metadata that you may permanently attach to the contract on the blockchain.

### Upgrade

Every NEO•ONE smart contract automatically contains a public `upgrade` method. This method replaces the smart contract code as well as the static metadata associated with the contract while preserving the smart contract's storage. In other words, this method can be used to change the logic of your smart contract without losing the data.

In order to make it possible to upgrade your contract, you *must* specify the `approveUpgrade` `protected` method. This method should return a `boolean` indicating if the `upgrade` is approved:

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

## Deploying to a Public Network

Coming soon.

Stay tuned as we work out the production deployment story for the v1 release of NEO•ONE!
