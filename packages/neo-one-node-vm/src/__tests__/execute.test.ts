// tslint:disable no-any no-let no-object-mutation no-empty
import { common, crypto, ScriptBuilder, UInt160, UInt256, utils, VMState } from '@neo-one/client-common';
import {
  ArrayContractParameter,
  ByteArrayContractParameter,
  ExecuteScriptsResult,
  Input,
  InvocationTransaction,
  NULL_ACTION,
  Output,
  ScriptContainerType,
  TriggerType,
  UInt160Attribute,
  UInt256Attribute,
  VMListeners,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { assets, createBlockchain, factory, testUtils, transactions } from '../__data__';
import { execute } from '../execute';

let listeners: VMListeners;

const executeSimple = async ({
  blockchain,
  transaction,
  gas = utils.ZERO,
  persistingBlock,
  skipWitnessVerify,
}: {
  readonly blockchain: any;
  readonly transaction: InvocationTransaction;
  readonly gas?: BN;
  readonly persistingBlock?: any;
  readonly skipWitnessVerify?: boolean;
}) =>
  execute({
    scripts: [{ code: transaction.script }],
    blockchain,
    scriptContainer: {
      type: ScriptContainerType.Transaction,
      value: transaction,
    },

    triggerType: TriggerType.Application,
    action: NULL_ACTION,
    gas,
    skipWitnessVerify: skipWitnessVerify === undefined ? true : skipWitnessVerify,
    persistingBlock,
    listeners,
  });

const neoBN = (value: string) => new BN(value, 10).mul(utils.ONE_HUNDRED_MILLION);

describe('execute', () => {
  let blockchain: any;

  const expectFailure = (result: ExecuteScriptsResult) => {
    expect(result.errorMessage).toBeUndefined();
    expect(result.state).toEqual(VMState.HALT);
    expect(result.stack.length).toEqual(1);
    expect(result.stack[0].asBoolean()).toBeFalsy();
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
  };

  const expectThrow = (result: ExecuteScriptsResult) => {
    expect(result.errorMessage).toBeDefined();
    if (result.errorMessage !== undefined) {
      expect(result.errorMessage.split('\n')[0]).toMatchSnapshot();
    }
    expect(result.state).toEqual(VMState.FAULT);
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
  };

  const expectSuccess = (result: ExecuteScriptsResult) => {
    expect(result.errorMessage).toBeUndefined();
    expect(result.state).toEqual(VMState.HALT);
    expect(result.stack.length).toEqual(1);
    expect(result.stack[0].asBoolean()).toBeTruthy();
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
  };

  const checkResult = (result: ExecuteScriptsResult) => {
    if (result.errorMessage !== undefined) {
      throw new Error(result.errorMessage);
    }

    if (result.state !== VMState.HALT) {
      throw new Error(`Ended in ${result.state}`);
    }

    return result.stack[0];
  };

  const executeSetupScript = async (script: Buffer, gas = utils.ZERO) => {
    const result = await executeSimple({
      blockchain,
      transaction: transactions.createInvocation({ script }),
      gas,
    });

    return checkResult(result);
  };

  beforeEach(() => {
    blockchain = {
      contract: {},
      settings: {
        vm: {},
      },

      storageItem: {},
      action: {},
      output: {},
      currentBlock: {},
    } as any;

    listeners = {
      onNotify: jest.fn(() => {}),
      onLog: jest.fn(() => {}),
      onMigrateContract: jest.fn(() => {}),
      onSetVotes: jest.fn(() => {}),
    };
  });

  const testKYC = (name: string, gas: BN, state: number) => {
    test(name, async () => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve(transactions.kycContract));

      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(20, 0) }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(20, 0) }));

      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
      blockchain.action.add = jest.fn(async () => Promise.resolve());

      const result = await executeSimple({
        blockchain,
        transaction: transactions.kycTransaction,
        gas,
      });

      if (state === VMState.FAULT) {
        const { errorMessage } = result;
        expect(errorMessage).toBeDefined();
        if (errorMessage !== undefined) {
          expect(errorMessage.split('\n')[0]).toMatchSnapshot();
        }
      } else {
        expect(result.errorMessage).toBeUndefined();
      }
      expect(result.state).toEqual(state);
      expect(result.gasConsumed.toString(10)).toMatchSnapshot();
      testUtils.verifyBlockchainSnapshot(blockchain);
      testUtils.verifyListeners(listeners);
    });
  };

  testKYC('should fail kyc transaction with insufficient gas', utils.ZERO, VMState.FAULT);

  testKYC('should not fail kyc transaction with sufficient gas', common.ONE_HUNDRED_MILLION_FIXED8, VMState.HALT);

  test('should refund on mintTokens with insufficient presale', async () => {
    blockchain.contract.get = jest.fn(async () => Promise.resolve(transactions.kycContract));

    blockchain.storageItem.tryGet = jest.fn(async (item) => {
      if (item.key.toString('utf8') === 'sale_paused') {
        return Promise.resolve({ value: Buffer.alloc(1, 0) });
      }
      if (item.key.toString('utf8').startsWith('kyc_ok')) {
        return Promise.resolve({ value: Buffer.alloc(1, 1) });
      }

      return Promise.resolve({ value: Buffer.alloc(20, 0) });
    });
    blockchain.storageItem.get = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(20, 0) }));

    blockchain.output.get = jest.fn(async () =>
      Promise.resolve(
        new Output({
          asset: common.stringToUInt256(common.NEO_ASSET_HASH),
          value: new BN(204).mul(utils.ONE_HUNDRED_MILLION),
          address: transactions.mintTransaction.outputs[1].address,
        }),
      ),
    );

    blockchain.action.add = jest.fn(async () => Promise.resolve());
    blockchain.currentBlock.index = 1920286;

    const result = await executeSimple({
      blockchain,
      transaction: transactions.mintTransaction,
    });

    expect(result.errorMessage).toBeUndefined();
    expect(result.state).toEqual(VMState.HALT);
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
    testUtils.verifyListeners(listeners);
  });

  const { conciergeContract } = transactions;

  const setConciergeParam = async (operation: string, value: string) =>
    executeSetupScript(new ScriptBuilder().emitAppCall(conciergeContract.hash, operation, new BN(value, 10)).build());

  const expectItemBNEquals = async (hash: UInt160, key: Buffer | UInt160, value: string) => {
    const item = await blockchain.storageItem.get({
      hash,
      key,
    });

    testUtils.expectItemBNEquals(item, value);
  };

  const expectConciergeItemBNEquals = async (key: Buffer | UInt160, value: string) =>
    expectItemBNEquals(conciergeContract.hash, key, value);

  const conciergeSenderAddress = common.bufferToUInt160(Buffer.alloc(20, 10));
  const mockConciergeMintOutput = () => {
    blockchain.output.get = jest.fn(async () =>
      Promise.resolve(
        new Output({
          address: conciergeSenderAddress,
          value: neoBN('20'),
          asset: assets.NEO_ASSET_HASH_UINT256,
        }),
      ),
    );
  };

  const conciergeMintTokensScript = new ScriptBuilder().emitAppCall(conciergeContract.hash, 'mintTokens').build();
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

  const conciergeDeploy = async () =>
    executeSetupScript(new ScriptBuilder().emitAppCall(conciergeContract.hash, 'deploy').build());

  describe('concierge', () => {
    const mockBlockchain = () => {
      blockchain = createBlockchain({
        contracts: [conciergeContract],
      });

      mockConciergeMintOutput();
    };

    const ownerScriptHash = common.stringToUInt160('0x78bad2350ef3403faba2a1b5fc5415ebd88e0946');

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
      executeSetupScript(new ScriptBuilder().emitAppCall(conciergeContract.hash, 'addToWhitelist', address).build());

    test('should add to storage in deploy', async () => {
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
      testUtils.verifyListeners(listeners);
    });

    test('should fail on multiple deploy', async () => {
      let ret = await conciergeDeploy();
      expect(ret.asBoolean()).toBeTruthy();

      ret = await conciergeDeploy();
      expect(ret.asBoolean()).toBeFalsy();

      testUtils.verifyBlockchainSnapshot(blockchain);
      testUtils.verifyListeners(listeners);
    });

    describe('mintTokens', () => {
      beforeEach(() => {
        mockBlockchain();
      });

      test('should fail without a sender', async () => {
        await conciergeDeploy();

        const result = await executeSimple({
          blockchain,
          transaction: transactions.createInvocation({
            script: conciergeMintTokensScript,
          }),
        });

        expectFailure(result);
        testUtils.verifyListeners(listeners);
      });

      describe('should fail if current exchange rate is 0', () => {
        beforeEach(() => {
          mockBlockchain();
        });

        test('when whitelist sale period and not whitelisted', async () => {
          await conciergeDeploy();

          const result = await executeSimple({
            blockchain,
            transaction: conciergeNEOTransaction,
            persistingBlock: {
              timestamp: conciergeWhitelistBeginTime + 1,
            },
          });

          expectFailure(result);
          testUtils.verifyListeners(listeners);
        });

        test('when whitelist sale period and not whitelisted real world', async () => {
          blockchain.output.get = jest.fn(async () =>
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
          testUtils.verifyListeners(listeners);
        });

        test('when whitelist sale period and rate not set', async () => {
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
          testUtils.verifyListeners(listeners);
        });

        test('when pre sale sale period and rate not set', async () => {
          await conciergeDeploy();

          const result = await executeSimple({
            blockchain,
            transaction: conciergeNEOTransaction,
            persistingBlock: {
              timestamp: conciergePreSaleBeginTime + 1,
            },
          });

          expectFailure(result);
          testUtils.verifyListeners(listeners);
        });
      });

      test('should mint tokens during whitelist based on exchange rate', async () => {
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
        await expectConciergeItemBNEquals(conciergeSenderAddress, '22000000000');

        testUtils.verifyListeners(listeners);
      });

      test('should mint tokens during pre sale based on exchange rate with max tokens', async () => {
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
        testUtils.verifyListeners(listeners);
      });

      test('should mint tokens during main sale based on exchange rate with total supply cap', async () => {
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
        testUtils.verifyListeners(listeners);
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
        testUtils.verifyListeners(listeners);
      };

      const getSenderValue = async () => {
        const senderItem = await blockchain.storageItem.get({
          hash: conciergeContract.hash,
          key: conciergeSenderAddress,
        });

        return utils.fromSignedBuffer(senderItem.value);
      };

      const testTransfer = ({ count, success, gas }: { count: number; success: boolean; gas?: string }) => {
        test(`should ${success ? '' : 'not '}handle ${count} transfers${
          gas === undefined ? '' : ` with ${gas} gas`
        }`, async () => {
          await mintTokens();
          const value = new BN(10);
          const senderValue = await getSenderValue();

          const sb = new ScriptBuilder();
          _.range(count).forEach((idx) => {
            sb.emitAppCall(conciergeContract.hash, 'transfer', conciergeSenderAddress, receiverAddress, value);

            if (idx > 0) {
              sb.emitOp('AND');
            }
          });

          const result = await executeSimple({
            blockchain,
            transaction: transactions.createInvocation({
              script: sb.build(),
            }),

            gas: gas === undefined ? undefined : neoBN(gas),
          });

          if (success) {
            expectSuccess(result);
            const expectedValue = value.mul(new BN(count));
            await expectConciergeItemBNEquals(conciergeSenderAddress, senderValue.sub(expectedValue).toString(10));

            await expectConciergeItemBNEquals(receiverAddress, expectedValue.toString(10));
          } else {
            expectThrow(result);
          }
          testUtils.verifyListeners(listeners);
        });
      };

      beforeEach(() => {
        mockBlockchain();
      });

      test('should add malformed address to storage', async () => {
        await mintTokens();
        const value = new BN(10);

        const result = await executeSimple({
          blockchain,
          transaction: transactions.createInvocation({
            script: new ScriptBuilder()
              .emitAppCall(
                conciergeContract.hash,
                'transfer',
                conciergeSenderAddress,
                new ScriptBuilder()
                  .emit(
                    Buffer.from(
                      '4164636f57696a714c756a4a4a626b69344776696a5a5053726d37534a6b5551394d2020e4bda0e79a845549443a204a5953364e41',
                      'hex',
                    ),
                  )
                  .build(),
                value,
              )
              .build(),
          }),
        });

        expectSuccess(result);
      });

      _.range(1, 4).forEach((count) => testTransfer({ count, success: true }));
      _.range(4, 6).forEach((count) => testTransfer({ count, success: false }));

      _.range(4, 8).forEach((count) =>
        testTransfer({
          count,
          success: true,
          gas: '10',
        }),
      );

      _.range(8, 10).forEach((count) =>
        testTransfer({
          count,
          success: false,
          gas: '10',
        }),
      );
    });
  });

  const { switcheoTokenContract } = transactions;

  const expectSwitcheoItemBNEquals = async (key: Buffer | UInt160, value: string) =>
    expectItemBNEquals(switcheoTokenContract.hash, key, value);

  const switcheoTokenSenderAddress = common.bufferToUInt160(Buffer.alloc(20, 7));

  const switcheoMintTokensScript = new ScriptBuilder().emitAppCall(switcheoTokenContract.hash, 'mintTokens').build();
  const switcheoTokenInputHash = common.bufferToUInt256(Buffer.alloc(32, 7));

  const switcheoNEOTransaction = transactions.createInvocation({
    script: switcheoMintTokensScript,
    inputs: [
      new Input({
        hash: switcheoTokenInputHash,
        index: 0,
      }),
    ],

    outputs: [
      new Output({
        address: switcheoTokenSenderAddress,
        value: neoBN('10'),
        asset: assets.NEO_ASSET_HASH_UINT256,
      }),

      new Output({
        address: switcheoTokenContract.hash,
        value: neoBN('10'),
        asset: assets.NEO_ASSET_HASH_UINT256,
      }),
    ],
  });

  const switcheoDeploy = async () => {
    await executeSetupScript(new ScriptBuilder().emitAppCall(switcheoTokenContract.hash, 'deploy').build());

    await executeSetupScript(new ScriptBuilder().emitAppCall(switcheoTokenContract.hash, 'enableTransfers').build());
  };

  describe('switcheo', () => {
    const { switcheoContract } = transactions;
    const feeAddress = Buffer.alloc(20, 10);

    const switcheoInputHash = common.bufferToUInt256(Buffer.alloc(32, 6));

    const mockBlockchain = () => {
      blockchain = createBlockchain({
        contracts: [switcheoContract, conciergeContract, switcheoTokenContract],
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

        if (common.uInt256Equal(hash, switcheoTokenInputHash)) {
          return new Output({
            address: switcheoTokenSenderAddress,
            value: neoBN('20'),
            asset: assets.NEO_ASSET_HASH_UINT256,
          });
        }

        if (common.uInt256Equal(hash, conciergeInputHash)) {
          return new Output({
            address: conciergeSenderAddress,
            value: neoBN('20'),
            asset: assets.NEO_ASSET_HASH_UINT256,
          });
        }

        throw new Error('Unknown input');
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
            utils.TWO, // Taker fee
            utils.TWO, // Maker fee
            feeAddress,
          )
          .build(),
      );

      await conciergeDeploy();
      await switcheoDeploy();
    };

    const whitelist = async (hash: UInt160) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(switcheoContract.hash, 'addToWhitelist', hash).build(),
        }),
      });

      expectSuccess(result);
    };

    const whitelistConcierge = async () => whitelist(conciergeContract.hash);
    const whitelistSwitcheo = async () => whitelist(switcheoTokenContract.hash);

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
      await expectConciergeItemBNEquals(conciergeSenderAddress, conciergeTokenAmount);
    };

    const switcheoTokenAmount = '5000000000';
    const switcheoDepositAmount = '2500000000';
    const switcheoRemainingAmount = '2500000000';
    const mintSwitcheoTokens = async () => {
      const configResult = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(
              switcheoTokenContract.hash,
              'setSaleConfig',
              new BN(conciergePreSaleBeginTime),
              new BN('500000000', 10),
              new BN('500000000', 10),
            )
            .build(),
        }),
      });

      expectSuccess(configResult);

      const whitelistResult = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(switcheoTokenContract.hash, 'addToWhitelist', switcheoTokenSenderAddress, '1')
            .build(),
        }),
      });

      expectSuccess(whitelistResult);

      const result = await executeSimple({
        blockchain,
        transaction: switcheoNEOTransaction,
        persistingBlock: {
          timestamp: conciergePreSaleBeginTime + 1,
        },
      });

      expectSuccess(result);
      await expectSwitcheoItemBNEquals(switcheoTokenSenderAddress, switcheoTokenAmount);
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

    const depositSwitcheoTokens = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(
              switcheoContract.hash,
              'deposit',
              switcheoTokenSenderAddress,
              switcheoTokenContract.hash,
              new BN(switcheoDepositAmount, 10),
            )
            .build(),
        }),
      });

      expectSuccess(result);
    };

    const markWithdrawTokens = async (withdrawAddress: UInt160, asset: UInt160) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(switcheoContract.hash, 'withdraw').build(),
          attributes: [
            // Withdrawal Stage = Mark
            new UInt256Attribute({
              usage: 0xa1,
              value: common.bufferToUInt256(Buffer.concat([Buffer.from([0x50]), Buffer.alloc(31, 0)])),
            }),

            // Withdrawal address
            new UInt160Attribute({
              usage: 0x20,
              value: withdrawAddress,
            }),

            // Withdrawal asset
            new UInt256Attribute({
              usage: 0xa2,
              value: common.bufferToUInt256(Buffer.concat([common.uInt160ToBuffer(asset), Buffer.alloc(12, 0)])),
            }),
          ],
        }),
      });

      expectSuccess(result);
    };

    const markWithdrawConciergeTokens = async (address: UInt160) => markWithdrawTokens(address, conciergeContract.hash);
    const markWithdrawSwitcheoTokens = async (address: UInt160) =>
      markWithdrawTokens(address, switcheoTokenContract.hash);

    const processWithdrawTokens = async (address: UInt160, asset: UInt160) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitTailCall(switcheoContract.hash, 'withdraw').build(),
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
              value: common.bufferToUInt256(Buffer.concat([Buffer.from([0x51]), Buffer.alloc(31, 0)])),
            }),

            // Withdrawal address
            new UInt256Attribute({
              usage: 0xa4,
              value: common.bufferToUInt256(Buffer.concat([common.uInt160ToBuffer(address), Buffer.alloc(12, 0)])),
            }),

            // Withdrawal asset
            new UInt256Attribute({
              usage: 0xa2,
              value: common.bufferToUInt256(Buffer.concat([common.uInt160ToBuffer(asset), Buffer.alloc(12, 0)])),
            }),
          ],
        }),

        skipWitnessVerify: false,
      });

      expectSuccess(result);
    };

    const processWithdrawConciergeTokens = async (address: UInt160) =>
      processWithdrawTokens(address, conciergeContract.hash);
    const processWithdrawSwitcheoTokens = async (address: UInt160) =>
      processWithdrawTokens(address, switcheoTokenContract.hash);

    const offerHash = crypto.hash256(
      Buffer.concat([
        common.uInt160ToBuffer(switcheoTokenSenderAddress),
        switcheoTokenContract.hash,
        conciergeContract.hash,
        utils.toSignedBuffer(new BN(switcheoDepositAmount, 10)),
        utils.toSignedBuffer(new BN(conciergeDepositAmount, 10)),
        utils.toSignedBuffer(new BN(10)),
      ]),
    );

    const offerSwitcheoTokens = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(
              switcheoContract.hash,
              'makeOffer',
              switcheoTokenSenderAddress,
              switcheoTokenContract.hash,
              new BN(switcheoDepositAmount, 10),
              conciergeContract.hash,
              new BN(conciergeDepositAmount, 10),
              new BN(10),
            )
            .build(),
        }),
      });

      expectSuccess(result);
    };
    const fillSwitcheoTokens = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(
              switcheoContract.hash,
              'fillOffer',
              conciergeSenderAddress,
              Buffer.concat([switcheoTokenContract.hash, conciergeContract.hash]),

              offerHash,
              new BN(conciergeDepositAmount, 10),
              true,
            )
            .build(),
        }),
      });

      expectSuccess(result);
    };

    describe('withdraw', () => {
      test('should allow NEP5 Concierge withdrawals', async () => {
        await deploy();
        await mintConciergeTokens();
        await whitelistConcierge();
        await depositConciergeTokens();
        await expectConciergeItemBNEquals(conciergeSenderAddress, conciergeRemainingAmount);

        await markWithdrawConciergeTokens(conciergeSenderAddress);
        await processWithdrawConciergeTokens(conciergeSenderAddress);
        await expectConciergeItemBNEquals(conciergeSenderAddress, conciergeTokenAmount);

        testUtils.verifyListeners(listeners);
      });

      test('should allow NEP5 Switcheo withdrawals', async () => {
        await deploy();
        await mintSwitcheoTokens();
        await whitelistSwitcheo();
        await depositSwitcheoTokens();
        await expectSwitcheoItemBNEquals(switcheoTokenSenderAddress, switcheoRemainingAmount);

        await markWithdrawSwitcheoTokens(switcheoTokenSenderAddress);
        await processWithdrawSwitcheoTokens(switcheoTokenSenderAddress);
        await expectSwitcheoItemBNEquals(switcheoTokenSenderAddress, switcheoTokenAmount);

        testUtils.verifyListeners(listeners);
      });

      test('should allow withdrawing filled orders', async () => {
        await deploy();

        await whitelistConcierge();
        await mintConciergeTokens();
        await depositConciergeTokens();
        await expectConciergeItemBNEquals(conciergeSenderAddress, conciergeRemainingAmount);

        await whitelistSwitcheo();
        await mintSwitcheoTokens();
        await depositSwitcheoTokens();
        await expectSwitcheoItemBNEquals(switcheoTokenSenderAddress, switcheoRemainingAmount);

        await offerSwitcheoTokens();
        await fillSwitcheoTokens();

        await markWithdrawConciergeTokens(switcheoTokenSenderAddress);
        await processWithdrawConciergeTokens(switcheoTokenSenderAddress);
        await expectConciergeItemBNEquals(switcheoTokenSenderAddress, '2499995000');

        await markWithdrawSwitcheoTokens(conciergeSenderAddress);
        await processWithdrawSwitcheoTokens(conciergeSenderAddress);
        await expectSwitcheoItemBNEquals(conciergeSenderAddress, switcheoDepositAmount);

        testUtils.verifyListeners(listeners);
      });
    });
  });

  describe('narrative token', () => {
    const { narrativeTokenContract } = transactions;

    const narrativeTokenCrowdsaleRegister = async (bytes: Buffer, fail?: boolean) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(narrativeTokenContract.hash, 'crowdsale_register', new ScriptBuilder().emit(bytes).build())
            .build(),
        }),
      });

      if (fail) {
        expectThrow(result);
      } else {
        expectSuccess(result);
      }
    };

    const narrativeTokenCrowdsaleDeregister = async (bytes: Buffer) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(narrativeTokenContract.hash, 'crowdsale_deregister', new ScriptBuilder().emit(bytes).build())
            .build(),
        }),
      });

      expectSuccess(result);
    };

    const mockBlockchain = () => {
      blockchain = createBlockchain({
        contracts: [narrativeTokenContract],
      });
    };

    const deploy = async () =>
      executeSetupScript(new ScriptBuilder().emitAppCall(narrativeTokenContract.hash, 'deploy').build());

    beforeEach(() => {
      mockBlockchain();
    });

    test('crowdsale register - fails at free GAS limit for bulk addresses', async () => {
      const ret = await deploy();
      expect(ret.asBoolean()).toBeTruthy();

      await narrativeTokenCrowdsaleRegister(Buffer.from('23ba2703c53263e8d6e522dc32203339dcd8eee9', 'hex'));
      await narrativeTokenCrowdsaleRegister(
        Buffer.from(
          '5c2721a33bf665880fb2c1c0d504d92dcfe1616f03a8b007549dd4d19f367d6b71ed5c6fe9aa827298d3602f1e4f5ba179481398e55593862a0df92c62b9d04e2d8b2a989d72c3c9478c18f2ef714cf2c2c1bac70b182dbf8434323013c72d66c57591d849b197c38b07107c7ac4097ba47c1c9c39a04409dbfae7df8d49ad1319079604318ba12252ace7f1ace575f6847bc025bb30d752d73892bbb875e8d2baa6caaaf1b6efeb33744ace65f19fad05b26e12c1e347ae7770a182a4934e47332bebbd4cc848692cf5480980a6d99833e84fece90e31b196cbfe775ea2beb13b95ed41179becfb21dffcfbc3696d56dd270aa03397e5831c6b21f3542bfec1bf48fdafc51b2a9364f1d85268737eb7421911f6f581744475ab2bec031da981f65df6372f0a9dabcc4d5a174cadc544894ee83981fc66021d33025579f4eec82b96c64588ff0def56e0b0304f584f0acfa9632d6a3d3c88d3689b06954f57bcc860e78de1713d98982fb2a042a9b9a973435b5d49ddaca01d707ae0287bc0f0c2cceeb41a15131c5f98a6b690ca6c57366d229bd2b2f266b5b240f2057f50eb43f41945d84f65776cc194dd408e2cbb12a665cd2b9502b576cd518f09f9eddec27374fe8c9978db7d50a8144bb7dd13f517e8f0e1b4f90b20918f605fbcbfd6afa86a36b7555bfb9910128651af954dfa3a7de539949b4c0c4d28b55ac089e85cd8ec118f8ea34e2a7045b5d17a344b63f2dde9bef9a3ae624320d73875dff29fd7a4779f6dca2417e6f8c7f6b62d7f8ee2d22a87228f0c8b456fb43dc9fdb04793044493e9403daefed173a9e5a82acdfb7f40c4845419d360c06efe559805a52f4c554ff5d8de17ba8a28d815cbb32e904328d57179ef7282d5e33b546ee6',
          'hex',
        ),
        true,
      );

      testUtils.verifyListeners(listeners);
    });

    test('crowdsale deregister - does not log delete for nonexistent address', async () => {
      const ret = await deploy();
      expect(ret.asBoolean()).toBeTruthy();

      await narrativeTokenCrowdsaleRegister(Buffer.from('23ba2703c53263e8d6e522dc32203339dcd8eee9', 'hex'));
      await narrativeTokenCrowdsaleDeregister(Buffer.from('23ba2703c53263e8d6e522dc32203339dcd8eee9', 'hex'));
      await narrativeTokenCrowdsaleDeregister(Buffer.from('dbfae7df8d49ad1319079604318ba12252ace7f1', 'hex'));

      testUtils.verifyListeners(listeners);
    });
  });

  describe('Wowbit token', () => {
    const { wowbitTokenContract } = transactions;

    const mockBlockchain = () => {
      blockchain = createBlockchain({
        contracts: [wowbitTokenContract],
      });
    };

    const deploy = async () =>
      executeSetupScript(
        new ScriptBuilder().emitAppCall(wowbitTokenContract.hash, 'deploy').build(),
        common.ONE_THOUSAND_FIXED8,
      );

    beforeEach(() => {
      mockBlockchain();
    });

    test('deploy - negative buffer conversion works properly', async () => {
      const ret = await deploy();
      expect(ret.asBoolean()).toBeTruthy();

      testUtils.verifyBlockchainSnapshot(blockchain);
      testUtils.verifyListeners(listeners);
    });
  });

  describe('Mystery invoke', () => {
    const { mysteryScript } = transactions;

    const mockBlockchain = () => {
      blockchain = createBlockchain({ contracts: [] });

      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(undefined));
      blockchain.contract.add = jest.fn(async () => Promise.resolve());
    };

    const deploy = async () =>
      executeSetupScript(new ScriptBuilder().emit(mysteryScript).build(), common.ONE_THOUSAND_FIXED8);

    beforeEach(() => {
      mockBlockchain();
    });

    test('deploy - invalid contract paramter ignored', async () => {
      const ret = await deploy();
      expect(ret).toBeTruthy();

      testUtils.verifyBlockchainSnapshot(blockchain);
      testUtils.verifyListeners(listeners);
    });
  });

  describe('Aphelion exchange', () => {
    const { aphelionExchangeContract } = transactions;

    const mockBlockchain = () => {
      blockchain = createBlockchain({ contracts: [aphelionExchangeContract] });
    };

    const deploy = async () =>
      executeSetupScript(
        new ScriptBuilder().emitAppCall(aphelionExchangeContract.hash, 'deploy').build(),
        common.ONE_THOUSAND_FIXED8,
      );

    const setManager = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emit(
              Buffer.from(
                '141a1af8a9f46ebcaa47f3b2f967dd7bf606d8931651c10a7365744d616e6167657267cbf29df42fb950a4456787ec4ebf2076795f8948',
                'hex',
              ),
            )
            .build(),
        }),
      });

      expectSuccess(result);
    };

    beforeEach(() => {
      mockBlockchain();
    });

    test('deploy + set manager - CALL_I opcode', async () => {
      await deploy();
      await setManager();

      testUtils.verifyBlockchainSnapshot(blockchain);
      testUtils.verifyListeners(listeners);
    });
  });

  describe('Bridge Protocol', () => {
    const { bridgeProtocolTokenContract, bridgeProtocolKeyServer } = transactions;

    const mockBlockchain = () => {
      blockchain = createBlockchain({ contracts: [bridgeProtocolTokenContract, bridgeProtocolKeyServer] });
    };

    const deployToken = async () =>
      executeSetupScript(
        new ScriptBuilder().emitAppCall(bridgeProtocolTokenContract.hash, 'deploy').build(),
        common.ONE_THOUSAND_FIXED8,
      );

    // https://neotracker.io/tx/f0531b93b1771ad093774d4aea423b838d513b1c823f44ad686582a543ce8317
    const deployKeyServer = async () =>
      executeSetupScript(
        new ScriptBuilder()
          .emit(Buffer.from('025b5d04696e697467f8b65f752e5c0eb9d8b19d7f7198db03ef5fb4a4', 'hex'))
          .build(),
        common.ONE_THOUSAND_FIXED8,
      );

    const publish = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emit(
              Buffer.from(
                '14aefaa22d12d1222db572901ba81478da2803bb2b4d8f022d2d2d2d2d424547494e20504750205055424c4943204b455920424c4f434b2d2d2d2d2d0d0a56657273696f6e3a204f70656e5047502e6a732076332e312e300d0a436f6d6d656e743a2068747470733a2f2f6f70656e7067706a732e6f72670d0a0d0a786a4d45572f6c343252594a4b775942424148615277384241516441356c6e326d70414150374864645834506c54774f51425658305a475942542b720a6636784757624c786833504e4b454a796157526e5a53425159584e7a634739796443413859573576626b4269636d6c6b5a32567759584e7a634739790a64433570627a37436477515146676f414b515543572f6c343251594c435163494177494a454b6755654e6f6f413773724242554943674944466749420a41686b4241687344416834424141414148674541727962314574726c53315870587558636c595568506b44345055516c7835587a6c3070354e526e740a735334412f693230434d57346e67312b42762f5548316266496247355871736742666e4e4c4a6a744f584e74413355507a6a6745572f6c343252494b0a4b7759424241475856514546415145485142545944733873494d2b5669446a52336567325065746646715962632f564a536535575a316b4b677234530a4177454942384a68424267574341415442514a622b586a5a4352436f46486a614b414f374b77496244414141457145412f3342596f5a5641666b31380a704f4d556f612f5a446e32476e4a5447312f4f456c684b4a4558553543614944415039315032373557527a686d77364a337a6a55753279652f5777510a5950492f414e434841532f766c344c6443413d3d0d0a3d336f514b0d0a2d2d2d2d2d454e4420504750205055424c4943204b455920424c4f434b2d2d2d2d2d0d0a0d0a14aefaa22d12d1222db572901ba81478da2803bb2b14a1502468141d9b6832da9d2e455bde41779faea554c1077075626c69736867f8b65f752e5c0eb9d8b19d7f7198db03ef5fb4a4',
                'hex',
              ),
            )
            .build(),
        }),
      });

      expectSuccess(result);
    };

    beforeEach(() => {
      mockBlockchain();
    });

    test('publish', async () => {
      const retToken = await deployToken();
      expect(retToken.asBoolean()).toBeTruthy();
      const retKeyServer = await deployKeyServer();
      expect(retKeyServer.asBoolean()).toBeTruthy();

      await publish();

      testUtils.verifyListeners(listeners);
    });
  });

  describe('NEX Token', () => {
    const { nexTokenContract } = transactions;

    const mockBlockchain = () => {
      blockchain = createBlockchain({ contracts: [nexTokenContract] });
    };

    const initializeOwners = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emit(
              Buffer.from('025b5d10696e697469616c697a654f776e657273672911176a2e804903ac8a39447c6e084736cd4a3a', 'hex'),
            )
            .build(),
        }),
        gas: common.ONE_HUNDRED_FIXED8,
      });

      expectSuccess(result);
    };

    const deploy = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emit(Buffer.from('025b5d066465706c6f79672911176a2e804903ac8a39447c6e084736cd4a3a', 'hex'))
            .build(),
        }),
      });

      expectSuccess(result);
    };

    const ownerMint = async (owner: string) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(nexTokenContract.hash, 'ownerMint', Buffer.from(owner)).build(),
        }),
      });

      expectSuccess(result);
    };

    const getOwners = async () => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(nexTokenContract.hash, 'getOwners').build(),
        }),
      });

      return ((result.stack[0] as ArrayContractParameter).value as ReadonlyArray<
        ByteArrayContractParameter
      >).map(({ value }) => common.asUInt160(value));
    };

    const transfer = async (from: UInt160, to: UInt160, amount: BN) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(nexTokenContract.hash, 'transfer', from, to, amount).build(),
        }),
      });

      expectSuccess(result);
    };

    beforeEach(() => {
      mockBlockchain();
    });

    test('transfer', async () => {
      await initializeOwners();
      await deploy();
      await ownerMint('owner1');
      const owners = await getOwners();

      await transfer(owners[0], owners[1], new BN(5));

      testUtils.verifyListeners(listeners);
    });
  });

  describe('Time Coin', () => {
    const { timeCoinContract } = transactions;

    const mockBlockchain = () => {
      blockchain = createBlockchain({ contracts: [timeCoinContract] });

      blockchain.header = {
        get: jest.fn(() => factory.createHeader()),
      };

      blockchain.storageItem.getAll$ = jest.fn(() => []);
    };

    const deploy = async () =>
      executeSetupScript(
        new ScriptBuilder().emitAppCall(timeCoinContract.hash, 'contractDeploy').build(),
        common.ONE_THOUSAND_FIXED8,
      );

    const setOtcApprove = async (arg: number, address: UInt160) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(timeCoinContract.hash, 'setOtcApprove', address, arg).build(),
        }),
      });

      expectSuccess(result);
    };

    const transferWithLockupPeriod = async (from: UInt160, to: UInt160, amount: BN, time: Buffer) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder()
            .emitAppCall(timeCoinContract.hash, 'transferWithLockupPeriod', from, to, amount, time)
            .build(),
        }),
      });

      expectSuccess(result);
    };

    const transfer = async (from: UInt160, to: UInt160, amount: BN) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(timeCoinContract.hash, 'transfer', from, to, amount).build(),
        }),
      });

      expectSuccess(result);
    };

    beforeEach(() => {
      mockBlockchain();
    });

    const primaryAddressScriptHash = common.asUInt160(Buffer.from('7d2185c97fa43cb41c5617941c6b68d146a84ae5', 'hex'));
    const altAddressScriptHash = common.asUInt160(Buffer.from('a48c1ae6617e509347e5a385624b15f8872c8802', 'hex'));

    test('deploy & transfer', async () => {
      const ret = await deploy();
      expect(ret).toBeTruthy();
      await setOtcApprove(0, primaryAddressScriptHash);
      await setOtcApprove(1, primaryAddressScriptHash);
      await transferWithLockupPeriod(
        primaryAddressScriptHash,
        altAddressScriptHash,
        new BN(30000000000),
        Buffer.from('8047cb5d', 'hex'),
      );
      await transferWithLockupPeriod(
        primaryAddressScriptHash,
        altAddressScriptHash,
        new BN(40000000000),
        Buffer.from('8091445e', 'hex'),
      );
      await transferWithLockupPeriod(
        primaryAddressScriptHash,
        altAddressScriptHash,
        new BN(50000000000),
        Buffer.from('0069a25d', 'hex'),
      );
      blockchain.storageItem.getAll$ = jest.fn(() => [
        {
          key: Buffer.from('6c6f636b7570735fa48c1ae6617e509347e5a385624b15f8872c8802b71403', 'hex'),
          value: Buffer.from('800400000203b71403020500ac23fc06820102010d000500ac23fc06', 'hex'),
        },
        {
          key: Buffer.from('6c6f636b7570735fa48c1ae6617e509347e5a385624b15f8872c8802121503', 'hex'),
          value: Buffer.from('800400000203121503020500902f5009820102010d000500902f5009', 'hex'),
        },
        {
          key: Buffer.from('6c6f636b7570735fa48c1ae6617e509347e5a385624b15f8872c8802b61403', 'hex'),
          value: Buffer.from('800400000203b61403020500743ba40b820102010d000500743ba40b', 'hex'),
        },
      ]);

      await transfer(altAddressScriptHash, primaryAddressScriptHash, new BN(120000000000));

      testUtils.verifyListeners(listeners);
    });
  });

  describe('Switcheo V3.1', () => {
    const { switcheoV3Contract, switcheoV2TokenContract, nosTokenContract } = transactions;

    const switcheoTokenTransfer = async (from: UInt160, to: UInt160, amount: BN) => {
      const result = await executeSimple({
        blockchain,
        transaction: transactions.createInvocation({
          script: new ScriptBuilder().emitAppCall(switcheoV2TokenContract.hash, 'transfer', from, to, amount).build(),
        }),
      });

      expectSuccess(result);
    };

    const switcheoTokenDeploy = async () => {
      const deployResult = await executeSetupScript(
        new ScriptBuilder().emitAppCall(switcheoV2TokenContract.hash, 'deploy').build(),
      );
      expect(deployResult.asBoolean()).toBeTruthy();
    };

    const nosTokenTransfer = async (from: UInt160, to: UInt160, amount: Buffer) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder().emitAppCall(nosTokenContract.hash, 'transfer', from, to, amount).build(),
      });

      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    const nosTokenDeploy = async () => {
      const script = new ScriptBuilder().emitAppCall(nosTokenContract.hash, 'admin', 'InitSmartContract').build();

      const deployResult = await executeSetupScript(script);

      expect(deployResult.asBoolean()).toBeTruthy();
      testUtils.verifyBlockchainSnapshot(blockchain);
    };

    const nosWhiteListTransferFromAdd = async (address: UInt160) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder()
          .emitAppCall(nosTokenContract.hash, 'admin', 'WhitelistTransferFromAdd', address)
          .build(),
      });

      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    const initialize = async (address1: UInt160, address2: UInt160, address3: UInt160) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder()
          .emitAppCall(switcheoV3Contract.hash, 'initialize', address1, address2, address3)
          .build(),
      });

      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    const addToWhitelist = async (address: UInt160) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder().emitAppCall(switcheoV3Contract.hash, 'addToWhitelist', address).build(),
      });

      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    const deposit = async (
      address: UInt160,
      val: UInt160 | UInt256,
      amount: BN,
      inputs: ReadonlyArray<Input> = [],
      outputs: ReadonlyArray<Output> = [],
    ) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder().emitAppCall(switcheoV3Contract.hash, 'deposit', address, val, amount).build(),
        inputs,
        outputs,
      });

      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    const withdraw = async (attributes: ReadonlyArray<UInt256Attribute>) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder().emitTailCall(switcheoV3Contract.hash, 'withdraw').build(),
        attributes,
      });

      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    const createAtomicSwap = async (
      makerAddress: UInt160,
      takerAddress: UInt160,
      assetID: UInt256,
      amount: Buffer | BN,
      hashedSecret: UInt256,
      expirtyTime: Buffer,
      feeAssetID: UInt256,
      feeAmount = new BN(0),
      burnTokens = false,
    ) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder()
          .emitAppCall(
            switcheoV3Contract.hash,
            'createAtomicSwap',
            makerAddress,
            takerAddress,
            assetID,
            amount,
            hashedSecret,
            expirtyTime,
            feeAssetID,
            feeAmount,
            burnTokens,
          )
          .build(),
      });

      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    const executeAtomicSwap = async (hashedSecret: UInt256, preImage: Buffer) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder()
          .emitAppCall(switcheoV3Contract.hash, 'executeAtomicSwap', hashedSecret, preImage)
          .build(),
      });

      const result = await executeSimple({ blockchain, transaction });

      expectSuccess(result);
    };

    const mockBlockchain = () => {
      const timestamp = 1641700000;
      const blockIndex = 2900000;
      blockchain = createBlockchain({ contracts: [switcheoV3Contract, nosTokenContract, switcheoV2TokenContract] });

      blockchain.currentBlock.timestamp = timestamp;
      blockchain.currentBlock.index = blockIndex;

      blockchain.header = {
        get: jest.fn(async () => factory.createHeader({ index: blockIndex, timestamp })),
      };
    };

    beforeEach(() => {
      mockBlockchain();
    });

    const addr1 = common.asUInt160(Buffer.from('b7634295e58c6d7513c22d5881ba116db154e8de', 'hex'));
    const addr2 = common.asUInt160(Buffer.from('7335f929546270b8f811a0f9427b5712457107e7', 'hex'));
    const addr3 = common.asUInt160(Buffer.from('c202200f681f5d3b933c956cfedec18ee635bf5c', 'hex'));
    const addr = common.asUInt160(Buffer.from('2fbaa22d64a8c8f5a9940f359cb0cb1dfe49eb2c', 'hex'));
    const nosTokenHolderAddr = common.asUInt160(
      Buffer.from([163, 78, 249, 186, 149, 73, 242, 165, 255, 174, 25, 102, 234, 143, 189, 222, 71, 131, 159, 32]),
    );

    const n0sAttributes = [
      new UInt256Attribute({
        usage: 0xa1,
        value: common.bufferToUInt256(
          Buffer.from('5100000000000000000000000000000000000000000000000000000000000000', 'hex'),
        ),
      }),
      new UInt256Attribute({
        usage: 0xa2,
        value: common.bufferToUInt256(
          Buffer.concat([common.uInt160ToBuffer(nosTokenContract.hash), Buffer.alloc(12, 0)]),
        ),
      }),
      new UInt256Attribute({
        usage: 0xa4,
        value: common.bufferToUInt256(Buffer.concat([common.uInt160ToBuffer(addr), Buffer.alloc(12, 0)])),
      }),
      new UInt256Attribute({
        usage: 0xa5,
        value: common.bufferToUInt256(
          Buffer.from('8023bce88e000000000000000000000000000000000000000000000000000000', 'hex'),
        ),
      }),
    ];

    test('deposit & withdraw n0S tokens', async () => {
      const depositBuff = Buffer.from('88c132e98e00', 'hex');
      const depositBN = utils.fromSignedBuffer(depositBuff);

      await nosTokenDeploy();
      await nosWhiteListTransferFromAdd(switcheoV3Contract.hash);
      await nosTokenTransfer(nosTokenHolderAddr, addr, depositBuff);
      await initialize(addr3, addr2, addr1);
      await addToWhitelist(nosTokenContract.hash);
      await deposit(addr, nosTokenContract.hash, depositBN);
      await withdraw(n0sAttributes);

      testUtils.verifyListeners(listeners);
    });

    const switcheoAttributes = [
      new UInt256Attribute({
        usage: 0xa1,
        value: common.bufferToUInt256(
          Buffer.from('5100000000000000000000000000000000000000000000000000000000000000', 'hex'),
        ),
      }),
      new UInt256Attribute({
        usage: 0xa2,
        value: common.bufferToUInt256(
          Buffer.concat([common.uInt160ToBuffer(switcheoV2TokenContract.hash), Buffer.alloc(12, 0)]),
        ),
      }),
      new UInt256Attribute({
        usage: 0xa4,
        value: common.bufferToUInt256(Buffer.concat([common.uInt160ToBuffer(addr), Buffer.alloc(12, 0)])),
      }),
      new UInt256Attribute({
        usage: 0xa5,
        value: common.bufferToUInt256(
          Buffer.from('8023bce88e000000000000000000000000000000000000000000000000000000', 'hex'),
        ),
      }),
    ];
    const switcheoTokenHolderAddr = common.asUInt160(Buffer.from('46fca70ca7f0526d6955f915ce07cbe326fbadd0', 'hex'));

    test('deposit & withdraw SWTH tokens', async () => {
      const depositBuff = Buffer.from('88c132e98e00', 'hex');
      const depositBN = utils.fromSignedBuffer(depositBuff);

      await switcheoTokenDeploy();
      await switcheoTokenTransfer(switcheoTokenHolderAddr, addr, depositBN);
      await initialize(addr3, addr2, addr1);
      await addToWhitelist(switcheoV2TokenContract.hash);
      await deposit(addr, switcheoV2TokenContract.hash, depositBN);
      await withdraw(switcheoAttributes);

      testUtils.verifyListeners(listeners);
    });

    test('atomic swap', async () => {
      const timestamp = 1554800000;
      const blockIndex = 2900000;

      blockchain.currentBlock.timestamp = timestamp;
      blockchain.currentBlock.index = blockIndex;

      blockchain.header = {
        get: jest.fn(async () => factory.createHeader({ index: blockIndex, timestamp })),
      };

      const makerAddress = common.asUInt160(Buffer.from('78fb1102d1dfef0d2b7a1fc6a29592c39ad3a674', 'hex'));
      const takerAddress = common.asUInt160(Buffer.from('69cc2943e9523cd2e63e815b2f510a58162e995d', 'hex'));
      const assetID = common.asUInt256(
        Buffer.from('9b7cffdaa674beae0f930ebe6085af9093e5fe56b34a5c220ccdcf6efc336fc5', 'hex'),
      );
      const amount = Buffer.from('e033c00d', 'hex');
      const hashSecret = common.asUInt256(
        Buffer.from('d1a2ce56d5e119bc3a8893305e371cf3a9a6da9c9472b69d56081d7755d26207', 'hex'),
      );
      const preImage = Buffer.from('33366137646530382d366162632d343763372d623537302d366238366136373635353038', 'hex');
      const expirtyTime = Buffer.from('e5a6ad5c', 'hex');
      const neoBalance = neoBN('1000');

      blockchain.output.get = jest.fn(async () =>
        Promise.resolve(
          new Output({
            address: makerAddress,
            value: neoBalance,
            asset: assets.NEO_ASSET_HASH_UINT256,
          }),
        ),
      );

      const inputs = [
        new Input({
          hash: common.bufferToUInt256(Buffer.alloc(32, 5)),
          index: 0,
        }),
      ];
      const outputs = [
        new Output({
          address: switcheoV3Contract.hash,
          value: neoBalance,
          asset: assets.NEO_ASSET_HASH_UINT256,
        }),
      ];

      await initialize(addr3, addr2, addr1);
      await deposit(makerAddress, assets.NEO_ASSET_HASH_UINT256, neoBalance, inputs, outputs);
      await createAtomicSwap(makerAddress, takerAddress, assetID, amount, hashSecret, expirtyTime, assetID);
      await executeAtomicSwap(hashSecret, preImage);

      testUtils.verifyListeners(listeners);
    });
  });

  describe('Deep Brain', () => {
    const { deepBrainContract } = transactions;

    const mockBlockchain = () => {
      const timestamp = 1513172344;
      const blockIndex = 1699154;
      blockchain = createBlockchain({ contracts: [deepBrainContract] });

      blockchain.currentBlock.timestamp = timestamp;
      blockchain.currentBlock.index = blockIndex;

      blockchain.header = {
        get: jest.fn(async () => factory.createHeader({ index: blockIndex, timestamp })),
      };
    };

    const init = async () => {
      const script = new ScriptBuilder().emitAppCall(deepBrainContract.hash, 'init').build();
      const ret = await executeSetupScript(script, common.ONE_THOUSAND_FIXED8);

      expect(ret).toBeTruthy();
    };

    const transfer = async (from: UInt160, to: UInt160, amount: BN) => {
      const transaction = transactions.createInvocation({
        script: new ScriptBuilder().emitAppCall(deepBrainContract.hash, 'transfer', from, to, amount).build(),
      });
      const result = await executeSimple({
        blockchain,
        transaction,
      });

      expectSuccess(result);
    };

    beforeEach(() => {
      mockBlockchain();
    });

    const tokenHolderAddr = common.asUInt160(Buffer.from('f2b4b715c9a84fcca6bc6dc17351dd1c113f89a9', 'hex'));
    const workAddr = common.asUInt160(Buffer.from('1c65bc389492f9b14c8a708bba1d013c428d9909', 'hex'));
    const addr1 = common.asUInt160(Buffer.from('b511fe310e31bdbeea50b5bcf00107ed35b8f79d', 'hex'));
    const addr2 = common.asUInt160(Buffer.from('4951c0bbd42cb2e7e96a08662b0aa779c9a1c383', 'hex'));

    const startingBalance = new BN('8407482592097768');
    const firstAmount = new BN('128425589200000');
    const secondAmount = new BN('2686734000000');

    test('transfers', async () => {
      await init();

      await transfer(tokenHolderAddr, workAddr, startingBalance);
      await transfer(tokenHolderAddr, addr1, firstAmount);
      await transfer(tokenHolderAddr, addr2, secondAmount);
      await transfer(addr1, workAddr, firstAmount);
      await transfer(addr2, workAddr, secondAmount);

      testUtils.verifyListeners(listeners);
    });
  });
});
