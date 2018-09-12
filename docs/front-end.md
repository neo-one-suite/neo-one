---
id: front-end
title: Front End
---
This guide will help you get learn how NEO•ONE can help you turn your smart contract into a dapp by connecting it with a front-end.

## React Tools
Everything available to you for testing is also available for use on your front-end. To interface with your smart contract, use the same smart contract api
used for testing. In addition to these tools, you also have access to some tools designed specifically to help you build a front end with your smart contract using
[React](https://reactjs.org/).

Like what is generated for testing, a `WithContracts` react component is also generated to give you access to a similar tool set inside of your react app.
`WithContracts` is imported from the generated folder and functions as a React Container.  It is used to forward your smart contract and the the client
into your react app.  Here is how you might use WithContracts to forward these to your other components.
```
import { AddressString } from '@neo-one/client`;
import { WithContracts } from '../../../one/generated';

 export function MyContractApp({ address }: {address: AddressString}) {
  return (
    <WithContracts>
      {({ client, myContract }) => (
        ...
```

NEO•ONE also generates a DeveloperTools widget to help you test your app's front end.  You can find and play with this in the bottom
left hand corner of the NEO•ONE Playground.  To use it for testing your apps, simply import the component from the generated folder and add it into your app!

In addition to these tools, NEO•ONE also gives you a whole host of handy react tools found in `@neo-one/react`.  Learn about everything `@neo-one/react` has to offer,
[here]().

## Further Reading
Hopefully these guides have given you a quick introduction to what is possible with NEO•ONE.  To find more details on the apis, see our documentation [here]().
