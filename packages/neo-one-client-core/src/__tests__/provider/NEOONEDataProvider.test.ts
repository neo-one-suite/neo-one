// tslint:disable no-object-mutation
import {
  ActionJSON,
  AddressString,
  Asset,
  AssetJSON,
  AssetNameJSON,
  AssetType,
  AssetTypeJSON,
  CallReceiptJSON,
  common,
  ConfirmedTransaction,
  Contract,
  ContractJSON,
  ContractParameterType,
  ContractParameterTypeJSON,
  InvocationResultJSON,
  Output,
  OutputJSON,
  PublicKeyString,
  RawAction,
  RawCallReceipt,
  RawInvocationResult,
  scriptHashToAddress,
  StorageItem,
  StorageItemJSON,
  Transaction,
  TransactionJSON,
  VMState,
} from '@neo-one/client-common';
import { toArray } from '@reactivex/ix-es2015-cjs/asynciterable/toarray';
import BigNumber from 'bignumber.js';
import { data, factory, keys } from '../../__data__';
import { Hash256 } from '../../Hash256';
import { convertAction, JSONRPCClient, JSONRPCHTTPProvider, NEOONEDataProvider } from '../../provider';

jest.mock('../../provider/JSONRPCClient');

interface AssetBase {
  readonly type: AssetType;
  readonly name: string;
  readonly amount: BigNumber;
  readonly precision: number;
  readonly owner: PublicKeyString;
  readonly admin: AddressString;
}

interface AssetBaseJSON {
  readonly type: AssetTypeJSON;
  readonly name: AssetNameJSON;
  readonly amount: string;
  readonly precision: number;
  readonly owner: string;
  readonly admin: string;
}

describe('NEOONEDataProvider', () => {
  const network = 'local';
  const rpcURL = 'https://neotracker.io/rpc';

  let client: Modifiable<JSONRPCClient>;
  let provider: NEOONEDataProvider;
  beforeEach(() => {
    provider = new NEOONEDataProvider({ network, rpcURL });
    // tslint:disable-next-line no-any
    client = (provider as any).mutableClient;
  });

  const verifyInvocationResultSuccess = (
    invocationResult: RawInvocationResult,
    invocationResultJSON: InvocationResultJSON,
  ) => {
    if (invocationResult.state !== 'HALT' || invocationResultJSON.state !== VMState.Halt) {
      throw new Error('For TS');
    }
    expect(invocationResult.gasConsumed.toString(10)).toEqual(invocationResultJSON.gas_consumed);
    expect(invocationResult.gasCost.toString(10)).toEqual(invocationResultJSON.gas_cost);
    const firstStack = invocationResult.stack[0];
    const firstStackJSON = invocationResultJSON.stack[0];
    if (firstStack.type !== 'Integer' || firstStackJSON.type !== 'Integer') {
      throw new Error('For TS');
    }
    expect(firstStack.value.toString(10)).toEqual(firstStackJSON.value);
  };

  const verifyDefaultActions = (
    actions: readonly RawAction[],
    actionsJSON: readonly ActionJSON[],
    blockIndex: number,
    blockHash: string,
    index: number,
    txid: string,
  ) => {
    expect(actions.length).toEqual(actionsJSON.length);
    const verifyAction = (actionResult: RawAction, action: ActionJSON, idx: number) => {
      expect(actionResult.type).toEqual(action.type);
      expect(actionResult.version).toEqual(action.version);
      expect(actionResult.blockIndex).toEqual(blockIndex);
      expect(actionResult.blockHash).toEqual(blockHash);
      expect(actionResult.transactionIndex).toEqual(index);
      expect(actionResult.transactionHash).toEqual(txid);
      expect(actionResult.index).toEqual(idx);
      expect(actionResult.globalIndex.toString(10)).toEqual(action.index);
      expect(actionResult.address).toEqual(scriptHashToAddress(action.scriptHash));
    };
    verifyAction(actions[0], actionsJSON[0], 0);
    verifyAction(actions[1], actionsJSON[1], 1);
  };

  const verifyAssetBase = (
    asset: AssetBase,
    assetJSON: AssetBaseJSON,
    toAssetType: string = assetJSON.type,
    name = assetJSON.name,
  ) => {
    expect(asset.type).toEqual(toAssetType);
    expect(asset.name).toEqual(name);
    expect(asset.amount.toString(10)).toEqual(assetJSON.amount);
    expect(asset.precision).toEqual(assetJSON.precision);
    expect(asset.owner).toEqual(assetJSON.owner);
    expect(asset.admin).toEqual(assetJSON.admin);
  };

  const verifyAsset = (
    asset: Asset,
    assetJSON: AssetJSON,
    toAssetType: string = assetJSON.type,
    name = assetJSON.name,
  ) => {
    verifyAssetBase(asset, assetJSON, toAssetType, name);
    expect(asset.hash).toEqual(assetJSON.id);
    expect(asset.available.toString(10)).toEqual(assetJSON.available);
    expect(asset.issuer).toEqual(assetJSON.issuer);
    expect(asset.expiration).toEqual(assetJSON.expiration);
    expect(asset.frozen).toEqual(assetJSON.frozen);
  };

  const verifyContract = (contract: Contract, contractJSON: ContractJSON, returnType = 'Buffer') => {
    expect(contract.version).toEqual(contractJSON.version);
    expect(contract.address).toEqual(scriptHashToAddress(contractJSON.hash));
    expect(contract.script).toEqual(contractJSON.script);
    expect(contract.parameters).toEqual(['Address', 'Buffer']);
    expect(contract.returnType).toEqual(returnType);
    expect(contract.name).toEqual(contractJSON.name);
    expect(contract.codeVersion).toEqual(contractJSON.code_version);
    expect(contract.author).toEqual(contractJSON.author);
    expect(contract.email).toEqual(contractJSON.email);
    expect(contract.description).toEqual(contractJSON.description);
    expect(contract.storage).toEqual(contractJSON.properties.storage);
    expect(contract.dynamicInvoke).toEqual(contractJSON.properties.dynamic_invoke);
    expect(contract.payable).toEqual(contractJSON.properties.payable);
  };

  const verifyOutput = (output: Output, outputJSON: OutputJSON) => {
    expect(output.asset).toEqual(outputJSON.asset);
    expect(output.value.toString(10)).toEqual(outputJSON.value);
    expect(output.address).toEqual(outputJSON.address);
  };

  const verifyTransactionBase = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    expect(transaction.hash).toEqual(transactionJSON.txid);
    expect(transaction.size).toEqual(transactionJSON.size);
    expect(transaction.version).toEqual(transactionJSON.version);
    expect(transaction.attributes.length).toEqual(transactionJSON.attributes.length);
    expect(transaction.attributes[0].usage).toEqual(transactionJSON.attributes[0].usage);
    expect(transaction.attributes[0].data).toEqual(scriptHashToAddress(transactionJSON.attributes[0].data));
    expect(transaction.attributes[1].usage).toEqual(transactionJSON.attributes[1].usage);
    expect(transaction.attributes[1].data).toEqual(transactionJSON.attributes[1].data);
    expect(transaction.attributes[2].usage).toEqual(transactionJSON.attributes[2].usage);
    expect(transaction.attributes[2].data).toEqual(transactionJSON.attributes[2].data);
    expect(transaction.attributes[3].usage).toEqual(transactionJSON.attributes[3].usage);
    expect(transaction.attributes[3].data).toEqual(transactionJSON.attributes[3].data);
    expect(transaction.inputs.length).toEqual(transactionJSON.vin.length);
    expect(transaction.inputs[0].hash).toEqual(transactionJSON.vin[0].txid);
    expect(transaction.inputs[0].index).toEqual(transactionJSON.vin[0].vout);
    expect(transaction.outputs.length).toEqual(transactionJSON.vout.length);
    verifyOutput(transaction.outputs[0], transactionJSON.vout[0]);
    expect(transaction.scripts).toEqual(transactionJSON.scripts);
    expect(transaction.systemFee.toString(10)).toEqual(transactionJSON.sys_fee);
    expect(transaction.networkFee.toString(10)).toEqual(transactionJSON.net_fee);
  };

  const verifyClaimTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    if (transaction.type !== 'ClaimTransaction' || transactionJSON.type !== 'ClaimTransaction') {
      throw new Error('For TS');
    }
    expect(transaction.claims.length).toEqual(transactionJSON.claims.length);
    expect(transaction.claims[0].hash).toEqual(transactionJSON.claims[0].txid);
    expect(transaction.claims[0].index).toEqual(transactionJSON.claims[0].vout);
  };

  const verifyContractTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    expect(transaction.type).toEqual('ContractTransaction');
  };

  const verifyEnrollmentTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    if (transaction.type !== 'EnrollmentTransaction' || transactionJSON.type !== 'EnrollmentTransaction') {
      throw new Error('For TS');
    }
    expect(transaction.publicKey).toEqual(transactionJSON.pubkey);
  };

  const verifyInvocationTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    if (transaction.type !== 'InvocationTransaction' || transactionJSON.type !== 'InvocationTransaction') {
      throw new Error('For TS');
    }
    expect(transaction.script).toEqual(transactionJSON.script);
    expect(transaction.gas.toString(10)).toEqual(transactionJSON.gas);
  };

  const verifyIssueTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    expect(transaction.type).toEqual('IssueTransaction');
  };

  const verifyMinerTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    if (transaction.type !== 'MinerTransaction' || transactionJSON.type !== 'MinerTransaction') {
      throw new Error('For TS');
    }
    expect(transaction.nonce).toEqual(transactionJSON.nonce);
  };

  const verifyPublishTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    if (transaction.type !== 'PublishTransaction' || transactionJSON.type !== 'PublishTransaction') {
      throw new Error('For TS');
    }
    verifyContract(transaction.contract, transactionJSON.contract);
  };

  const verifyRegisterTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    if (transaction.type !== 'RegisterTransaction' || transactionJSON.type !== 'RegisterTransaction') {
      throw new Error('For TS');
    }
    verifyAssetBase(transaction.asset, transactionJSON.asset);
  };

  const verifyStateTransaction = (transaction: Transaction, transactionJSON: TransactionJSON) => {
    verifyTransactionBase(transaction, transactionJSON);
    expect(transaction.type).toEqual('StateTransaction');
  };

  const verifyConfirmedTransaction = (transaction: ConfirmedTransaction, transactionJSON: TransactionJSON) => {
    if (transactionJSON.data === undefined) {
      throw new Error('For TS');
    }

    expect(transaction.receipt.blockHash).toEqual(transactionJSON.data.blockHash);
    expect(transaction.receipt.blockIndex).toEqual(transactionJSON.data.blockIndex);
    expect(transaction.receipt.transactionIndex).toEqual(transactionJSON.data.transactionIndex);
    expect(transaction.receipt.globalIndex.toString(10)).toEqual(transactionJSON.data.globalIndex);
  };

  const verifyCallReceipt = (receipt: RawCallReceipt, receiptJSON: CallReceiptJSON) => {
    verifyInvocationResultSuccess(receipt.result, receiptJSON.result);
    verifyDefaultActions(
      receipt.actions,
      receiptJSON.actions,
      0,
      '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
      0,
      '0x​​​​​0000000000000000000000000000000000000000000000000000000000000000​​​​​',
    );
  };

  test('setRPCURL', () => {
    const currentClient = client;

    provider.setRPCURL('http://localhost:1340');

    // tslint:disable-next-line no-any
    expect(currentClient).not.toBe((provider as any).mutableClient);
  });

  test('getUnclaimed', async () => {
    const accountJSON = factory.createAccountJSON();
    client.getAccount = jest.fn(async () => Promise.resolve(accountJSON));
    client.getClaimAmount = jest.fn(async () => Promise.resolve(data.bigNumbers.a));

    const result = await provider.getUnclaimed(keys[0].address);

    expect(result.amount).toEqual(data.bigNumbers.a.times(accountJSON.unclaimed.length));
    expect(result.unclaimed[0].hash).toEqual(accountJSON.unclaimed[0].txid);
    expect(result.unclaimed[0].index).toEqual(accountJSON.unclaimed[0].vout);
    expect(result.unclaimed[1].hash).toEqual(accountJSON.unclaimed[1].txid);
    expect(result.unclaimed[1].index).toEqual(accountJSON.unclaimed[1].vout);
  });

  test('getUnspent', async () => {
    const accountJSON = factory.createAccountJSON();
    const outputJSON = factory.createOutputJSON();
    client.getAccount = jest.fn(async () => Promise.resolve(accountJSON));
    client.getUnspentOutput = jest.fn(async (input) =>
      input.vout === accountJSON.unspent[0].vout ? outputJSON : undefined,
    );

    const result = await provider.getUnspentOutputs(keys[0].address);

    expect(result).toHaveLength(1);
    expect(result[0].asset).toEqual(outputJSON.asset);
    expect(result[0].value.toString(10)).toEqual(outputJSON.value);
    expect(result[0].address).toEqual(outputJSON.address);
    expect(result[0].hash).toEqual(accountJSON.unspent[0].txid);
    expect(result[0].index).toEqual(accountJSON.unspent[0].vout);
  });

  test('relayTransaction', async () => {
    const transactionJSON = factory.createInvocationTransactionJSON();
    client.relayTransaction = jest.fn(async () =>
      Promise.resolve({
        transaction: transactionJSON,
      }),
    );

    const result = await provider.relayTransaction(data.serializedTransaction.valid);

    verifyInvocationTransaction(result.transaction, transactionJSON);
  });

  test('verifyConvertTransaction', async () => {
    const transactionJSON = factory.createInvocationTransactionJSON();

    const actionJSON = factory.createLogActionJSON();
    const verificationScriptJSON = factory.createVerifyScriptResultJSON({
      failureMessage: 'test',
      actions: [actionJSON],
    });
    const verifyResultJSON = factory.createVerifyTransactionResultJSON({
      verifications: [verificationScriptJSON],
    });

    client.relayTransaction = jest.fn(async () =>
      Promise.resolve({
        transaction: transactionJSON,
        verifyResult: verifyResultJSON,
      }),
    );

    const result = await provider.relayTransaction(data.serializedTransaction.valid);

    if (result.verifyResult === undefined) {
      throw new Error('for TS');
    }

    expect(result.verifyResult.verifications).toEqual([
      {
        failureMessage: 'test',
        witness: verificationScriptJSON.witness,
        address: scriptHashToAddress(verificationScriptJSON.hash),
        actions: [
          convertAction(common.uInt256ToString(common.ZERO_UINT256), -1, transactionJSON.txid, -1, 0, actionJSON),
        ],
      },
    ]);
  });

  test('getTransactionReceipt', async () => {
    const transactionReceipt = factory.createTransactionReceipt();
    // tslint:disable-next-line:no-any
    client.getTransactionReceipt = jest.fn(async () => Promise.resolve(transactionReceipt) as any);

    const result = await provider.getTransactionReceipt(data.hash256s.a);

    expect(result).toEqual(transactionReceipt);
  });

  test('getInvocationData', async () => {
    const transactionJSON = factory.createInvocationTransactionJSON();
    const invocationData = transactionJSON.invocationData;
    const transactionData = transactionJSON.data;
    if (invocationData === undefined || transactionData === undefined) {
      throw new Error('Something went wrong');
    }

    client.getInvocationData = jest.fn(async () => Promise.resolve(invocationData));
    client.getTransaction = jest.fn(async () => Promise.resolve(transactionJSON));

    const result = await provider.getInvocationData(data.hash256s.a);

    verifyDefaultActions(
      result.actions,
      invocationData.actions,
      transactionData.blockIndex,
      transactionData.blockHash,
      transactionData.transactionIndex,
      transactionJSON.txid,
    );

    const notificationAction = result.actions[0];
    const notificationActionJSON = invocationData.actions[0];
    if (notificationAction.type !== 'Notification' || notificationActionJSON.type !== 'Notification') {
      throw new Error('For TS');
    }
    expect(notificationAction.args.length).toEqual(notificationActionJSON.args.length);
    const firstArg = notificationAction.args[0];
    const firstArgJSON = notificationActionJSON.args[0];
    if (firstArg.type !== 'Integer' || firstArgJSON.type !== 'Integer') {
      throw new Error('For TS');
    }
    expect(firstArg.value.toString(10)).toEqual(firstArgJSON.value);

    const logAction = result.actions[1];
    const logActionJSON = invocationData.actions[1];
    if (logAction.type !== 'Log' || logActionJSON.type !== 'Log') {
      throw new Error('For TS');
    }
    expect(logAction.message).toEqual(logActionJSON.message);

    const asset = result.asset;
    const assetJSON = invocationData.asset;
    if (asset === undefined || assetJSON === undefined) {
      throw new Error('For TS');
    }
    verifyAsset(asset, assetJSON);

    expect(result.contracts.length).toEqual(invocationData.contracts.length);
    verifyContract(result.contracts[0], invocationData.contracts[0]);

    expect(result.deletedContractAddresses.length).toEqual(invocationData.deletedContractHashes.length);
    expect(result.deletedContractAddresses[0]).toEqual(scriptHashToAddress(invocationData.deletedContractHashes[0]));
    expect(result.migratedContractAddresses.length).toEqual(invocationData.migratedContractHashes.length);
    expect(result.migratedContractAddresses[0][0]).toEqual(
      scriptHashToAddress(invocationData.migratedContractHashes[0][0]),
    );
    expect(result.migratedContractAddresses[0][1]).toEqual(
      scriptHashToAddress(invocationData.migratedContractHashes[0][1]),
    );

    verifyInvocationResultSuccess(result.result, invocationData.result);
  });

  test('getInvocationData - missing transaction data', async () => {
    const { data: _data, ...transactionJSON } = factory.createInvocationTransactionJSON();

    // tslint:disable:no-any
    client.getInvocationData = jest.fn(async () => Promise.resolve(transactionJSON.invocationData) as any);
    client.getTransaction = jest.fn((async () => Promise.resolve(transactionJSON)) as any);
    // tslint:enable:no-any

    await expect(provider.getInvocationData(data.hash256s.a)).rejects.toMatchSnapshot();
  });

  test('testInvoke', async () => {
    const callReceiptJSON = factory.createCallReceiptJSON();
    client.testInvocation = jest.fn(async () => Promise.resolve(callReceiptJSON));

    const result = await provider.testInvoke(data.serializedTransaction.valid);

    verifyCallReceipt(result, callReceiptJSON);
  });

  test('getAccount', async () => {
    const accountJSON = factory.createAccountJSON();
    client.getAccount = jest.fn(async () => Promise.resolve(accountJSON));

    const result = await provider.getAccount(keys[0].address);

    expect(result.address).toEqual(scriptHashToAddress(accountJSON.script_hash));
    expect(result.balances[Hash256.NEO].toString(10)).toEqual(accountJSON.balances[0].value);
    expect(result.balances[Hash256.GAS].toString(10)).toEqual(accountJSON.balances[1].value);
  });

  const convertedAssetTypes: readonly (readonly [AssetTypeJSON, AssetType])[] = [
    ['CreditFlag', 'Credit'],
    ['DutyFlag', 'Duty'],
    ['GoverningToken', 'Governing'],
    ['UtilityToken', 'Utility'],
    ['Currency', 'Currency'],
    ['Share', 'Share'],
    ['Invoice', 'Invoice'],
    ['Token', 'Token'],
  ];

  convertedAssetTypes.forEach(([from, to]) => {
    test(`getAsset - ${from} -> ${to}`, async () => {
      const assetJSON = factory.createAssetJSON({ type: from });
      client.getAsset = jest.fn(async () => Promise.resolve(assetJSON));

      const result = await provider.getAsset(data.hash256s.a);
      verifyAsset(result, assetJSON, to);
    });
  });

  test(`getAsset - extracts en name`, async () => {
    const assetJSON = factory.createAssetJSON({ name: [{ lang: 'foo', name: 'bar' }, { lang: 'en', name: 'baz' }] });
    client.getAsset = jest.fn(async () => Promise.resolve(assetJSON));

    const result = await provider.getAsset(data.hash256s.a);
    verifyAsset(result, assetJSON, assetJSON.type, 'baz');
  });

  test(`getAsset - otherwise, first name`, async () => {
    const assetJSON = factory.createAssetJSON({ name: [{ lang: 'foo', name: 'bar' }, { lang: 'baz', name: 'baz' }] });
    client.getAsset = jest.fn(async () => Promise.resolve(assetJSON));

    const result = await provider.getAsset(data.hash256s.a);
    verifyAsset(result, assetJSON, assetJSON.type, 'bar');
  });

  test('getBlock', async () => {
    const blockJSON = factory.createBlockJSON();
    client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));

    const result = await provider.getBlock(10);

    expect(result.version).toEqual(blockJSON.version);
    expect(result.hash).toEqual(blockJSON.hash);
    expect(result.previousBlockHash).toEqual(blockJSON.previousblockhash);
    expect(result.merkleRoot).toEqual(blockJSON.merkleroot);
    expect(result.time).toEqual(blockJSON.time);
    expect(result.index).toEqual(blockJSON.index);
    expect(result.nonce).toEqual(blockJSON.nonce);
    expect(result.nextConsensus).toEqual(blockJSON.nextconsensus);
    expect(result.script).toEqual(blockJSON.script);
    expect(result.size).toEqual(blockJSON.size);
    expect(result.transactions.length).toEqual(blockJSON.tx.length);
    verifyMinerTransaction(result.transactions[0], blockJSON.tx[0]);
    verifyConfirmedTransaction(result.transactions[0], blockJSON.tx[0]);
    verifyClaimTransaction(result.transactions[1], blockJSON.tx[1]);
    verifyConfirmedTransaction(result.transactions[1], blockJSON.tx[1]);
    verifyContractTransaction(result.transactions[2], blockJSON.tx[2]);
    verifyConfirmedTransaction(result.transactions[2], blockJSON.tx[2]);
    verifyEnrollmentTransaction(result.transactions[3], blockJSON.tx[3]);
    verifyConfirmedTransaction(result.transactions[3], blockJSON.tx[3]);
    verifyInvocationTransaction(result.transactions[4], blockJSON.tx[4]);
    verifyConfirmedTransaction(result.transactions[4], blockJSON.tx[4]);
    verifyIssueTransaction(result.transactions[5], blockJSON.tx[5]);
    verifyConfirmedTransaction(result.transactions[5], blockJSON.tx[5]);
    verifyPublishTransaction(result.transactions[6], blockJSON.tx[6]);
    verifyConfirmedTransaction(result.transactions[6], blockJSON.tx[6]);
    verifyRegisterTransaction(result.transactions[7], blockJSON.tx[7]);
    verifyConfirmedTransaction(result.transactions[7], blockJSON.tx[7]);
    verifyStateTransaction(result.transactions[8], blockJSON.tx[8]);
    verifyConfirmedTransaction(result.transactions[8], blockJSON.tx[8]);
  });

  test('iterBlocks', async () => {
    const blockJSON = factory.createBlockJSON();
    client.getBlockCount = jest.fn(async () => Promise.resolve(2));
    client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));

    const result = await toArray(provider.iterBlocks({ indexStart: 1, indexStop: 2 }));

    expect(result.length).toEqual(1);
  });

  test('getBestBlockHash', async () => {
    const hash = data.hash256s.a;
    client.getBestBlockHash = jest.fn(async () => Promise.resolve(hash));

    const result = await provider.getBestBlockHash();

    expect(result).toEqual(hash);
  });

  test('getBlockCount', async () => {
    const count = 2;
    client.getBlockCount = jest.fn(async () => Promise.resolve(count));

    const result = await provider.getBlockCount();

    expect(result).toEqual(count);
  });

  test('getContract', async () => {
    const contractJSON = factory.createContractJSON();
    client.getContract = jest.fn(async () => Promise.resolve(contractJSON));

    const result = await provider.getContract(keys[0].address);

    verifyContract(result, contractJSON);
  });

  const convertedContractParameterTypes: readonly (readonly [ContractParameterTypeJSON, ContractParameterType])[] = [
    ['Signature', 'Signature'],
    ['Boolean', 'Boolean'],
    ['Integer', 'Integer'],
    ['Hash160', 'Address'],
    ['Hash256', 'Hash256'],
    ['ByteArray', 'Buffer'],
    ['PublicKey', 'PublicKey'],
    ['String', 'String'],
    ['Array', 'Array'],
    ['InteropInterface', 'InteropInterface'],
    ['Void', 'Void'],
  ];

  convertedContractParameterTypes.forEach(([from, to]) => {
    test(`getContract - ${from} -> ${to}`, async () => {
      const contractJSON = factory.createContractJSON({ returntype: from });
      client.getContract = jest.fn(async () => Promise.resolve(contractJSON));

      const result = await provider.getContract(keys[0].address);
      verifyContract(result, contractJSON, to);
    });
  });

  test('getMemPool', async () => {
    const memPool = [data.hash256s.a];
    client.getMemPool = jest.fn(async () => Promise.resolve(memPool));

    const result = await provider.getMemPool();

    expect(result).toEqual(memPool);
  });

  test('getTransaction', async () => {
    const transactionJSON = factory.createInvocationTransactionJSON();
    client.getTransaction = jest.fn(async () => Promise.resolve(transactionJSON));

    const result = await provider.getTransaction(transactionJSON.txid);

    verifyInvocationTransaction(result, transactionJSON);
  });

  test('getOutput', async () => {
    const outputJSON = factory.createOutputJSON();
    client.getOutput = jest.fn(async () => Promise.resolve(outputJSON));

    const result = await provider.getOutput({ hash: data.hash256s.a, index: 0 });

    verifyOutput(result, outputJSON);
  });

  test('getConnectedPeers', async () => {
    const peersJSON = [factory.createPeerJSON()];
    client.getConnectedPeers = jest.fn(async () => Promise.resolve(peersJSON));

    const result = await provider.getConnectedPeers();

    expect(result).toEqual(peersJSON);
  });

  test('getNetworkSettings', async () => {
    const networkSettingsJSON = factory.createNetworkSettingsJSON();
    client.getNetworkSettings = jest.fn(async () => Promise.resolve(networkSettingsJSON));

    const result = await provider.getNetworkSettings();

    expect(result.issueGASFee.toString(10)).toEqual(networkSettingsJSON.issueGASFee);
  });

  const verifyStorage = (item: StorageItem, itemJSON: StorageItemJSON) => {
    expect(item.address).toEqual(keys[0].address);
    expect(item.key).toEqual(data.buffers.a);
    expect(item.value).toEqual(itemJSON.value);
  };

  test('iterStorage', async () => {
    const storageItemJSON = factory.createStorageItemJSON();
    client.getAllStorage = jest.fn(async () => Promise.resolve([storageItemJSON]));

    const result = await toArray(provider.iterStorage(keys[0].address));

    expect(result).toHaveLength(1);
    verifyStorage(result[0], storageItemJSON);
  });

  test('iterActionsRaw', async () => {
    const blockJSON = factory.createBlockJSON();
    client.getBlockCount = jest.fn(async () => Promise.resolve(2));
    client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));

    const result = await toArray(provider.iterActionsRaw({ indexStart: 1, indexStop: 2 }));

    expect(result.length).toEqual(2);
    const transactionJSON = blockJSON.tx[4];
    if (
      transactionJSON.type !== 'InvocationTransaction' ||
      transactionJSON.data === undefined ||
      transactionJSON.invocationData === undefined
    ) {
      throw new Error('For TS');
    }

    verifyDefaultActions(
      result,
      transactionJSON.invocationData.actions,
      transactionJSON.data.blockIndex,
      transactionJSON.data.blockHash,
      transactionJSON.data.transactionIndex,
      transactionJSON.txid,
    );
  });

  test('call', async () => {
    const callReceiptJSON = factory.createCallReceiptJSON();
    client.testInvocation = jest.fn(async () => Promise.resolve(callReceiptJSON));

    const result = await provider.call(keys[0].address, 'foo', []);

    verifyCallReceipt(result, callReceiptJSON);
  });

  test('runConsensusNow', async () => {
    const runConsensusNow = jest.fn(async () => Promise.resolve());
    client.runConsensusNow = runConsensusNow;

    await provider.runConsensusNow();

    expect(runConsensusNow).toHaveBeenCalled();
  });

  test('updateSettings', async () => {
    const updateSettings = jest.fn(async () => Promise.resolve());
    client.updateSettings = updateSettings;
    const options = { secondsPerBlock: 10 };

    await provider.updateSettings(options);

    expect(updateSettings).toHaveBeenCalledWith(options, undefined);
  });

  test('fastForwardOffset', async () => {
    const fastForwardOffset = jest.fn(async () => Promise.resolve());
    client.fastForwardOffset = fastForwardOffset;
    const options = 10;

    await provider.fastForwardOffset(options);

    expect(fastForwardOffset).toHaveBeenCalledWith(options, undefined);
  });

  test('fastForwardToTime', async () => {
    const fastForwardToTime = jest.fn(async () => Promise.resolve());
    client.fastForwardToTime = fastForwardToTime;
    const options = 10;

    await provider.fastForwardToTime(options);

    expect(fastForwardToTime).toHaveBeenCalledWith(options, undefined);
  });

  test('reset', async () => {
    const reset = jest.fn(async () => Promise.resolve());
    client.reset = reset;

    await provider.reset();

    expect(reset).toHaveBeenCalled();
  });

  test('convertMapContractParamaterType - Map', async () => {
    const contract = factory.createContractJSON({ parameters: ['Map'] });
    client.getContract = jest.fn(async () => Promise.resolve(contract));

    const result = await provider.getContract(keys[0].address);

    expect(result.parameters).toEqual(['Map']);
  });

  test('construction with rpcURL provider works', () => {
    provider = new NEOONEDataProvider({ network, rpcURL: new JSONRPCHTTPProvider(rpcURL) });
    expect(provider).toBeDefined();
  });
});
