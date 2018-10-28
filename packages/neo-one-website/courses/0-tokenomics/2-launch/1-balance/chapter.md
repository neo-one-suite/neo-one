# Chapter 2: Fetch User Balance

In this chapter we'll take a quick look at how we can invoke constant methods using the NEO•ONE client APIs. This chapter will be rather short, since like properties, constant methods correspond one-to-one with methods on the generated client smart contract APIs.

## Learn

Let's jump right in with an example.

```typescript
import { constant, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  @constant
  public myConstantMethod(myFirstArg: string): string {
    return myFirstArg;
  }
}
```

We can invoke `myConstantMethod` by simply calling it on the generated client APIs.

```typescript
const myResult = await example.myConstantMethod('foo');
expect(myResult).toEqual('foo');
```

Similar to the previous chapter, the only difference with the generated client APIs and what was defined in the smart contract is that they return a `Promise`, so we must `await` the result.

## Instructions

  1. Add a call to the `getTokenInfo` method which returns the balance of the argument address and add it to the result.

Note that you'll have to deal with the case where `address` is undefined - just return `new BigNumber(0)` as the balance.

## Test

We added a row for the balance of the current user, which right now will always show 0 since the current user (nor any other user) has participated in the ICO yet. Similarly, the tests add a check that the returned balance for the passed address is 0. Run the tests to verify you've implemented `getTokenInfo` correctly and then proceed to the next chapter.

## Wrap Up

In this chapter we saw that invoking constant methods is virtually identical to accessing properties. In the next chapter we'll look at invoking non-constant methods by implementing a text input for participating in the ICO.
