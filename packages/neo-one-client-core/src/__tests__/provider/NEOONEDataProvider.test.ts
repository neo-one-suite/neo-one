// tslint:disable no-object-mutation
import { common, scriptHashToAddress, StorageItem, StorageItemJSON } from '@neo-one/client-common';
import { Modifiable } from '@neo-one/utils';
import { toArray } from '@reactivex/ix-es2015-cjs/asynciterable/toarray';
import { data, factory, keys, verifyDataProvider as verify } from '../../__data__';
import { Hash256 } from '../../Hash256';
import { convertAction, JSONRPCClient, JSONRPCHTTPProvider, NEOONEDataProvider } from '../../provider';

jest.mock('../../provider/JSONRPCClient');

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

    const result = await provider.relayTransaction(factory.createInvocationTransactionModel());

    verify.verifyInvocationTransaction(result.transaction, transactionJSON);
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

    const result = await provider.relayTransaction(factory.createInvocationTransactionModel());

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

    verify.verifyDefaultActions(
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
    verify.verifyAsset(asset, assetJSON);

    expect(result.contracts.length).toEqual(invocationData.contracts.length);
    verify.verifyContract(result.contracts[0], invocationData.contracts[0]);

    expect(result.deletedContractAddresses.length).toEqual(invocationData.deletedContractHashes.length);
    expect(result.deletedContractAddresses[0]).toEqual(scriptHashToAddress(invocationData.deletedContractHashes[0]));
    expect(result.migratedContractAddresses.length).toEqual(invocationData.migratedContractHashes.length);
    expect(result.migratedContractAddresses[0][0]).toEqual(
      scriptHashToAddress(invocationData.migratedContractHashes[0][0]),
    );
    expect(result.migratedContractAddresses[0][1]).toEqual(
      scriptHashToAddress(invocationData.migratedContractHashes[0][1]),
    );

    verify.verifyInvocationResultSuccess(result.result, invocationData.result);
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

    const result = await provider.testInvoke(factory.createInvocationTransactionModel());

    verify.verifyCallReceipt(result, callReceiptJSON);
  });

  test('getAccount', async () => {
    const accountJSON = factory.createAccountJSON();
    client.getAccount = jest.fn(async () => Promise.resolve(accountJSON));

    const result = await provider.getAccount(keys[0].address);

    expect(result.address).toEqual(scriptHashToAddress(accountJSON.script_hash));
    expect(result.balances[Hash256.NEO].toString(10)).toEqual(accountJSON.balances[0].value);
    expect(result.balances[Hash256.GAS].toString(10)).toEqual(accountJSON.balances[1].value);
  });

  const convertedAssetTypes = [
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
      verify.verifyAsset(result, assetJSON, to);
    });
  });

  test(`getAsset - extracts en name`, async () => {
    const assetJSON = factory.createAssetJSON({
      name: [
        { lang: 'foo', name: 'bar' },
        { lang: 'en', name: 'baz' },
      ],
    });
    client.getAsset = jest.fn(async () => Promise.resolve(assetJSON));

    const result = await provider.getAsset(data.hash256s.a);
    verify.verifyAsset(result, assetJSON, assetJSON.type, 'baz');
  });

  test(`getAsset - otherwise, first name`, async () => {
    const assetJSON = factory.createAssetJSON({
      name: [
        { lang: 'foo', name: 'bar' },
        { lang: 'baz', name: 'baz' },
      ],
    });
    client.getAsset = jest.fn(async () => Promise.resolve(assetJSON));

    const result = await provider.getAsset(data.hash256s.a);
    verify.verifyAsset(result, assetJSON, assetJSON.type, 'bar');
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
    verify.verifyMinerTransaction(result.transactions[0], blockJSON.tx[0]);
    verify.verifyConfirmedTransaction(result.transactions[0], blockJSON.tx[0]);
    verify.verifyClaimTransaction(result.transactions[1], blockJSON.tx[1]);
    verify.verifyConfirmedTransaction(result.transactions[1], blockJSON.tx[1]);
    verify.verifyContractTransaction(result.transactions[2], blockJSON.tx[2]);
    verify.verifyConfirmedTransaction(result.transactions[2], blockJSON.tx[2]);
    verify.verifyEnrollmentTransaction(result.transactions[3], blockJSON.tx[3]);
    verify.verifyConfirmedTransaction(result.transactions[3], blockJSON.tx[3]);
    verify.verifyInvocationTransaction(result.transactions[4], blockJSON.tx[4]);
    verify.verifyConfirmedTransaction(result.transactions[4], blockJSON.tx[4]);
    verify.verifyIssueTransaction(result.transactions[5], blockJSON.tx[5]);
    verify.verifyConfirmedTransaction(result.transactions[5], blockJSON.tx[5]);
    verify.verifyPublishTransaction(result.transactions[6], blockJSON.tx[6]);
    verify.verifyConfirmedTransaction(result.transactions[6], blockJSON.tx[6]);
    verify.verifyRegisterTransaction(result.transactions[7], blockJSON.tx[7]);
    verify.verifyConfirmedTransaction(result.transactions[7], blockJSON.tx[7]);
    verify.verifyStateTransaction(result.transactions[8], blockJSON.tx[8]);
    verify.verifyConfirmedTransaction(result.transactions[8], blockJSON.tx[8]);
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

    verify.verifyContract(result, contractJSON);
  });

  const convertedContractParameterTypes = [
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
      verify.verifyContract(result, contractJSON, to);
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

    verify.verifyInvocationTransaction(result, transactionJSON);
  });

  test('getOutput', async () => {
    const outputJSON = factory.createOutputJSON();
    client.getOutput = jest.fn(async () => Promise.resolve(outputJSON));

    const result = await provider.getOutput({ hash: data.hash256s.a, index: 0 });

    verify.verifyOutput(result, outputJSON);
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

    verify.verifyDefaultActions(
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

    verify.verifyCallReceipt(result, callReceiptJSON);
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

    expect(updateSettings).toHaveBeenCalledWith(options);
  });

  test('fastForwardOffset', async () => {
    const fastForwardOffset = jest.fn(async () => Promise.resolve());
    client.fastForwardOffset = fastForwardOffset;
    const options = 10;

    await provider.fastForwardOffset(options);

    expect(fastForwardOffset).toHaveBeenCalledWith(options);
  });

  test('fastForwardToTime', async () => {
    const fastForwardToTime = jest.fn(async () => Promise.resolve());
    client.fastForwardToTime = fastForwardToTime;
    const options = 10;

    await provider.fastForwardToTime(options);

    expect(fastForwardToTime).toHaveBeenCalledWith(options);
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
