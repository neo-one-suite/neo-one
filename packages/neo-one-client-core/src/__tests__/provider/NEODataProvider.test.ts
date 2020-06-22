// tslint:disable no-object-mutation
import { CallReceiptJSON, RawCallReceipt, scriptHashToAddress } from '@neo-one/client-common';
import { Modifiable } from '@neo-one/utils';
import { toArray } from '@reactivex/ix-es2015-cjs/asynciterable/toarray';
import BigNumber from 'bignumber.js';
import { data, factory, keys, verifyDataProvider as verify } from '../../__data__';
import { Hash256 } from '../../Hash256';
import { JSONRPCClient, JSONRPCHTTPProvider, NEODataProvider } from '../../provider';

jest.mock('../../provider/JSONRPCClient');

describe('NEODataProvider', () => {
  const network = 'local';
  const rpcURL = 'https://neotracker.io/rpc';

  let client: Modifiable<JSONRPCClient>;
  let provider: NEODataProvider;
  beforeEach(() => {
    provider = new NEODataProvider({ network, rpcURL });
    // tslint:disable-next-line no-any
    client = (provider as any).mutableClient;
  });

  const neoNotImplementedError = (name: string) =>
    `${name} not implemented for the NEODataProvider. Use a NEOONEDataProvider to use this method.`;

  const verifyCallReceipt = (receipt: RawCallReceipt, receiptJSON: CallReceiptJSON) => {
    verify.verifyInvocationResultSuccess(receipt.result, receiptJSON.result);
  };

  test('setRPCURL', () => {
    const currentClient = client;

    provider.setRPCURL('http://localhost:1340');

    // tslint:disable-next-line no-any
    expect(currentClient).not.toBe((provider as any).mutableClient);
  });

  test('getUnclaimed', async () => {
    const unclaimedJSON = factory.createNeoClaimableJSON();
    client.getClaimable = jest.fn(async () => Promise.resolve(unclaimedJSON));

    const result = await provider.getUnclaimed(keys[0].address);

    expect(result.amount).toEqual(new BigNumber(unclaimedJSON.unclaimed));
    expect(result.unclaimed[0].hash).toEqual(unclaimedJSON.claimable[0].txid);
    expect(result.unclaimed[0].index).toEqual(unclaimedJSON.claimable[0].n);
  });

  test('getUnspent', async () => {
    const unspentJSON = factory.createNeoUnspentJSON();
    client.getUnspents = jest.fn(async () => Promise.resolve(unspentJSON));

    const result = await provider.getUnspentOutputs(keys[0].address);

    expect(result).toHaveLength(1);
    expect(result[0].asset).toEqual(unspentJSON.balance[0].asset_hash);
    expect(result[0].value.toString(10)).toEqual(`0${unspentJSON.balance[0].unspent[0].value}`);
    expect(result[0].address).toEqual(unspentJSON.address);
    expect(result[0].hash).toEqual(unspentJSON.balance[0].unspent[0].txid);
    expect(result[0].index).toEqual(unspentJSON.balance[0].unspent[0].n);
  });

  test('relayTransaction', async () => {
    const transactionJSON = factory.createInvocationTransactionJSON({ sys_fee: '0', net_fee: '0.05' });
    client.relayTransaction = jest.fn(async () =>
      Promise.resolve({
        transaction: transactionJSON,
      }),
    );

    const result = await provider.relayTransaction(factory.createInvocationTransactionModel(), new BigNumber(0.05));

    verify.verifyInvocationTransaction(result.transaction, { ...transactionJSON, size: 201 });
  });

  test('getTransactionReceipt', async () => {
    const transactionReceipt = factory.createTransactionReceipt({
      globalIndex: new BigNumber(-1),
      blockIndex: 10,
      transactionIndex: 0,
    });
    const blockJSON = factory.createBlockJSON();
    client.getTransactionHeight = jest.fn(async () => Promise.resolve(10));
    client.getBlock = jest.fn(async () => Promise.resolve(blockJSON));
    const result = await provider.getTransactionReceipt(data.hash256s.a);

    expect(result).toEqual(transactionReceipt);
  });

  test('getInvocationData', async () => {
    const result = provider.getInvocationData(data.hash256s.a);

    await expect(result).rejects.toThrowError(neoNotImplementedError('getInvocationData'));
  });

  test('testInvoke', async () => {
    const callReceiptJSON = factory.createRawInvocationResultSuccessJSON();
    client.testInvokeRaw = jest.fn(async () => Promise.resolve(callReceiptJSON));
    provider.getOutput = jest.fn(async () => Promise.resolve(factory.createOutput()));
    provider.getAsset = jest.fn(async () => Promise.resolve(factory.createAsset()));
    const result = await provider.testInvoke(factory.createInvocationTransactionModel());

    verifyCallReceipt(result, {
      // tslint:disable-next-line no-any
      result: { ...callReceiptJSON, gas_consumed: '10', gas_cost: '20' } as any,
      actions: [],
    });
  });

  test('getAccount', async () => {
    const accountJSON = factory.createAccountJSON();
    const claimableJSON = factory.createNeoClaimableJSON();
    const unspentsJSON = factory.createNeoUnspentJSON();
    client.getAccount = jest.fn(async () => Promise.resolve(accountJSON));
    client.getClaimable = jest.fn(async () => Promise.resolve(claimableJSON));
    client.getUnspents = jest.fn(async () => Promise.resolve(unspentsJSON));

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
    const receiptData = {
      blockHash: data.hash256s.a,
      blockIndex: 10,
      transactionIndex: 0,
      globalIndex: '-1',
    };
    const blockJSON = factory.createBlockJSON({
      tx: [
        factory.createMinerTransactionJSON({ data: receiptData }),
        factory.createClaimTransactionJSON({ data: receiptData }),
        factory.createContractTransactionJSON({ data: receiptData }),
        factory.createEnrollmentTransactionJSON({ data: receiptData }),
        factory.createInvocationTransactionJSON({ data: receiptData, invocationData: undefined }),
        factory.createIssueTransactionJSON({ data: receiptData }),
        factory.createPublishTransactionJSON({ data: receiptData }),
        factory.createRegisterTransactionJSON({ data: receiptData }),
        factory.createStateTransactionJSON({ data: receiptData }),
      ],
    });
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
    const transactionJSON = factory.createInvocationTransactionJSON({ invocationData: undefined });
    client.getTransaction = jest.fn(async () => Promise.resolve(transactionJSON));

    const result = await provider.getTransaction(transactionJSON.txid);

    verify.verifyInvocationTransaction(result, transactionJSON);
  });

  test('getOutput', async () => {
    const outputJSON = factory.createOutputJSON();
    const transactionJSON = factory.createInvocationTransactionJSON({ invocationData: undefined, vout: [outputJSON] });
    client.getTransaction = jest.fn(async () => Promise.resolve(transactionJSON));

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
    const result = provider.getNetworkSettings();

    await expect(result).rejects.toThrowError(neoNotImplementedError('getNetworkSettings'));
  });

  test('iterStorage', async () => {
    const result = () => provider.iterStorage(keys[0].address);

    expect(result).toThrowError(neoNotImplementedError('iterStorage'));
  });

  test('iterActionsRaw', async () => {
    const result = () => provider.iterActionsRaw({ indexStart: 1, indexStop: 2 });

    expect(result).toThrowError(neoNotImplementedError('iterActionsRaw'));
  });

  test('call', async () => {
    const callReceiptJSON = factory.createRawInvocationResultSuccessJSON();
    client.testInvokeRaw = jest.fn(async () => Promise.resolve(callReceiptJSON));

    const result = await provider.call(keys[0].address, 'foo', []);

    verifyCallReceipt(result, {
      // tslint:disable-next-line no-any
      result: { ...callReceiptJSON, gas_consumed: '10', gas_cost: '20' } as any,
      actions: [],
    });
  });

  test('convertMapContractParamaterType - Map', async () => {
    const contract = factory.createContractJSON({ parameters: ['Map'] });
    client.getContract = jest.fn(async () => Promise.resolve(contract));

    const result = await provider.getContract(keys[0].address);

    expect(result.parameters).toEqual(['Map']);
  });

  test('construction with rpcURL provider works', () => {
    provider = new NEODataProvider({ network, rpcURL: new JSONRPCHTTPProvider(rpcURL) });
    expect(provider).toBeDefined();
  });
});
