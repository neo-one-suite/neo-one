import { common, ScriptBuilder, TransactionModel } from '@neo-one/client-common';
import BN from 'bn.js';
import { JSONRPCClient, JSONRPCHTTPProvider } from '../../provider';

describe('JSONRPCClient Tests', () => {
  const client = new JSONRPCClient(new JSONRPCHTTPProvider('https://staging.neotracker.io/rpc'));
  const address = 'NSVX6sk3z14pSSjFx6WFEGajQXEbmahvwx';
  const addressWithTransfers = 'NiXgSLtGUjTRTgp4y9ax7vyJ9UZAjsRDVt';
  const transactionHash = '0x173dcbc4a88995a0cf7bdd006923d148f787f76ca75621dc4c440ca6d9afbc73';

  test('getBlockHeader', async () => {
    const {
      version,
      hash,
      size,
      previousblockhash,
      merkleroot,
      time,
      index,
      nextconsensus,
      nextblockhash,
      witnesses,
      confirmations,
    } = await client.getBlockHeader(1);

    expect(version).toEqual(0);
    expect(hash).toEqual('0x8f30c34a8a8ef997155aa4a0ef6664d872a127ecc3bb6a85b7bbc55d6d9912f5');
    expect(size).toEqual(691);
    expect(previousblockhash).toEqual('0xc359030132be10fd19cfd0a27e289fe04acb0c5c4ca5254af8a2d99498c7da45');
    expect(merkleroot).toEqual('0x9ff5ba403c81151c0d031b548fe6cff82ef61a01be72c38ecc81d4bc2f1ee01c');
    expect(time).toEqual('1596537327793');
    expect(index).toEqual(1);
    expect(nextconsensus).toEqual('NgPkjjLTNcQad99iRYeXRUuowE4gxLAnDL');
    expect(confirmations).toEqual(369993);
    expect(nextblockhash).toEqual('0x84fa4b26af4b00095d66714a3a2ec63acdeff7ae27ca5d4f6cbe5db2691d7fae');
    expect(witnesses[0].invocation).toEqual(
      'DED/2tpnw4uN5407xKQuwAXw+Hm9L4P51hSMfjwbEcm7pN+aFdn5+d/VxT9ifDX0KQRGlbericqr6h2gQvnJYvHqDECO9w/7PAccs3K3yqAZ4zDTpsnxxDU5EyR1PNNcBUx31lFGyHtjcxhce+YNYxcJc2zOFFk+lFmCBn+ZiF1HZrkPDEBbpwRGODeexXqSws2VQPrOg/BiCNYKmAj3vPW8HvC3ypnly/Hfy8lYF9iZiIighzUALC4QzQpxdq1IdNMSH22jDEAe/l0FF8HXc6e20zT6x0D8XvrITHsKMxxe4S5hGYwojgBDjJPcMwvJbT83AF+sorbZc7SMaCGwT1XOEg+9M0G2DEDOK/OsvMqyKgyHf/gz5QFgQxPjHKuuMoN38+OLuMRP36K4Eunv7oql3KstrgpVIqZHtETEHmxMEFIFXu5hFEa8',
    );
    expect(witnesses[0].verification).toEqual(
      'FQwhAwCbdUDhDyVi5f2PrJ6uwlFmpYsm5BI0j/WoaSe/rCKiDCEDAgXpzvrqWh38WAryDI1aokaLsBSPGl5GBfxiLIDmBLoMIQIUuvDO6jpm8X5+HoOeol/YvtbNgua7bmglAYkGX0T/AQwhAj6bMuqJuU0GbmSbEk/VDjlu6RNp6OKmrhsRwXDQIiVtDCEDQI3NQWOW9keDrFh+oeFZPFfZ/qiAyKahkg6SollHeAYMIQKng0vpsy4pgdFXy1u9OstCz9EepcOxAiTXpE6YxZEPGwwhAroscPWZbzV6QxmHBYWfriz+oT4RcpYoAHcrPViKnUq9FwtBE43vrw==',
    );
  });

  test('getValidators', async () => {
    const validators = await client.getValidators();
    const currentPublicKey = '03daca45da7acf52602c630e58af4f45a894a427fa274544cadac5335a9a293d4e';

    expect(validators.length).toEqual(11);
    expect(validators.some((val) => val.publicKey === currentPublicKey));
  });

  test('getTransactionHeight', async () => {
    const height = await client.getTransactionHeight(transactionHash);

    expect(height).toEqual(1);
  });

  test('getunclaimedgas', async () => {
    const unclaimed = await client.getUnclaimedGas(address);

    expect(unclaimed.address).toEqual(address);
    expect(unclaimed.unclaimed).toEqual('0');
  });

  test('validateAddress', async () => {
    const result = await client.validateAddress(address);

    expect(result.address).toEqual(address);
    expect(result.isvalid).toEqual(true);
  });

  test('getSettings', async () => {
    const settings = await client.getSettings();

    expect(settings.millisecondsPerBlock).toEqual(15000);
  });

  test('getBlock', async () => {
    const block = await client.getBlock(1);

    expect(block).toBeDefined();
    expect(block.hash).toEqual('0x8f30c34a8a8ef997155aa4a0ef6664d872a127ecc3bb6a85b7bbc55d6d9912f5');
    expect(block.nextconsensus).toEqual('NgPkjjLTNcQad99iRYeXRUuowE4gxLAnDL');
    expect(block.tx).toEqual([]);
  });

  test('getBestBlockHash', async () => {
    const hash = await client.getBestBlockHash();

    expect(hash).toBeDefined();
    expect(hash.length).toBe(66);
    expect(common.isUInt256(common.stringToUInt256(hash))).toBeTruthy();
  });

  test('getBlockCount', async () => {
    const count = await client.getBlockCount();

    expect(count).toBeGreaterThan(343360);
  });

  test('getMemPool', async () => {
    const mempool = await client.getMemPool();

    expect(mempool.height).toBeGreaterThan(343360);
    expect(mempool.verified).toEqual([]);
  });

  test('getTransaction', async () => {
    const transaction = await client.getTransaction(transactionHash);

    expect(transaction.hash).toEqual(transactionHash);
    expect(transaction.blockhash).toEqual('0xc359030132be10fd19cfd0a27e289fe04acb0c5c4ca5254af8a2d99498c7da45');
  });

  test('getTransactionReceipt', async () => {
    const receipt = await client.getTransactionReceipt(transactionHash);

    expect(receipt.blockHash).toEqual('0xc359030132be10fd19cfd0a27e289fe04acb0c5c4ca5254af8a2d99498c7da45');
    expect(receipt.blockIndex).toEqual(0);
    expect(receipt.globalIndex).toEqual('-1');
    expect(receipt.transactionHash).toEqual(transactionHash);
    expect(receipt.confirmations).toBeGreaterThan(345557);
    expect(receipt.blockTime).toEqual('1468595301000');
  });

  test('getTransactionHeight', async () => {
    const height = await client.getTransactionHeight(transactionHash);

    expect(height).toEqual(0);
  });

  test('getBlockHash', async () => {
    const hash = await client.getBlockHash(1);

    expect(hash).toEqual('0x8f30c34a8a8ef997155aa4a0ef6664d872a127ecc3bb6a85b7bbc55d6d9912f5');
  });

  test('getConnectionCount', async () => {
    const count = await client.getConnectionCount();

    expect(count).toBeGreaterThan(1);
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
      decrementinternal,
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

    expect(decrementinternal).toBeDefined();
    expect(generationamount).toBeDefined();
    expect(decrementinternal).toBeDefined();
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

  test('getNep5Balances', async () => {
    const balances = await client.getNep5Balances(address);

    expect(balances.address).toEqual(address);
    expect(balances.balance).toEqual([
      {
        amount: '8995481360',
        assethash: '0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc',
        lastupdatedblock: 5284,
      },
    ]);
  });

  test('getNep5Transfers', async () => {
    const transfers = await client.getNep5Transfers(addressWithTransfers, 1468595301000, 1603753592250);

    expect(transfers.address).toEqual(addressWithTransfers);
    expect(transfers.received.length).toEqual(3);
    expect(transfers.sent.length).toEqual(3);
    expect(transfers.sent).not.toEqual(transfers.received);
    expect(transfers.received[0]).toEqual({
      amount: '50000000000',
      assethash: '0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc',
      blockindex: 74129,
      timestamp: 1597856421280,
      transferaddress: '0x31248a51a630048a3fa00c3cfed7428a76d320ad',
      transfernotifyindex: 0,
      txhash: '0x57726a30d9efb510017d698f0fc55e54586bed7878f05b867884bb03dd07aa64',
    });
    expect(transfers.sent[0]).toEqual({
      amount: '50000000000',
      assethash: '0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc',
      blockindex: 74129,
      timestamp: 1597856421280,
      transferaddress: '0x31248a51a630048a3fa00c3cfed7428a76d320ad',
      transfernotifyindex: 0,
      txhash: '0x57726a30d9efb510017d698f0fc55e54586bed7878f05b867884bb03dd07aa64',
    });
  });

  // TODO: run test/ debug
  test('relayTransaction', async () => {
    const receipt = await client.relayTransaction(Buffer.from([]).toString());
    expect(receipt.transaction).toBeDefined();
    expect(receipt.verifyResult).toBeDefined();
  });

  // TODO: run test/ debug
  test('sendRawTransaction', async () => {
    const transaction = new TransactionModel({
      systemFee: new BN(0),
      networkFee: new BN(0),
      script: new ScriptBuilder().emitOp('PUSH0').build(),
    });
    const receipt = await client.sendRawTransaction(transaction.serializeWire().toString('hex'));

    expect(receipt).toEqual(true);
  });

  test('testInvokeRaw', async () => {
    const input = new ScriptBuilder().emitOp('PUSH0').build().toString('hex');
    const { script, state, stack, gasconsumed, notifications } = await client.testInvokeRaw(input);

    expect(script).toEqual('10');
    expect(state).toEqual('HALT');
    expect(stack).toEqual([{ type: 'Integer', value: '0' }]);
    expect(gasconsumed).toEqual('30');
    expect(notifications).toEqual([]);
  });

  test('getApplicationLog', async () => {
    const { gasconsumed, notifications, stack, trigger, txid, vmstate } = await client.getApplicationLog(
      transactionHash,
    );

    expect(gasconsumed).toEqual('0');
    expect(stack).toEqual([]);
    expect(trigger).toEqual('Application');
    expect(vmstate).toEqual('HALT');
    expect(txid).toEqual(transactionHash);
    expect(notifications.length).toEqual(2);
    expect(notifications[0]).toEqual({
      eventname: 'Transfer',
      scripthash: '0xde5f57d430d3dece511cf975a8d37848cb9e0525',
      state: [
        { type: 'Any' },
        { type: 'ByteString', value: '4KPFXK1yAo+1kBdIsZonviH2VAQ=' },
        { type: 'Integer', value: '100000000' },
      ],
    });
  });
});
