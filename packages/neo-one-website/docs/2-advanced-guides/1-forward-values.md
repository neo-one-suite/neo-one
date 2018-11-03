---
slug: forward-values
title: Forward Values
---
# Forward Values

Forward values allow advanced interactivity between smart contracts, enabling use-cases that would not normally be possible.

## Forward Value

Before we dive into the specifics, let's look at an example of how forward values are used:

```typescript
interface TokenPayableContract {
  readonly approveReceiveTransfer: (
    from: Address,
    value: Fixed<8>,
    ...args: ForwardValue[]
  ) => boolean;
}

export class Token extends SmartContract {
  // Note that the implementation here is only to show how we
  // can use forward values and is an incomplete implementation of a
  // Token transfer method.
  public transfer(
    from: Address,
    to: Address,
    value: Fixed<8>,
    ...args: ForwardValue[]
  ): boolean {
    const contract = Contract.for(to);
    if (contract !== undefined) {
      const payableContract = SmartContract.for<TokenPayableContract>(to);

      return payableContract.approveReceiveTransfer(from, value, ...args);
    }

    return true;
  }
}
```

::: warning

Note

We're using a [rest](https://www.typescriptlang.org/docs/handbook/functions.html#rest-parameters) parameter as the final parameter of the `transfer` method. Declaring a rest parameter means that the function will accept 0 or more additional arguments of that type.

:::

`ForwardValue`s represent any type - they're opaque to the contract that declared them. Instead of using them directly, the contract forwards them to another contract. In the example above we check to see if the target, or `to` `Address` is a smart contract. If it is, we get an instance of it and invoke the `approveReceiveTransfer` method, forwarding any additional arguments that we received in the call to `transfer`.

This pattern allows the target contract a chance to react to the transfer, as well as allows the user to provide any additional arguments the contract may require to react to the transfer.

## Forwarded Value

The counterpart to `ForwardValue` is the tagged type `ForwardedValue<T>`. `ForwardedValue<T>` tags the type `T` such that the NEO•ONE toolchain will generate client APIs that simplify forwarding values. Given the following smart contract:

```typescript
export class Escrow extends SmartContract {
  public approveReceiveTransfer(
    from: Address,
    value: Fixed<8>,
    to: ForwardedValue<Address>,
  ): boolean {
    // Update the escrow account for [from, to] with value
    return true;
  }
}
```

The NEO•ONE toolchain will generate a method called `forwardApproveReceiveTransferArgs`:

```typescript
const receipt = await token.transfer.confirmed(
  from,
  escrow.definition.networks[networkName].address,
  value,
  ...escrow.forwardApproveReceiveTransferArgs(to)
);
```

The `forwardApproveReceiveTransferArgs` call above not only sets up the call to forward the specified arguments, but it additionally adds the `Escrow` contracts events (if any) to the resulting `receipt`.

Forwarding values also works recursively. For example, if the `Escrow` contract also specified a rest parameter of `ForwardValue`s and called another smart contract `Foo`'s `bar` method that expected a `ForwardedValue<string>`, the client API invocation would look like:

```typescript
const receipt = await token.transfer.confirmed(
  from,
  escrow.definition.networks[networkName].address,
  value,
  ...escrow.forwardApproveReceiveTransferArgs(
    to,
    ...foo.forwardBarArgs('value')
  )
);
```

In this case, the `receipt` would contain the events for the `transfer` call, the `approveReceiveTransfer` call and the `bar` call.

## Reactive Smart Contracts

Reactive smart contracts are so powerful and enable many use-cases that would otherwise not be possible that we recommend the following pattern when implementing your smart contracts.

Whenever your smart contract has a method that takes an `action` on an `Address`, always check to see if the target `Address` is a smart contract. If it is, invoke the `approveReceive<action>` method of that smart contract with the same arguments `action` was called with, except the argument that is the smart contract `Address` itself. Additionally, pass a rest parameter of `ForwardValue`s to the method.
