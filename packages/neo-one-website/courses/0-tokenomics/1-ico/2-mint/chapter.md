# Chapter 3: Minting Tokens

Now we can get to the meat of minting tokens. By the end of this chapter we'll have a fully functioning ICO.

## Learn

This chapter primarily makes use of skills we've already learned, there's just one more thing to know - we can access the value of an output via the `output.value` property. Let's look at an example:

```typescript
import { Blockchain, Hash256, receive, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @receive
  public receiveNativeAssets(): boolean {
    const { outputs } = Blockchain.currentTransaction;

    for (const output of outputs) {
      if (output.address.equals(this.address) && output.value > 10_00000000) {
        return false;
      }
    }

    return true;
  }
}
```

In this somewhat contrived example, we're checking that if any of the outputs have a value greater than 10, then we refuse the transaction.

## Instructions

There's quite a bit that needs to be done this chapter, so don't hesitate to take a peek at the solution if you get stuck.

  1. Add a `public` `readonly` property for the `amountPerNEO` that we'll be minting. Give it a value of `100_000`, i.e. for each NEO contributed, we'll mint 100k of the token.
  2. Add a `private` `Fixed<8>` property for the `mutableRemaining` and give it an initial value of `10_000_000_000_00000000`, i.e. at the start of the ICO there are 10 billion tokens available.
  3. Add a `public` `@constant` getter called `remaining` that returns `mutableRemaining` so that clients can easily check how much is remaining in the ICO.
  4. In the `for` loop that checks for only `NEO` assets, sum the `amount` to issue by multiplying `output.value` by `this.amountPerNEO`.
  5. Add a check that if `amount` is greater than `this.remaining` returns false so that we don't issue more than the expected number of tokens.
  6. Subtract `amount` from `this.mutableRemaining`.
  7. Call `this.issue` with the first reference's address as the address to issue tokens to.
  8. Change `issue` to a `private` method and remove the `Address.isCaller` check.

## Test

Take a look at the `Token.test.ts` file and you'll see that we're now fully testing the functionality of `mintTokens` - verifying everything from the emission of transfer events to the remaining amount being decremented.

## Wrap Up

In this chapter we buttoned up the implementation for `mintTokens` - in the following chapter we'll add a start and end time to our ICO.
