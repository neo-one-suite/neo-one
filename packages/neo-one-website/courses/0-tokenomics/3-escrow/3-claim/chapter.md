# Chapter 4: Escrow Claim

In this chapter we'll add a method for the destination address to claim EON from the account. We don't need to learn anything new to implement this method, so let's jump right into it.

## Instructions

  1. Add a method `claim` which takes a `from` `Address`, `to` `Address`, and `amount` `Fixed<8>`
  2. Throw an error if `amount` is less than 0.
  3. Verify that the caller is the `to` `Address`.
  4. Verify that the escrow account has enough funds to claim.
  5. Create an instance of `Token` using `LinkedSmartContract.for`.
  6. Invoke `transfer` with `this.address` as the `from` parameter, the `to` argument to `claim` as the `to` parameter of `transfer`, and the `amount` argument to `claim` as the `amount` parameter of `transfer`.
  7. If successful (`transfer` returns `true`), reduce the escrow balance and emit a `'balanceClaimed'` event with the `from`, `to` and `amount` arguments.

## Test

Similar to last chapter, the tests verify that the `claim` method properly transfers tokens, deducts from the escrow balance, and emits an event on a successful `claim`. We also verify that an unsuccessful claim results in no changes and that an invalid amount throws an error.

## Wrap Up

In this chapter we used the knowledge we've gained to implement the `claim` method. Next chapter we'll enable refunds, which works very similarly to the `claim` method.
