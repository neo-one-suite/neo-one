# Chapter 5: Escrow Refund

In this chapter we'll add a method for the source address to reclaim EON from the account. Like last chapter, we don't need to learn anything new to implement this method. You may be wondering if there is more to learn - yes, yes there is! We'll learn about new concepts in the next chapter.

## Instructions

  1. Add a method `refund` which takes a `from` `Address`, `to` `Address`, and `amount` `Fixed<8>`
  2. Throw an error if `amount` is less than 0.
  3. Verify that the caller is the `from` `Address`.
  4. Verify that the escrow account has enough funds to claim.
  5. Create an instance of `Token` using `LinkedSmartContract.for`.
  6. Invoke `transfer` with `this.address` as the `from` parameter, the `from` argument to `claim` as the `to` parameter of `transfer`, and the `amount` argument to `claim` as the `amount` parameter of `transfer`.
  7. If successful, i.e. `transfer` returns `true`, reduce the escrow balance and emit a `'balanceRefunded'` event with the `from`, `to` and `amount` arguments.

## Test

Similar to last chapter, the tests verify that the `refund` method properly transfers tokens, deducts from the escrow balance, and emits an event on a successful `refund`. We also verify that an unsuccessful `refund` results in no changes and that an invalid `amount` throws an error.

## Wrap Up

This chapter was a bit of a rehash of last chapter, but now we have a fully functioning Escrow contract! On the other side of `Next` we'll see how to generalize the Escrow contract to work for any NEP-5 token.
