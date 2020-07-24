---
slug: smart-contract-compiler
title: Smart Contract Compiler
---

## How Can I Add New Features or Fix Bugs in the Smart Contract Compiler?

### Basics of the Smart Contract Compiler

The NEO•ONE Smart Contract Compiler is by far the _largest_ NEO•ONE package. The compiler takes in (almost) regular
TypeScript code and compiles it to [NeoVM](https://docs.neo.org/docs/en-us/basic/technology/neovm.html) bytecode, which can
then be deployed to the Neo blockchain and run on the NeoVM. NEO•ONE uses the TypeScript compiler API to parse the TypeScript code
into a tree of "nodes" with information about each node. Our compiler then "visits" each node and begins to output specific
bytecode for the VM instructions that are needed in order to execute the logic that is specified by the TypeScript code.
The bytecode outputted by the compiler corresponds to human-readable opcodes that each correspond to an action that the
NeoVM will perform. These actions are the manipulation of data by the NeoVM that will ultimately translate to changes to the
state of the Neo blockchain.

### Where to Look in the Code

Now that you have a _very_ basic understanding of how the NEO•ONE compiler works, you can start digging into the `neo-one-smart-contract-compiler`
package. Most likely you'll be looking in `neo-one-smart-contract-compiler/compiler/<subfolder>` (where `<subfolder>` is one of `constants`, `declaration`, `expression`, `helper`, `scope`, `statement`)
for the specific syntax that is broken or where you want to add a feature. For example, if you want to change how we compile the `==` token, you would
look for `EqualsEqualsEqualsHelper.ts` in `neo-one-smart-contract-compiler/compiler/helper/relational/EqualsEqualsHelper.ts`. In there you'll see
how this helper will "emit" different opcodes, syscalls, and other helpers to manipulate the Evaluation Stack. The comment line above each emit shows a
representation of the Evaluation Stack _after_ that bytecode is evaluated.

### Write Unit Tests for What You're Working On

Once you have an understanding of what helpers or syntax compilers you need to change in order to make your compiler change, the best way to begin is to write
a unit test that you will run to test your change. You'll see that nearly every helper and syntax compiler has a corresponding set of unit tests in `neo-one-smart-contract-compiler/src/__tests__`.
For example, the `IfStatementCompiler.ts` has a set of unit tests in `IfStatementCompiler.test.ts`. In there you'll see that we typically use the built in `assertEqual` method to
test if values are what we expect them to be. You'll also see that we have helpers, like the `helpers.executeString()` helper, that make it easy to compile a string and test for certain behavior.

Here is an example unit test you would write to test your changes:

```ts
import { helpers } from '../../../__data__';

describe('MyNewCompiler', () => {
  test.only('simple test', async () => {
    await helpers.executeString(`
      if (!true) {
        throw 'Failure';
      }

      const x = '10';
      assertEqual(x, '10');
    `);
  });
});
```

### Start Hacking

Once you've created a unit test that either recreates the bug you're trying to fix, or tests for the expected behavior of your new feature, you can start to make changes
to the compiler's source code and run your unit test. If you want to add logging (ie. `console.log`) to the source code to get more information you can, just make sure
to change the console settings in `neo-one-build-tests/environments/test/jestSetup.js`. From there you should make sure to only run one unit test at a time
so that you're only getting logs from the compilation of that one unit test. This will make it easier to learn what the compiler is doing when compiling a specific string.
To run a specific unit test, rather than all unit tests, run `rush test -t <path/to/testfile>`.

And that's it! Once you have this workflow setup you can hack away at the compiler code and run the unit test to test your changes, get logs, etc.
