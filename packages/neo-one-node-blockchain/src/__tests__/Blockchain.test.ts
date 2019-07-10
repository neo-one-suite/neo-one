// tslint:disable no-any no-object-mutation
import { common, utils } from '@neo-one/client-common';
import {
  AttributeUsage,
  BooleanContractParameter,
  InvocationTransaction,
  UInt160Attribute,
  Witness,
} from '@neo-one/node-core';
import { of as _of } from 'rxjs';
import { settings } from '../__data__';
import { Blockchain } from '../Blockchain';

const createBlockchain = async ({ vm, storage }: { readonly vm: any; readonly storage: any }) =>
  Blockchain.create({
    settings,
    storage,
    vm,
  });

describe('Blockchain', () => {
  let storage: any;
  let vm: any;
  beforeEach(() => {
    const tryNotFound = () => jest.fn(() => undefined);
    const notFound = () =>
      jest.fn(async () => {
        throw new Error('Not found');
      });
    storage = {
      account: {
        all$: _of([]),
        tryGet: tryNotFound(),
        get: notFound(),
      },

      accountUnspent: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      accountUnclaimed: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      action: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      asset: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      block: {
        tryGetLatest: jest.fn(async () => settings.genesisBlock),
        tryGet: tryNotFound(),
        get: notFound(),
      },

      blockData: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      header: {
        tryGetLatest: jest.fn(async () => settings.genesisBlock.header),
        tryGet: tryNotFound(),
        get: notFound(),
      },

      transaction: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      transactionData: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      output: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      contract: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      storageItem: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      validator: {
        all$: _of([]),
        tryGet: tryNotFound(),
        get: notFound(),
      },

      invocationData: {
        tryGet: tryNotFound(),
        get: notFound(),
      },

      validatorsCount: {
        tryGet: tryNotFound(),
        get: notFound(),
      },
    };

    vm = {};
  });
  describe('verifyTransaction', () => {
    test('should throw error on invalid script', async () => {
      const blockchain = await createBlockchain({ vm, storage });
      vm.executeScripts = jest.fn(() => ({
        stack: [new BooleanContractParameter(false)],
      }));

      const result = await blockchain.verifyTransaction({
        transaction: new InvocationTransaction({
          script: Buffer.alloc(1, 0),
          gas: utils.ZERO,
          attributes: [
            new UInt160Attribute({
              usage: AttributeUsage.Script,
              value: common.ZERO_UINT160,
            }),
          ],

          scripts: [
            new Witness({
              invocation: Buffer.alloc(0, 0),
              verification: Buffer.alloc(0, 0),
            }),
          ],
        }),
      });
      const verifyResult = result.verifications.find(({ failureMessage }) => failureMessage !== undefined);
      expect(verifyResult).toBeDefined();
      if (verifyResult !== undefined) {
        expect(verifyResult.failureMessage).toEqual('Verification did not succeed.');
      }
    });
  });
});
