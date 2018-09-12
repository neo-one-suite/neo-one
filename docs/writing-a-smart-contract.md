---
id: writing-a-smart-contract
title: Writing a Smart Contract
---
This guide will help you get started writing your own Smart Contract with NEO•ONE.

## Smart Contracts in Typescrit

To write a smart contract, you must export a class which extends the SmartContract base class:
```
import { SmartContract } from '@neo-one/smart-contract'

export class MyContract extends SmartContract {
  ...
```
Every smart contract must have a public field called properties which contains this basic information about the
smart contract:
```
  public readonly properties = {
    codeVersion: '1.0',
    author: 'neo-one',
    email: 'neo-one@neo-one.io',
    description: 'My First Smart Contract',
  };
```

Besides including this property, you just need to write your class and methods like you would a normal typescript class.  Anything that won't compile
should be caught by NEO•ONE's inline error checking.

All available types should be imported from [@neo-one/smart-contract](https://github.com/neo-one-suite/neo-one/blob/master/packages/neo-one-smart-contract/src/index.d.ts).  As an example, say you want to write a method that takes in an Address
and returns an Integer.  This might be a method which checks the contract's token balance of an Address:
```
import { Address, constant, Integer, SmartContract } from '@neo-one/smart-contract'

export class MyContract extends SmartContract {

  ...

  @constant
  public checkBalance(address: Address): Integer {
    // checks balance
  };
  ...
```

Note the inclusion of the `@constant` tag.  While the `checkBalance` method would work fine without it, the `@constant` tag lets the compiler know that this method does not mutate the internal state of the smart contract and therefore does not need to submit a transaction to the blockchain.

That's pretty much all you need to know to get started.  Just try and write your smart contract like a normal typescript class and let NEO•ONE help you with the rest!  When you are done, run `yarn neo-one build` to compile your smart contract and deploy it to a local private network.

