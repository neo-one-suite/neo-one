import { NEOONEDataProvider } from '@neo-one/client-core';

const oneRPCURL = 'http://localhost:40200/rpc';
const oneProvider = new NEOONEDataProvider({
  network: 'main',
  rpcURL: oneRPCURL,
});

// oneProvider.getBlock(3474317).then((block) => {
//   block.transactions
//     .filter((transaction) => transaction.type === 'InvocationTransaction')
//     .forEach((invocation) => console.log(invocation.invocationData));
// });

oneProvider.getBlockCount().then((count) => console.log(count));
