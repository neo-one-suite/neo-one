// // tslint:disable no-any no-object-mutation
import { VerifyResultModel } from '@neo-one/client-common/src';
import { Transaction, Witness } from '@neo-one/node-core';
import { main } from '@neo-one/node-neo-settings';
import { Dispatcher } from '@neo-one/node-vm';
import { BN } from 'bn.js';
import { of as _of } from 'rxjs';
import { settings } from '../__data__';
import { Blockchain } from '../Blockchain';

const createBlockchain = async ({
  vm,
  storage,
  native,
}: {
  readonly vm: any;
  readonly storage: any;
  readonly native: any;
}) =>
  Blockchain.create({
    settings,
    storage,
    vm,
    native,
  });

describe('Blockchain', () => {
  let storage: any;
  let vm: any;
  let native: any;
  beforeEach(() => {
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
    storage = {
      commit,
      close,
      reset,
      account: {
        all$: _of([]),
        tryGet: tryNotFound(),
        get: notFound(),
      },

      storages: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      action: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      blockData: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      transactionData: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      applicationLogs: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      nep17TransfersSent: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      nep17TransfersReceived: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      nep17Balances: {
        tryGet: tryNotFound(),
        get: notFound(),
      },
    };

    vm = {};
    native = {};
  });
  describe('verifyTransaction', () => {
    test('should throw error on invalid script', async () => {
      const blockchain = await createBlockchain({ vm, storage, native });

      const verifyResult = await blockchain.verifyTransaction(
        new Transaction({
          script: Buffer.alloc(1, 0),
          attributes: [],
          witnesses: [
            new Witness({
              invocation: Buffer.alloc(0, 0),
              verification: Buffer.alloc(0, 0),
            }),
          ],
          systemFee: new BN(0),
          networkFee: new BN(0),
          validUntilBlock: 100000,
          nonce: 0,
          network: 423494,
          maxValidUntilBlockIncrement: 1000,
        }),
        {},
      );

      expect(verifyResult.verifyResult !== VerifyResultModel.Succeed).toEqual(
        `Verification did not succeed: ${verifyResult.failureReason}`,
      );
    });
  });
});
