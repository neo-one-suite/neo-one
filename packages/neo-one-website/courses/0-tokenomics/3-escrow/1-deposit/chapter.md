# Chapter 2: Deposit Funds

Last chapter was a lot of reinforcing previously learned concepts, and this one will be much the same as we develop the shell of our Escrow contract. The Escrow contract should allow one person to deposit funds into a shared account with another address, where either party may withdraw funds from the account at any time. One might use this, for example, to give Eon to friends to try out and if they don't end up claiming it, then they can get it back - i.e. it's not just lost forever.

## Learn

This chapter actually doesn't have anything new to learn - rather than try to throw in new concepts at the same time as revisiting old ones, we felt it best to just let you focus on building out the contract from scratch on your own.

## Instructions

Starting from scratch, we're going to implement the shell of the Escrow contract. We'll need to do the following:

  1. Add a `MapStorage<[Address, Address], Fixed<8>>` property named `balances` to store the balance of each shared account
  2. Add a `@constant` method named `balanceOf`  for checking the balance of a given shared account.
  3. Add a method named `deposit` which accepts a `from` and `to` which specify the shared account, and `amount` for the amount in that account. Increase the balance of the shared account by `amount`.
  4. Add an event notifier to `deposit` called `balanceAvailable` that takes the `from`, `to`, and `amount` as parameters. Invoke the event notifier in the `deposit` method.

Note that we haven't actually transferred any tokens yet, and functionally our smart contract doesn't actually do much since all we're doing is incrementing a balance. In the next chapter we'll make this a bit more functional once the shell is complete.

## Test

We've started a new set of test cases in `Escrow.test.ts` which validate that we can call the `deposit` method and that the escrow balance is updated correctly.

## Wrap Up

In this chapter we reinforced concepts learned in earlier lessons to create a new smart contract from scratch. Next chapter we'll learn how to invoke methods on the Token contract from our Escrow contract.
