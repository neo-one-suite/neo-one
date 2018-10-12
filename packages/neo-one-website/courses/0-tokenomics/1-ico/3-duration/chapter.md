# Chapter 4: ICO Start Time & Duration

Now that we can mint tokens, let's limit the duration of the ICO. We'll add a start time and duration in this chapter.

## Learn

Last chapter we saw that we can access the current transaction with `Blockchain.currentTransaction` - there are two other properties to be aware of on `Blockchain` that are useful for smart contract development:

 - `Blockchain.currentBlockTime` - the unix timestamp (in seconds) of the current block.
 - `Blockchain.currentHeight` - the current block index.

## Instructions

  1. Add a `public` `readonly` constructor parameter property called `icoStartTimeSeconds` whose default value is equal to `Blockchain.currentBlockTime + 60 * 60`.
  2. Add a `public` `readonly` constructor parameter property called `icoDurationSeconds` whose default value is equal to `24 * 60 * 60`.
  3. If the `Blockchain.currentBlockTime` is not within `this.icoStartTimeSeconds` and `this.icoStartTimeSeconds + this.icoDuration`, return `false` from `mintTokens`.

  Recall that all constructor parameters must have a default value for local and automated testing. Here we're setting the start time to 1 hour from the current time and the duration to 24 hours.

## Test

`Token.test.ts` has been updated to do a few things:

  1. Check that `mintTokens` fails before the ICO start time.
  2. Fast forward the local blockchain 1 hour ahead using `developerClient.fastForwardOffset(60 * 60)`.
  3. Check that `mintTokens` succeeds just like last chapter.
  4. Fast forward the local blockchain 24 hours ahead using `developerClient.fastForwardOffset(24 * 60 * 60)`.
  5. Check that `mintTokens` fails because we're past the ICO time.
  6. Check that the properties `icoStartTimeSeconds` and `icoDurationSeconds` are accessible.

## Wrap Up

In this chapter we learned about the remaining `Blockchain` properties and used `Blockchain.currentBlockTime` to enforce that minting tokens in our ICO only happens during a set period of time. Now that we have a fully functioning NEP-5 Token with ICO capabilities, let's see how we can interact with it in a front-end app for the ICO in the next chapter.
