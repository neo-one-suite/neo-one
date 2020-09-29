// tslint:disable no-object-mutation
import {
  common,
  ContractParameterTypeJSON,
  scriptHashToAddress,
  StorageItem,
  StorageItemJSON,
} from '@neo-one/client-common';
import { Modifiable } from '@neo-one/utils';
import { toArray } from '@reactivex/ix-es2015-cjs/asynciterable/toarray';
import { data, factory, keys, verifyDataProvider as verify } from '../../__data__';
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
    client.getUnclaimedGas = jest.fn(async () =>
      Promise.resolve({ unclaimed: data.bigNumbers.a.toString(10), address: keys[0].address }),
    );

    const result = await provider.getUnclaimed(keys[0].address);

    expect(result).toEqual(data.bigNumbers.a);
  });

  test('relayTransaction', async () => {
    const transactionWithInvocationDataJSON = factory.createTransactionWithInvocationDataJSON();
    client.relayTransaction = jest.fn(async () =>
      Promise.resolve({
        transaction: transactionWithInvocationDataJSON,
      }),
    );

    const result = await provider.relayTransaction(factory.createTransactionModel());

    verify.verifyTransaction(result.transaction, transactionWithInvocationDataJSON);
  });

  test('verifyConvertTransaction', async () => {
    const transactionJSON = factory.createTransactionWithInvocationDataJSON();

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

    const result = await provider.relayTransaction(factory.createTransactionModel());

    if (result.verifyResult === undefined) {
      throw new Error('for TS');
    }

    expect(result.verifyResult.verifications).toEqual([
      {
        failureMessage: 'test',
        witness: verificationScriptJSON.witness,
        address: scriptHashToAddress(verificationScriptJSON.hash),
        actions: [
          convertAction(common.uInt256ToString(common.ZERO_UINT256), -1, transactionJSON.hash, -1, 0, actionJSON),
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
    const transactionJSON = factory.createTransactionWithInvocationDataJSON();
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
      transactionJSON.hash,
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
    const { data: _data, ...transactionJSON } = factory.createTransactionWithInvocationDataJSON();

    // tslint:disable:no-any
    client.getInvocationData = jest.fn(async () => Promise.resolve(transactionJSON.invocationData) as any);
    client.getTransaction = jest.fn((async () => Promise.resolve(transactionJSON)) as any);
    // tslint:enable:no-any

    await expect(provider.getInvocationData(data.hash256s.a)).rejects.toMatchSnapshot();
  });

  test('testInvoke', async () => {
    const callReceiptJSON = factory.createCallReceiptJSON();
    client.testInvocation = jest.fn(async () => Promise.resolve(callReceiptJSON));

    const result = await provider.testInvoke(factory.createTransactionModel());

    verify.verifyCallReceipt(result, callReceiptJSON);
  });

  test('getBlock', async () => {
    const blockJSON = factory.createBlockJSON();
    client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));

    const result = await provider.getBlock(10);

    expect(result.version).toEqual(blockJSON.version);
    expect(result.previousBlockHash).toEqual(blockJSON.previousblockhash);
    expect(result.merkleRoot).toEqual(blockJSON.merkleroot);
    expect(result.time).toEqual(blockJSON.time);
    expect(result.index).toEqual(blockJSON.index);
    expect(result.nextConsensus).toEqual(blockJSON.nextconsensus);
    expect(result.witnesses.length).toEqual(blockJSON.witnesses.length);
    expect(result.witnesses).toEqual(blockJSON.witnesses);
    expect(result.hash).toEqual(blockJSON.hash);
    expect(result.witness).toEqual(blockJSON.witnesses[0]);
    expect(result.size).toEqual(blockJSON.size);
    expect(result.transactions.length).toEqual(blockJSON.tx.length);
    verify.verifyTransaction(result.transactions[0], blockJSON.tx[0]);
    verify.verifyConfirmedTransaction(result.transactions[0], blockJSON.tx[0]);
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
    ['Any', 'Any'],
    ['Signature', 'Signature'],
    ['Boolean', 'Boolean'],
    ['Integer', 'Integer'],
    ['Hash160', 'Hash160'],
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
      const contractJSON = factory.createContractJSON({
        manifest: {
          abi: {
            methods: [
              { name: `test ${from}`, returnType: from as ContractParameterTypeJSON, offset: 0, parameters: [] },
            ],
          },
          // tslint:disable-next-line: no-any
        } as any,
      });
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
    const transactionJSON = factory.createTransactionJSON();
    client.getTransaction = jest.fn(async () => Promise.resolve(transactionJSON));

    const result = await provider.getTransaction(transactionJSON.hash);

    verify.verifyTransaction(result, transactionJSON);
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
    if (transactionJSON.data === undefined || transactionJSON.invocationData === undefined) {
      throw new Error('For TS');
    }

    verify.verifyDefaultActions(
      result,
      transactionJSON.invocationData.actions,
      transactionJSON.data.blockIndex,
      transactionJSON.data.blockHash,
      transactionJSON.data.transactionIndex,
      transactionJSON.hash,
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

  test('construction with rpcURL provider works', () => {
    provider = new NEOONEDataProvider({ network, rpcURL: new JSONRPCHTTPProvider(rpcURL) });
    expect(provider).toBeDefined();
  });
});
