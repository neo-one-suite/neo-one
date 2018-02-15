/* @flow */
import BN from 'bn.js';
import { NULL_ACTION, TRIGGER_TYPE } from '@neo-one/node-core';
import {
  SCRIPT_CONTAINER_TYPE,
  VM_STATE,
  Output,
  common,
  utils,
} from '@neo-one/client-core';

import execute from '../execute';
import { testUtils, transactions } from '../__data__';

describe('execute', () => {
  let blockchain: $FlowFixMe;
  beforeEach(() => {
    blockchain = ({
      contract: {},
      settings: {
        vm: {},
      },
      storageItem: {},
      action: {},
      output: {},
      currentBlock: {},
    }: $FlowFixMe);
  });

  const testKYC = (name: string, gas: BN, state: number) => {
    it(name, async () => {
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve(transactions.kycContract),
      );
      blockchain.storageItem.add = jest.fn(() => Promise.resolve());
      blockchain.storageItem.get = jest.fn(() =>
        Promise.resolve({ value: Buffer.alloc(20, 0) }),
      );
      blockchain.storageItem.tryGet = jest.fn(() =>
        Promise.resolve({ value: Buffer.alloc(20, 0) }),
      );
      blockchain.storageItem.update = jest.fn(() => Promise.resolve());
      blockchain.action.add = jest.fn(() => Promise.resolve());

      const result = await execute({
        scripts: [{ code: transactions.kycTransaction.script }],
        blockchain,
        scriptContainer: {
          type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
          value: transactions.kycTransaction,
        },
        triggerType: TRIGGER_TYPE.APPLICATION,
        action: NULL_ACTION,
        gas,
        skipWitnessVerify: true,
      });

      if (state === VM_STATE.FAULT) {
        expect(result.errorMessage).toMatchSnapshot();
      } else {
        expect(result.errorMessage).toBeUndefined();
      }
      expect(result.state).toEqual(state);
      expect(result.gasConsumed.toString(10)).toMatchSnapshot();
      testUtils.verifyBlockchainSnapshot(blockchain);
    });
  };

  testKYC(
    'should fail kyc transaction with insufficient gas',
    utils.ZERO,
    VM_STATE.FAULT,
  );
  testKYC(
    'should not fail kyc transaction with sufficient gas',
    common.ONE_HUNDRED_MILLION_FIXED8,
    VM_STATE.HALT,
  );

  it('should fail mintTokens transaction', async () => {
    blockchain.contract.get = jest.fn(() =>
      Promise.resolve(transactions.kycContract),
    );
    blockchain.storageItem.tryGet = jest.fn(item => {
      if (item.key.toString('utf8') === 'sale_paused') {
        return Promise.resolve({ value: Buffer.alloc(1, 0) });
      }
      if (item.key.toString('utf8').startsWith('kyc_ok')) {
        return Promise.resolve({ value: Buffer.alloc(1, 1) });
      }
      return Promise.resolve({ value: Buffer.alloc(20, 0) });
    });
    blockchain.storageItem.get = jest.fn(() =>
      Promise.resolve({ value: Buffer.alloc(20, 0) }),
    );
    blockchain.output.get = jest.fn(() =>
      Promise.resolve(
        new Output({
          asset: common.stringToUInt256(common.NEO_ASSET_HASH),
          value: new BN(204).mul(utils.ONE_HUNDRED_MILLION),
          address: transactions.mintTransaction.outputs[1].address,
        }),
      ),
    );
    blockchain.action.add = jest.fn(() => Promise.resolve());
    blockchain.currentBlock.index = 1920286;

    const result = await execute({
      scripts: [{ code: transactions.mintTransaction.script }],
      blockchain,
      scriptContainer: {
        type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
        value: transactions.mintTransaction,
      },
      triggerType: TRIGGER_TYPE.APPLICATION,
      action: NULL_ACTION,
      gas: utils.ZERO,
      skipWitnessVerify: true,
    });

    expect(result.errorMessage).toBeUndefined();
    expect(result.state).toEqual(VM_STATE.HALT);
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
  });
});
