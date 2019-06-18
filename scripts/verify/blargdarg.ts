import { NEOONEDataProvider } from '@neo-one/client-core';
import { InvocationTransaction } from '@neo-one/node-core';
import { reverseByteString } from './utils';
import BigNumber from 'bignumber.js';
import fs from 'fs-extra';

// const oneRPCURL = 'http://localhost:40200/rpc';
// const oneProvider = new NEOONEDataProvider({
//   network: 'main',
//   rpcURL: oneRPCURL,
// });

// oneProvider.getBlock(3534243).then((block) => {
//   block.transactions
//     .filter((transaction) => transaction.type === 'InvocationTransaction')
//     .forEach((invocation) => {
//       console.log(invocation.invocationData);
//       console.log(invocation.attributes);
//     });

//   // console.log(reverseByteString('e75763a2536bf45e829ee345de762fdf51b0af6a'));
// });

// oneProvider
//   .getTransaction('aabe4a5d967c841cac2d5fb9ec8582181e4f3e33aaacf198f538745ebe8e1dbc')
//   .then((transaction) => {
//     if (transaction.type === 'InvocationTransaction') {
//       console.log(transaction);
//       // const invoke = new InvocationTransaction({
//       //   script: Buffer.from(transaction.script, 'hex'),
//       //   gas: new BigNumber(transaction.gas),
//       //   attributes: transaction.attributes,
//       //   inputs: transaction.inputs,
//       //   outputs: transaction.outputs,
//       //   scripts: transaction.scripts,
//       // });

//       // console.log(invoke);

//       // console.log(invoke.serializeWire());
//     }
//   })
//   .catch((error) => console.error(error));

// oneProvider.getBlockCount().then((count) => console.log(count));

const ops = fs.readJSONSync('/Users/alexfrag/Documents/Development/NEO/neo-one/scripts/verify/ops.json');
let gasCost = 0;
const oneOps = new Set([]);
const zeroOps = new Set([]);
ops.forEach((op, idx) => {
  if (op.fee === '100000000') {
    // console.log(`${JSON.stringify(op)} : ${idx} : ${gasCost}`);
    oneOps.add(op.op);
  }
  // if (op.fee === '0') {
  //   zeroOps.add(op.op);
  // }
  if (1000000000 - gasCost !== Number(op.currentGAS)) {
    throw new Error(`${JSON.stringify(op)} : ${idx} : ${gasCost}`);
  }

  gasCost += Number(op.fee);
});

// console.log('Zero Ops');
// console.log([...zeroOps].sort());
console.log('One Ops:');
console.log([...oneOps].sort());
