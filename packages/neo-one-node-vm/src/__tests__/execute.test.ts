// tslint:disable no-any no-let no-object-mutation no-empty
// wallaby.skip
import {
  common,
  crypto,
  Input,
  InvocationTransaction,
  Output,
  ScriptBuilder,
  ScriptContainerType,
  UInt160,
  UInt160Attribute,
  UInt256Attribute,
  utils,
  VMState,
} from '@neo-one/client-core';
import { DefaultMonitor } from '@neo-one/monitor';
import { ExecuteScriptsResult, NULL_ACTION, TriggerType, VMListeners } from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { assets, createBlockchain, testUtils, transactions } from '../__data__';
import { execute } from '../execute';

const monitor = DefaultMonitor.create({
  service: 'test',
});

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
    monitor,
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
    expect(result.state).toEqual(VMState.Halt);
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
    expect(result.state).toEqual(VMState.Fault);
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
  };

  const expectSuccess = (result: ExecuteScriptsResult) => {
    expect(result.errorMessage).toBeUndefined();
    expect(result.state).toEqual(VMState.Halt);
    expect(result.stack.length).toEqual(1);
    expect(result.stack[0].asBoolean()).toBeTruthy();
    expect(result.gasConsumed.toString(10)).toMatchSnapshot();
    testUtils.verifyBlockchainSnapshot(blockchain);
  };

  const checkResult = (result: ExecuteScriptsResult) => {
    if (result.errorMessage !== undefined) {
      throw new Error(result.errorMessage);
    }

    if (result.state !== VMState.Halt) {
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
    it(name, async () => {
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

      if (state === VMState.Fault) {
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

  testKYC('should fail kyc transaction with insufficient gas', utils.ZERO, VMState.Fault);

  testKYC('should not fail kyc transaction with sufficient gas', common.ONE_HUNDRED_MILLION_FIXED8, VMState.Halt);

  it.skip('should refund on mintTokens with insufficient presale', async () => {
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
    expect(result.state).toEqual(VMState.Halt);
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
      testUtils.verifyListeners(listeners);
    });

    it('should fail on multiple deploy', async () => {
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

      it('should fail without a sender', async () => {
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
          testUtils.verifyListeners(listeners);
        });

        it('when whitelist sale period and not whitelisted real world', async () => {
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
          testUtils.verifyListeners(listeners);
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
          testUtils.verifyListeners(listeners);
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
        await expectConciergeItemBNEquals(conciergeSenderAddress, '22000000000');

        testUtils.verifyListeners(listeners);
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
        testUtils.verifyListeners(listeners);
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
        it(`should ${success ? '' : 'not '}handle ${count} transfers${
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
      it('should allow NEP5 Concierge withdrawals', async () => {
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

      it('should allow NEP5 Switcheo withdrawals', async () => {
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

      it.skip('should allow withdrawing filled orders', async () => {
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
});
