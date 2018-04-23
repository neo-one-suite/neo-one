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
  UInt160Attribute,
  UInt256Attribute,
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
import { assets, createBlockchain, testUtils, transactions } from '../__data__';

const monitor = DefaultMonitor.create({
  service: 'test',
});

const executeSimple = ({
  blockchain,
  transaction,
  gas,
  persistingBlock,
  skipWitnessVerify,
}: {|
  blockchain: $FlowFixMe,
  transaction: InvocationTransaction,
  gas?: BN,
  persistingBlock?: $FlowFixMe,
  skipWitnessVerify?: boolean,
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
    skipWitnessVerify: skipWitnessVerify == null ? true : skipWitnessVerify,
    persistingBlock,
  });

const neoBN = (value: string) =>
  new BN(value, 10).mul(utils.ONE_HUNDRED_MILLION);

describe('execute', () => {
  let blockchain: $FlowFixMe;

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

  const { conciergeContract } = transactions;

  const setConciergeParam = async (operation: string, value: string) =>
    executeSetupScript(
      new ScriptBuilder()
        .emitAppCall(conciergeContract.hash, operation, new BN(value, 10))
        .build(),
    );

  const expectItemBNEquals = async (
    hash: UInt160,
    key: Buffer | UInt160,
    value: string,
  ) => {
    const item = await blockchain.storageItem.get({
      hash,
      key,
    });
    testUtils.expectItemBNEquals(item, value);
  };

  const expectConciergeItemBNEquals = (key: Buffer | UInt160, value: string) =>
    expectItemBNEquals(conciergeContract.hash, key, value);

  const conciergeSenderAddress = common.bufferToUInt160(Buffer.alloc(20, 10));
  const mockConciergeMintOutput = () => {
    blockchain.output.get = jest.fn(() =>
      Promise.resolve(
        new Output({
          address: conciergeSenderAddress,
          value: neoBN('20'),
          asset: assets.NEO_ASSET_HASH_UINT256,
        }),
      ),
    );
  };

  const conciergeMintTokensScript = new ScriptBuilder()
    .emitAppCall(conciergeContract.hash, 'mintTokens')
    .build();
  const conciergeInputHash = common.bufferToUInt256(Buffer.alloc(32, 5));

  const conciergeNEOTransaction = transactions.createInvocation({
    script: conciergeMintTokensScript,
    inputs: [
      new Input({
        hash: conciergeInputHash,
        index: 0,
      }),
    ],
    outputs: [
      new Output({
        address: conciergeSenderAddress,
        value: neoBN('10'),
        asset: assets.NEO_ASSET_HASH_UINT256,
      }),
      new Output({
        address: conciergeContract.hash,
        value: neoBN('10'),
        asset: assets.NEO_ASSET_HASH_UINT256,
      }),
    ],
  });

  const conciergeWhitelistBeginTime = 1518512400;
  const conciergePreSaleBeginTime = 1518598800;
  const conciergeMainSaleBeginTime = 1522486800;

  const conciergeDeploy = () =>
    executeSetupScript(
      new ScriptBuilder().emitAppCall(conciergeContract.hash, 'deploy').build(),
    );

  describe('concierge', () => {
    const mockBlockchain = () => {
      blockchain = createBlockchain({
        contracts: [conciergeContract],
      });

      mockConciergeMintOutput();
    };

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

    beforeEach(() => {
      mockBlockchain();
    });

    const addToWhitelist = async (address: UInt160) =>
      executeSetupScript(
        new ScriptBuilder()
          .emitAppCall(conciergeContract.hash, 'addToWhitelist', address)
          .build(),
      );

    it('should add to storage in deploy', async () => {
      const ret = await conciergeDeploy();

      testUtils.verifyBlockchainSnapshot(blockchain);

      expect(ret.asBoolean()).toBeTruthy();
      await expectConciergeItemBNEquals(ownerScriptHash, '3900000000000000');
      await expectConciergeItemBNEquals(totalSupply, '3900000000000000');
      await expectConciergeItemBNEquals(whitelistSaleBegin, '1518512400');
      await expectConciergeItemBNEquals(whitelistHardCap, '45000000');
      await expectConciergeItemBNEquals(preSaleBegin, '1518598800');
      await expectConciergeItemBNEquals(preSaleHardCap, '55000000');
      await expectConciergeItemBNEquals(mainSaleBegin, '1522486800');
      await expectConciergeItemBNEquals(mainSaleHardCap, '100000000');
      await expectConciergeItemBNEquals(maxNEOPerTransfer, '250');
    });

    it('should fail on multiple deploy', async () => {
      let ret = await conciergeDeploy();
      expect(ret.asBoolean()).toBeTruthy();

      ret = await conciergeDeploy();
      expect(ret.asBoolean()).toBeFalsy();

      testUtils.verifyBlockchainSnapshot(blockchain);
    });

    describe('mintTokens', () => {
      beforeEach(() => {
        mockBlockchain();
      });

      it('should fail without a sender', async () => {
        await conciergeDeploy();

        const result = await executeSimple({
          blockchain,
          transaction: transactions.createInvocation({
            script: conciergeMintTokensScript,
          }),
        });

        expectFailure(result);
      });

      describe('should fail if current exchange rate is 0', () => {
        beforeEach(() => {
          mockBlockchain();
        });

        it('when whitelist sale period and not whitelisted', async () => {
          await conciergeDeploy();

          const result = await executeSimple({
            blockchain,
            transaction: conciergeNEOTransaction,
            persistingBlock: {
              timestamp: conciergeWhitelistBeginTime + 1,
            },
          });

          expectFailure(result);
        });

        it('when whitelist sale period and not whitelisted real world', async () => {
          blockchain.output.get = jest.fn(() =>
            Promise.resolve(
              new Output({
                address: conciergeSenderAddress,
                value: neoBN('1'),
                asset: assets.NEO_ASSET_HASH_UINT256,
              }),
            ),
          );

          await conciergeDeploy();
          await setConciergeParam('setWhitelistSaleBegin', '1518512370');
          await setConciergeParam('setPresaleBegin', '1518598770');

          const result = await executeSimple({
            blockchain,
            transaction: transactions.createInvocation({
              script: conciergeMintTokensScript,
              inputs: [
                new Input({
                  hash: conciergeInputHash,
                  index: 0,
                }),
              ],
              outputs: [
                new Output({
                  address: conciergeContract.hash,
                  asset: assets.NEO_ASSET_HASH_UINT256,
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
          await conciergeDeploy();
          await addToWhitelist(conciergeSenderAddress);

          const result = await executeSimple({
            blockchain,
            transaction: conciergeNEOTransaction,
            persistingBlock: {
              timestamp: conciergeWhitelistBeginTime + 1,
            },
          });

          expectFailure(result);
        });

        it('when pre sale sale period and rate not set', async () => {
          await conciergeDeploy();

          const result = await executeSimple({
            blockchain,
            transaction: conciergeNEOTransaction,
            persistingBlock: {
              timestamp: conciergePreSaleBeginTime + 1,
            },
          });

          expectFailure(result);
        });
      });

      it('should mint tokens during whitelist based on exchange rate', async () => {
        await conciergeDeploy();
        await addToWhitelist(conciergeSenderAddress);
        await setConciergeParam('setWhitelistSaleRate', '22');

        const result = await executeSimple({
          blockchain,
          transaction: conciergeNEOTransaction,
          persistingBlock: {
            timestamp: conciergeWhitelistBeginTime + 1,
          },
        });

        expectSuccess(result);
        await expectConciergeItemBNEquals(
          conciergeSenderAddress,
          '22000000000',
        );
      });

      it('should mint tokens during pre sale based on exchange rate with max tokens', async () => {
        await conciergeDeploy();
        await setConciergeParam('setPresaleWeek1Rate', '10');
        await setConciergeParam('setMaxPurchase', '5');

        const result = await executeSimple({
          blockchain,
          transaction: conciergeNEOTransaction,
          persistingBlock: {
            timestamp: conciergePreSaleBeginTime + 1,
          },
        });

        expectSuccess(result);
        await expectConciergeItemBNEquals(conciergeSenderAddress, '5000000000');
      });

      it('should mint tokens during main sale based on exchange rate with total supply cap', async () => {
        await conciergeDeploy();
        await setConciergeParam('setMainsaleWeek2Rate', '10');
        await setConciergeParam('setMaxPurchase', '10');
        await setConciergeParam('setMainsaleHardcap', '39000050');

        const result = await executeSimple({
          blockchain,
          transaction: conciergeNEOTransaction,
          persistingBlock: {
            timestamp: conciergeMainSaleBeginTime + 1 + 7 * 24 * 3600,
          },
        });

        expectSuccess(result);
        await expectConciergeItemBNEquals(conciergeSenderAddress, '5000000000');
      });
    });

    describe('transfer', () => {
      const receiverAddress = common.bufferToUInt160(Buffer.alloc(20, 4));

      const mintTokens = async () => {
        await conciergeDeploy();
        await setConciergeParam('setPresaleWeek1Rate', '1000');
        await setConciergeParam('setMaxPurchase', '1000');

        const result = await executeSimple({
          blockchain,
          transaction: conciergeNEOTransaction,
          persistingBlock: {
            timestamp: conciergePreSaleBeginTime + 1,
          },
        });

        checkResult(result);
      };

      const getSenderValue = async () => {
        const senderItem = await blockchain.storageItem.get({
          hash: conciergeContract.hash,
          key: conciergeSenderAddress,
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
              conciergeSenderAddress,
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
            await expectConciergeItemBNEquals(
              conciergeSenderAddress,
              senderValue.sub(expectedValue).toString(10),
            );
            await expectConciergeItemBNEquals(
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

  describe('switcheo', () => {
    const { switcheoContract } = transactions;
    const feeAddress = Buffer.alloc(20, 10);

    const switcheoInputHash = common.bufferToUInt256(Buffer.alloc(32, 6));

    const mockBlockchain = () => {
      blockchain = createBlockchain({
        contracts: [switcheoContract, conciergeContract],
      });

      blockchain.asset.get = assets.createGetAsset();

      blockchain.output.get = jest.fn(async ({ hash }) => {
        if (common.uInt256Equal(hash, switcheoInputHash)) {
          return new Output({
            address: switcheoContract.hash,
            value: new BN(1),
            asset: assets.GAS_ASSET_HASH_UINT256,
          });
        }

        return new Output({
          address: conciergeSenderAddress,
          value: neoBN('20'),
          asset: assets.NEO_ASSET_HASH_UINT256,
        });
      });
    };

    beforeEach(() => {
      mockBlockchain();
    });

    const deploy = async () => {
      await executeSetupScript(
        new ScriptBuilder()
          .emitAppCall(
            switcheoContract.hash,
            'initialize',
            utils.ZERO,
            utils.ZERO,
            feeAddress,
          )
          .build(),
      );

      await conciergeDeploy();
    };

    const whitelistConcierge = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(
              switcheoContract.hash,
              'addToWhitelist',
              conciergeContract.hash,
            )
            .build(),
        }),
      });

      expectSuccess(result);
    };

    const conciergeTokenAmount = '5000000000';
    const conciergeDepositAmount = '2500000000';
    const conciergeRemainingAmount = '2500000000';
    const mintConciergeTokens = async () => {
      await setConciergeParam('setPresaleWeek1Rate', '10');
      await setConciergeParam('setMaxPurchase', '5');

      const result = await executeSimple({
        blockchain,
        transaction: conciergeNEOTransaction,
        persistingBlock: {
          timestamp: conciergePreSaleBeginTime + 1,
        },
      });

      expectSuccess(result);
      await expectConciergeItemBNEquals(
        conciergeSenderAddress,
        conciergeTokenAmount,
      );
    };

    const depositConciergeTokens = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(
              switcheoContract.hash,
              'deposit',
              conciergeSenderAddress,
              conciergeContract.hash,
              new BN(conciergeDepositAmount, 10),
            )
            .build(),
        }),
      });

      expectSuccess(result);
    };

    const markWithdrawConciergeTokens = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(switcheoContract.hash, 'withdraw')
            .build(),
          attributes: [
            // Withdrawal Stage = Mark
            new UInt256Attribute({
              usage: 0xa1,
              value: common.bufferToUInt256(
                Buffer.concat([Buffer.from([0x50]), Buffer.alloc(31, 0)]),
              ),
            }),
            // Withdrawal address
            new UInt160Attribute({
              usage: 0x20,
              value: conciergeSenderAddress,
            }),
            // Withdrawal asset
            new UInt256Attribute({
              usage: 0xa2,
              value: common.bufferToUInt256(
                Buffer.concat([
                  common.uInt160ToBuffer(conciergeContract.hash),
                  Buffer.alloc(12, 0),
                ]),
              ),
            }),
          ],
        }),
      });

      expectSuccess(result);
    };

    const processWithdrawConciergeTokens = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitTailCall(switcheoContract.hash, 'withdraw')
            .build(),
          inputs: [
            new Input({
              hash: switcheoInputHash,
              index: 0,
            }),
          ],
          outputs: [
            new Output({
              address: switcheoContract.hash,
              value: new BN(1),
              asset: assets.GAS_ASSET_HASH_UINT256,
            }),
          ],
          attributes: [
            // Withdrawal Stage = Withdraw
            new UInt256Attribute({
              usage: 0xa1,
              value: common.bufferToUInt256(
                Buffer.concat([Buffer.from([0x51]), Buffer.alloc(31, 0)]),
              ),
            }),
            // Withdrawal address
            new UInt256Attribute({
              usage: 0xa4,
              value: common.bufferToUInt256(
                Buffer.concat([
                  common.uInt160ToBuffer(conciergeSenderAddress),
                  Buffer.alloc(12, 0),
                ]),
              ),
            }),
            // Withdrawal asset
            new UInt256Attribute({
              usage: 0xa2,
              value: common.bufferToUInt256(
                Buffer.concat([
                  common.uInt160ToBuffer(conciergeContract.hash),
                  Buffer.alloc(12, 0),
                ]),
              ),
            }),
          ],
        }),
        skipWitnessVerify: false,
      });

      expectSuccess(result);
    };

    describe('withdraw', () => {
      it('should allow NEP5 withdrawals', async () => {
        await deploy();
        await mintConciergeTokens();
        await whitelistConcierge();
        await depositConciergeTokens();
        await expectConciergeItemBNEquals(
          conciergeSenderAddress,
          conciergeRemainingAmount,
        );

        await markWithdrawConciergeTokens();
        await processWithdrawConciergeTokens();
        await expectConciergeItemBNEquals(
          conciergeSenderAddress,
          conciergeTokenAmount,
        );
      });
    });
  });
});
