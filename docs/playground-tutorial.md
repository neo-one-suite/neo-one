---
id: playground-tutorial
title: Playground Tutorial
---
This guide will walk you through the [NEO•ONE Playground](https://github.com/neo-one-suite/neo-one-playground) to showcase what is possible and get you started writing dapps!

## Tutorial

First, to get the playground smart contracts deployed to a private network, run:
```
yarn neo-one build
```
To interact with the dapps in your browser, run:
```
yarn start
```

### Developer Tools

Take note of the developer tools widget shaped like the NEO•ONE logo in the bottom left corner of the
page.  This allows you to do a variety of helpful things on your private network like:
* Reset
* Fast forward
* Run consensus
* Set time between blocks
* Toggle auto-consensus
* Select & create wallets

Try checking out the ICO page and fast forwarding to the start time to participate. With NEO•ONE, this widget is also available to you for building and testing your own dapps!


### Edit a Smart Contract

Next, we suggest you take a look at the source code for these smart contracts in the [one/contracts](https://github.com/neo-one-suite/neo-one-playground/tree/master/one/contracts) folder.
You'll see that each smart contract is written in standard typescript.  Try making a visible change, like changing the `amountPerNEO` property to a different number in the One ICO contract.
To see the change take effect, simply rerun `yarn neo-one build` to build and deploy your smart contract and `yarn start` to see it in the playground.  That's it!
Getting a smart contract up and running on a private network is easier than ever.


### Catch Bugs Early

Beyond this, any code which would cause errors running on the NEO-VM will show up as inline errors caught by the
NEO•ONE compiler.  To see this in action, try adding the following line to one of the smart contracts:
```
Address.from('abc')
```
The compiler should tell you that 'abc' is not an address string.  Neat, huh?  The goal is for you to write your smart contracts in the most natural way possible.  NEO•ONE will let you know when your code won't
compile or will produce malformed results.  Note that this feature only works when using one of the major IDEs.  We recommend [VSCode](https://code.visualstudio.com/) for the best experience with Typescript.
