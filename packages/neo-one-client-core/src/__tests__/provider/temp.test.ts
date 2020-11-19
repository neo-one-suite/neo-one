import { common, ScriptBuilder, UInt160 } from '@neo-one/client-common';
import { Hash160 } from '../../Hash160';
import { JSONRPCClient, JSONRPCHTTPProvider } from '../../provider';

describe('JSONRPCClient Tests', async () => {
  const neo = 'http://seed1t.neo.org:20332/';
  const staging = 'https://staging.neotracker.io/rpc';
  const local = 'http://localhost:8080/rpc';
  const neoClient = new JSONRPCClient(new JSONRPCHTTPProvider(neo));
  const stagingClient = new JSONRPCClient(new JSONRPCHTTPProvider(local));
  const client = stagingClient;
  const address = 'NSVX6sk3z14pSSjFx6WFEGajQXEbmahvwx';
  const addressAsScriptHash = '0x4262ca65a1523a3d01a96d15471ce1ee9a1f2948';
  const addressWithTransfers = 'NiXgSLtGUjTRTgp4y9ax7vyJ9UZAjsRDVt';
  const addressWithTransfersAsScriptHash = '0x8e9193bb505b10f98e7fb8b3e4bb188eccc213f8';
  const transactionHash = '0x173dcbc4a88995a0cf7bdd006923d148f787f76ca75621dc4c440ca6d9afbc73';
  // addressToScriptHash(Hash160.NEO) = 0xde5f57d430d3dece511cf975a8d37848cb9e0525;

  const getStorageArgs = (hash: UInt160, num: number) => [
    common.uInt160ToString(hash),
    Buffer.from([num]).toString('hex'),
  ];

  const methods: Array<[string, ReadonlyArray<string | number>]> = [
    ['getStorage', getStorageArgs(common.nativeHashes.NEO, 11)],
    ['getStorage', getStorageArgs(common.nativeHashes.NEO, 1)],
    ['getStorage', getStorageArgs(common.nativeHashes.NEO, 14)], // 0xde5f57d430d3dece511cf975a8d37848cb9e0525, 0e
    ['getStorage', getStorageArgs(common.nativeHashes.GAS, 11)],
    ['getApplicationLog', [transactionHash]],
    ['getBlock', [1]],
    ['getNep5Balances', [address]],
    ['getNep5Transfers', [addressWithTransfers, 1468595301000, 1603753592250]],
    ['getBestBlockHash', []],
    ['getBlockCount', []],
    ['getContract', [Hash160.NEO]],
    ['getMemPool', []],
    ['getTransaction', [transactionHash]],
    ['testInvokeRaw', [new ScriptBuilder().emitOp('PUSH0').build().toString('hex')]],
    ['getUnclaimedGas', [address]],
    ['getTransactionHeight', [transactionHash]],
    ['getBlockHash', [1]],
    ['getBlockHeader', [1]],
    ['getValidators', []],
    ['validateAddress', [address]],
    // ['relayTransaction'], /// see sendrawtransaction.test.ts
    // ['sendRawTransaction'], // see sendrawtransaction.test.ts
    // ['getInvocationData'],
    // ['runConsensusNow'],
    // ['updateSettings'],
    // ['fastForwardOffset'],
    // ['fastForwardToTime'],
    // ['reset'],
    // ['getNEOTrackerURL'],
    // ['resetProject'],
  ];

  const getBoth = async (method: string, args: ReadonlyArray<string | number> = []) =>
    // @ts-ignore
    Promise.all([neoClient[method](...args), stagingClient[method](...args)]);

  methods.forEach(async (tuple) => {
    test(tuple[0], async () => {
      const [neoResult, stagingResult] = await getBoth(tuple[0], tuple[1]);
      expect(neoResult).toEqual(stagingResult);
    });
  });

  // TODO: needs to be looked into
  test('getStorage - Policy', async () => {
    const getStorageByNum = (hashIn: UInt160, num: number) =>
      client.getStorage(common.uInt160ToString(hashIn), Buffer.from([num]).toString('hex'));

    const hash = common.nativeHashes.Policy;
    // 0xce06595079cd69583126dbfd1d2e25cca74cffe9

    const maxPerBlock = await getStorageByNum(hash, 23);
    expect(maxPerBlock).toEqual('00020000');

    const feePerByte = await getStorageByNum(hash, 10);
    expect(feePerByte).toEqual('e803000000000000');

    const blockedAccounts = await getStorageByNum(hash, 15);
    expect(blockedAccounts).toEqual('00');

    const maxBlockSize = await getStorageByNum(hash, 12);
    expect(maxBlockSize).toEqual('00000400');

    const maxBlockSysFee = await getStorageByNum(hash, 17);
    expect(maxBlockSysFee).toEqual('00282e8cd1000000');
  });

  test('getSettings', async () => {
    const settings = await client.getSettings();

    expect(settings.millisecondsPerBlock).toEqual(15000);
  });

  test('getTransactionReceipt', async () => {
    const receipt = await client.getTransactionReceipt(transactionHash);

    expect(receipt.blockHash).toEqual('0xc359030132be10fd19cfd0a27e289fe04acb0c5c4ca5254af8a2d99498c7da45');
    expect(receipt.blockIndex).toEqual(0);
    expect(receipt.globalIndex).toEqual('-1');
    expect(receipt.transactionHash).toEqual(transactionHash);
    expect(receipt.confirmations).toBeDefined();
    expect(receipt.blockTime).toEqual('1468595301000');
  });

  test('getConnectionCount', async () => {
    const count = await client.getConnectionCount();

    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('getVersion', async () => {
    const version = await client.getVersion();

    expect(version.tcpport).toBeDefined();
    expect(version.wsport).toBeDefined();
    expect(version.nonce).toBeDefined();
    expect(version.useragent).toEqual('NEO:neo-one-js:3.0.0-preview3');
  });

  test('getConnectedPeers', async () => {
    const peers = await client.getConnectedPeers();

    expect(peers.length).toBeGreaterThan(0);
    expect(peers[0]).toBeDefined();
    expect(peers[0].port).toEqual(20333);
  });

  test('getNetworkSettings', async () => {
    const {
      decrementinterval,
      generationamount,
      privatekeyversion,
      standbyvalidators,
      messagemagic,
      addressversion,
      standbycommittee,
      committeememberscount,
      validatorscount,
      millisecondsperblock,
      memorypoolmaxtransactions,
    } = await client.getNetworkSettings();

    expect(decrementinterval).toBeDefined();
    expect(generationamount).toBeDefined();
    expect(privatekeyversion).toBeDefined();
    expect(standbyvalidators).toBeDefined();
    expect(messagemagic).toBeDefined();
    expect(addressversion).toBeDefined();
    expect(standbycommittee).toBeDefined();
    expect(committeememberscount).toBeDefined();
    expect(validatorscount).toBeDefined();
    expect(millisecondsperblock).toBeDefined();
    expect(memorypoolmaxtransactions).toBeDefined();
  });
});
