// // tslint:disable no-any no-object-mutation
// import { Transaction, Witness } from '@neo-one/node-core';
// import { BN } from 'bn.js';
import { of as _of } from 'rxjs';
// import { settings } from '../__data__';
// import { Blockchain } from '../Blockchain';

import { main } from '@neo-one/node-neo-settings';
import { Dispatcher } from '@neo-one/node-vm';
import { Blockchain } from '../Blockchain';

// const createBlockchain = async ({ vm, storage }: { readonly vm: any; readonly storage: any }) =>
//   Blockchain.create({
//     settings,
//     storage,
//     vm,
//   });

// describe.skip('Blockchain', () => {
//   let storage: any;
//   let vm: any;
//   beforeEach(() => {
//     const tryNotFound = () => jest.fn(() => undefined);
//     const notFound = () =>
//       jest.fn(async () => {
//         throw new Error('Not found');
//       });
//     storage = {
//       account: {
//         all$: _of([]),
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       accountUnspent: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       accountUnclaimed: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       action: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       asset: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       block: {
//         tryGetLatest: jest.fn(async () => settings.genesisBlock),
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       blockData: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       header: {
//         tryGetLatest: jest.fn(async () => settings.genesisBlock.header),
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       transaction: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       transactionData: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       output: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       contract: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       storageItem: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       validator: {
//         all$: _of([]),
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       invocationData: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },

//       validatorsCount: {
//         tryGet: tryNotFound(),
//         get: notFound(),
//       },
//     };

//     vm = {};
//   });
//   describe('verifyTransaction', () => {
//     test('should throw error on invalid script', async () => {
//       const blockchain = await createBlockchain({ vm, storage });

//       const result = await blockchain.verifyTransaction({
//         transaction: new Transaction({
//           script: Buffer.alloc(1, 0),
//           attributes: [],

//           witnesses: [
//             new Witness({
//               invocation: Buffer.alloc(0, 0),
//               verification: Buffer.alloc(0, 0),
//             }),
//           ],
//           systemFee: new BN(0),
//           networkFee: new BN(0),
//           validUntilBlock: 100000,
//           nonce: 0,
//         }),
//       });
//       const verifyResult = result.verifications.find(({ failureMessage }) => failureMessage !== undefined);
//       expect(verifyResult).toBeDefined();
//       if (verifyResult !== undefined) {
//         expect(verifyResult.failureMessage).toEqual('Verification did not succeed.');
//       }
//     });
//   });
// });

test('Blockchain', async () => {
  const tryNotFound = () => jest.fn(() => Promise.resolve(undefined));
  const notFound = () =>
    jest.fn(async () => {
      throw new Error('Not found');
    });
  const empty$ = _of();
  const changeSet = [];
  // tslint:disable-next-line: no-any
  const commit = async (changes: any) => {
    // tslint:disable-next-line: no-array-mutation
    changeSet.push(changes);

    return Promise.resolve();
  };
  const close = jest.fn();
  const reset = jest.fn();
  const dispatcher = new Dispatcher();
  const blockchain = await Blockchain.create({
    vm: dispatcher,
    settings: main(),
    storage: {
      commit,
      close,
      reset,
      blocks: {
        tryGet: tryNotFound(),
        get: notFound(),
        all$: empty$ as any,
      },

      transactions: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      contracts: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      storages: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      headerHashList: {
        tryGet: tryNotFound(),
        get: notFound(),
        all$: empty$ as any,
      },
      blockHashIndex: {
        get: notFound(),
        tryGet: tryNotFound(),
      },
      headerHashIndex: {
        get: notFound(),
        tryGet: tryNotFound(),
      },

      contractID: {
        get: notFound(),
        tryGet: tryNotFound(),
      },
    },
  });
});
