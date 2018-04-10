/* @flow */
import {
  ATTRIBUTE_USAGE,
  BooleanContractParameter,
  InvocationTransaction,
  UInt160Attribute,
  Witness,
  common,
  utils,
} from '@neo-one/client-core';
import { DefaultMonitor } from '@neo-one/monitor';

import { of as _of } from 'rxjs/observable/of';

import Blockchain from '../Blockchain';

import { settings } from '../__data__';

const monitor = DefaultMonitor.create({ service: 'test' });

const createBlockchain = ({ vm, storage }: {| vm: Object, storage: Object |}) =>
  Blockchain.create({
    settings,
    storage,
    vm,
    monitor,
  });

describe('Blockchain', () => {
  let storage;
  let vm;
  beforeEach(() => {
    const tryNotFound = () => jest.fn(() => undefined);
    const notFound = () =>
      jest.fn(async () => {
        throw new Error('Not found');
      });
    storage = {
      account: {
        all: _of([]),
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
      blockSystemFee: {
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
      transactionSpentCoins: {
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
        all: _of([]),
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

      let error;
      try {
        await blockchain.verifyTransaction({
          transaction: new InvocationTransaction({
            script: Buffer.alloc(1, 0),
            gas: utils.ZERO,
            attributes: [
              new UInt160Attribute({
                usage: ATTRIBUTE_USAGE.SCRIPT,
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
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      if (error != null) {
        expect(error.code).toEqual('SCRIPT_VERIFY');
        expect(error.message).toEqual('Verification did not succeed.');
      }
    });
  });
});
