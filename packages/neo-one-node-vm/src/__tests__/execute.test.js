/* @flow */
import BN from 'bn.js';
import {
  NULL_ACTION,
  TRIGGER_TYPE,
  type ExecuteScriptsResult,
} from '@neo-one/node-core';
import {
  SCRIPT_CONTAINER_TYPE,
  VM_STATE,
  type UInt160,
  Input,
  InvocationTransaction,
  Output,
  ScriptBuilder,
  common,
  utils,
} from '@neo-one/client-core';
import { DefaultMonitor } from '@neo-one/monitor';

import _ from 'lodash';

import execute from '../execute';
import { createBlockchain, testUtils, transactions } from '../__data__';

const monitor = DefaultMonitor.create({
  service: 'test',
});

const executeSimple = ({
  blockchain,
  transaction,
  gas,
  persistingBlock,
}: {|
  blockchain: $FlowFixMe,
  transaction: InvocationTransaction,
  gas?: BN,
  persistingBlock?: $FlowFixMe,
|}) =>
  execute({
    monitor,
    scripts: [{ code: transaction.script }],
    blockchain,
    scriptContainer: {
      type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
      value: transaction,
    },
    triggerType: TRIGGER_TYPE.APPLICATION,
    action: NULL_ACTION,
    gas: gas || utils.ZERO,
    skipWitnessVerify: true,
    persistingBlock,
  });

const neoBN = (value: string) =>
  new BN(value, 10).mul(utils.ONE_HUNDRED_MILLION);
const NEO_ASSET_HASH_UINT256 = common.stringToUInt256(common.NEO_ASSET_HASH);

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

      const result = await executeSimple({
        blockchain,
        transaction: transactions.kycTransaction,
        gas,
      });

      if (state === VM_STATE.FAULT) {
        const { errorMessage } = result;
        expect(errorMessage).toBeDefined();
        if (errorMessage != null) {
          expect(errorMessage.split('\n')[0]).toMatchSnapshot();
        }
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

  it('should refund on mintTokens with insufficient presale', async () => {
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

    const result = await executeSimple({
      blockchain,
      transaction: transactions.mintTransaction,
    });

    expect(result.errorMessage).toBeUndefined();
    expect(result.state).toEqual(VM_STATE.HALT);
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
  });

  describe('concierge', () => {
    const { conciergeContract } = transactions;
    const senderAddress = common.bufferToUInt160(Buffer.alloc(20, 10));

    const mockBlockchain = () => {
      blockchain = createBlockchain({
        contract: conciergeContract,
      });

      blockchain.output.get = jest.fn(() =>
        Promise.resolve(
          new Output({
            address: senderAddress,
            value: neoBN('20'),
            asset: NEO_ASSET_HASH_UINT256,
          }),
        ),
      );
    };

    const inputHash = common.bufferToUInt256(Buffer.alloc(32, 5));
    const ownerScriptHash = common.stringToUInt160(
      '0x78bad2350ef3403faba2a1b5fc5415ebd88e0946',
    );
    const totalSupply = Buffer.from('totalSupply', 'utf8');
    const whitelistSaleBegin = Buffer.from('WHITELIST_SALE_BEGIN', 'utf8');
    const whitelistHardCap = Buffer.from('WHITELIST_HARD_CAP', 'utf8');
    const preSaleBegin = Buffer.from('PRE_SALE_BEGIN', 'utf8');
    const preSaleHardCap = Buffer.from('PRE_SALE_HARD_CAP', 'utf8');
    const mainSaleBegin = Buffer.from('MAIN_SALE_BEGIN', 'utf8');
    const mainSaleHardCap = Buffer.from('MAIN_SALE_HARD_CAP', 'utf8');
    const maxNEOPerTransfer = Buffer.from('MAX_NEO_PER_TRANSFER', 'utf8');

    const whitelistBeginTime = 1518512400;
    const preSaleBeginTime = 1518598800;
    const mainSaleBeginTime = 1522486800;

    beforeEach(() => {
      mockBlockchain();
    });

    const checkResult = (result: ExecuteScriptsResult) => {
      if (result.errorMessage != null) {
        throw new Error(result.errorMessage);
      }

      if (result.state !== VM_STATE.HALT) {
        throw new Error(`Ended in ${result.state}`);
      }

      return result.stack[0];
    };

    const executeSetupScript = async (script: Buffer) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({ script }),
      });

      return checkResult(result);
    };

    const deploy = () =>
      executeSetupScript(
        new ScriptBuilder()
          .emitAppCall(conciergeContract.hash, 'deploy')
          .build(),
      );

    const addToWhitelist = async (address: UInt160) =>
      executeSetupScript(
        new ScriptBuilder()
          .emitAppCall(conciergeContract.hash, 'addToWhitelist', address)
          .build(),
      );

    const setParam = async (operation: string, value: string) =>
      executeSetupScript(
        new ScriptBuilder()
          .emitAppCall(conciergeContract.hash, operation, new BN(value, 10))
          .build(),
      );

    const expectItemBNEquals = async (key: Buffer | UInt160, value: string) => {
      const item = await blockchain.storageItem.get({
        hash: conciergeContract.hash,
        key,
      });
      testUtils.expectItemBNEquals(item, value);
    };

    const expectFailure = (result: ExecuteScriptsResult) => {
      expect(result.errorMessage).toBeUndefined();
      expect(result.state).toEqual(VM_STATE.HALT);
      expect(result.stack.length).toEqual(1);
      expect(result.stack[0].asBoolean()).toBeFalsy();
      expect(result.gasConsumed.toString(10)).toMatchSnapshot();
      testUtils.verifyBlockchainSnapshot(blockchain);
    };

    const expectThrow = (result: ExecuteScriptsResult) => {
      expect(result.errorMessage).toBeDefined();
      if (result.errorMessage != null) {
        expect(result.errorMessage.split('\n')[0]).toMatchSnapshot();
      }
      expect(result.state).toEqual(VM_STATE.FAULT);
      expect(result.gasConsumed.toString(10)).toMatchSnapshot();
      testUtils.verifyBlockchainSnapshot(blockchain);
    };

    const expectSuccess = (result: ExecuteScriptsResult) => {
      testUtils.verifyBlockchainSnapshot(blockchain);
      expect(result.errorMessage).toBeUndefined();
      expect(result.state).toEqual(VM_STATE.HALT);
      expect(result.stack.length).toEqual(1);
      expect(result.stack[0].asBoolean()).toBeTruthy();
      expect(result.gasConsumed.toString(10)).toMatchSnapshot();
      testUtils.verifyBlockchainSnapshot(blockchain);
    };

    it('should add to storage in deploy', async () => {
      const ret = await deploy();

      testUtils.verifyBlockchainSnapshot(blockchain);

      expect(ret.asBoolean()).toBeTruthy();
      await expectItemBNEquals(ownerScriptHash, '3900000000000000');
      await expectItemBNEquals(totalSupply, '3900000000000000');
      await expectItemBNEquals(whitelistSaleBegin, '1518512400');
      await expectItemBNEquals(whitelistHardCap, '45000000');
      await expectItemBNEquals(preSaleBegin, '1518598800');
      await expectItemBNEquals(preSaleHardCap, '55000000');
      await expectItemBNEquals(mainSaleBegin, '1522486800');
      await expectItemBNEquals(mainSaleHardCap, '100000000');
      await expectItemBNEquals(maxNEOPerTransfer, '250');
    });

    it('should fail on multiple deploy', async () => {
      let ret = await deploy();
      expect(ret.asBoolean()).toBeTruthy();

      ret = await deploy();
      expect(ret.asBoolean()).toBeFalsy();

      testUtils.verifyBlockchainSnapshot(blockchain);
    });

    const mintTokensScript = new ScriptBuilder()
      .emitAppCall(conciergeContract.hash, 'mintTokens')
      .build();

    const neoTransaction = transactions.createInvocation({
      script: mintTokensScript,
      inputs: [
        new Input({
          hash: inputHash,
          index: 0,
        }),
      ],
      outputs: [
        new Output({
          address: senderAddress,
          value: neoBN('10'),
          asset: NEO_ASSET_HASH_UINT256,
        }),
        new Output({
          address: conciergeContract.hash,
          value: neoBN('10'),
          asset: NEO_ASSET_HASH_UINT256,
        }),
      ],
    });

    describe('mintTokens', () => {
      beforeEach(() => {
        mockBlockchain();
      });

      it('should fail without a sender', async () => {
        await deploy();

        const result = await executeSimple({
          blockchain,
          transaction: transactions.createInvocation({
            script: mintTokensScript,
          }),
        });

        expectFailure(result);
      });

      describe('should fail if current exchange rate is 0', () => {
        beforeEach(() => {
          mockBlockchain();
        });

        it('when whitelist sale period and not whitelisted', async () => {
          await deploy();

          const result = await executeSimple({
            blockchain,
            transaction: neoTransaction,
            persistingBlock: {
              timestamp: whitelistBeginTime + 1,
            },
          });

          expectFailure(result);
        });

        it('when whitelist sale period and not whitelisted real world', async () => {
          blockchain.output.get = jest.fn(() =>
            Promise.resolve(
              new Output({
                address: senderAddress,
                value: neoBN('1'),
                asset: NEO_ASSET_HASH_UINT256,
              }),
            ),
          );

          await deploy();
          await setParam('setWhitelistSaleBegin', '1518512370');
          await setParam('setPresaleBegin', '1518598770');

          const result = await executeSimple({
            blockchain,
            transaction: transactions.createInvocation({
              script: mintTokensScript,
              inputs: [
                new Input({
                  hash: inputHash,
                  index: 0,
                }),
              ],
              outputs: [
                new Output({
                  address: conciergeContract.hash,
                  asset: NEO_ASSET_HASH_UINT256,
                  value: neoBN('1'),
                }),
              ],
            }),
            persistingBlock: {
              timestamp: 1518597416,
            },
          });

          expectFailure(result);
        });

        it('when whitelist sale period and rate not set', async () => {
          await deploy();
          await addToWhitelist(senderAddress);

          const result = await executeSimple({
            blockchain,
            transaction: neoTransaction,
            persistingBlock: {
              timestamp: whitelistBeginTime + 1,
            },
          });

          expectFailure(result);
        });

        it('when pre sale sale period and rate not set', async () => {
          await deploy();

          const result = await executeSimple({
            blockchain,
            transaction: neoTransaction,
            persistingBlock: {
              timestamp: preSaleBeginTime + 1,
            },
          });

          expectFailure(result);
        });
      });

      it('should mint tokens during whitelist based on exchange rate', async () => {
        await deploy();
        await addToWhitelist(senderAddress);
        await setParam('setWhitelistSaleRate', '22');

        const result = await executeSimple({
          blockchain,
          transaction: neoTransaction,
          persistingBlock: {
            timestamp: whitelistBeginTime + 1,
          },
        });

        expectSuccess(result);
        await expectItemBNEquals(senderAddress, '22000000000');
      });

      it('should mint tokens during pre sale based on exchange rate with max tokens', async () => {
        await deploy();
        await setParam('setPresaleWeek1Rate', '10');
        await setParam('setMaxPurchase', '5');

        const result = await executeSimple({
          blockchain,
          transaction: neoTransaction,
          persistingBlock: {
            timestamp: preSaleBeginTime + 1,
          },
        });

        expectSuccess(result);
        await expectItemBNEquals(senderAddress, '5000000000');
      });

      it('should mint tokens during main sale based on exchange rate with total supply cap', async () => {
        await deploy();
        await setParam('setMainsaleWeek2Rate', '10');
        await setParam('setMaxPurchase', '10');
        await setParam('setMainsaleHardcap', '39000050');

        const result = await executeSimple({
          blockchain,
          transaction: neoTransaction,
          persistingBlock: {
            timestamp: mainSaleBeginTime + 1 + 7 * 24 * 3600,
          },
        });

        expectSuccess(result);
        await expectItemBNEquals(senderAddress, '5000000000');
      });
    });

    describe('transfer', () => {
      const receiverAddress = common.bufferToUInt160(Buffer.alloc(20, 4));

      const mintTokens = async () => {
        await deploy();
        await setParam('setPresaleWeek1Rate', '1000');
        await setParam('setMaxPurchase', '1000');

        const result = await executeSimple({
          blockchain,
          transaction: neoTransaction,
          persistingBlock: {
            timestamp: preSaleBeginTime + 1,
          },
        });

        checkResult(result);
      };

      const getSenderValue = async () => {
        const senderItem = await blockchain.storageItem.get({
          hash: conciergeContract.hash,
          key: senderAddress,
        });
        return utils.fromSignedBuffer(senderItem.value);
      };

      const testTransfer = ({
        count,
        success,
        gas,
      }: {|
        count: number,
        success: boolean,
        gas?: string,
      |}) => {
        it(`should ${success ? '' : 'not '}handle ${count} transfers${
          gas == null ? '' : ` with ${gas} gas`
        }`, async () => {
          await mintTokens();
          const value = new BN(10);
          const senderValue = await getSenderValue();

          const sb = new ScriptBuilder();
          _.range(count).forEach(idx => {
            sb.emitAppCall(
              conciergeContract.hash,
              'transfer',
              senderAddress,
              receiverAddress,
              value,
            );
            if (idx > 0) {
              sb.emitOp('AND');
            }
          });

          const result = await executeSimple({
            blockchain,
            transaction: transactions.createInvocation({
              script: sb.build(),
            }),
            gas: gas == null ? undefined : neoBN(gas),
          });

          if (success) {
            await expectSuccess(result);
            const expectedValue = value.mul(new BN(count));
            await expectItemBNEquals(
              senderAddress,
              senderValue.sub(expectedValue).toString(10),
            );
            await expectItemBNEquals(
              receiverAddress,
              expectedValue.toString(10),
            );
          } else {
            await expectThrow(result);
          }
        });
      };

      beforeEach(() => {
        mockBlockchain();
      });

      _.range(1, 4).forEach(count => testTransfer({ count, success: true }));
      _.range(4, 6).forEach(count => testTransfer({ count, success: false }));

      _.range(4, 8).forEach(count =>
        testTransfer({
          count,
          success: true,
          gas: '10',
        }),
      );
      _.range(8, 10).forEach(count =>
        testTransfer({
          count,
          success: false,
          gas: '10',
        }),
      );
    });
  });
});
