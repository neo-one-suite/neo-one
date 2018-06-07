/* @flow */
import { NEOONEProvider, privateKeyToAddress } from '@neo-one/client';
import { common } from '@neo-one/client-core';

import { DEFAULT_PRIVATE_KEYS } from '../bootstrap';

import { getRPC } from '../__data__/bootstrapTestUtils';

describe('bootstrap with rpc', () => {
  test('bootstrap - rpc', async () => {
    const network = 'priv';

    await one.execute(`create network ${network}`);
    const rpcURL = await getRPC(network);

    const provider = new NEOONEProvider({
      options: [{ network, rpcURL }],
    });
    await one.execute(`bootstrap --rpc ${rpcURL} --testing-only`);

    const accounts = await Promise.all(
      DEFAULT_PRIVATE_KEYS.map((key) =>
        provider.read(network).getAccount(privateKeyToAddress(key)),
      ),
    );

    const assets = [];
    for (const account of accounts) {
      expect(Object.keys(account.balances).length).toBeGreaterThanOrEqual(2);
      if (Object.keys(account.balances).length > 2) {
        const accountAssets = Object.keys(account.balances).slice(2);
        accountAssets.forEach((asset) => {
          if (!assets.includes(asset)) {
            assets.push(asset);
          }
        });
      }
      expect(
        account.balances[common.NEO_ASSET_HASH].toNumber(),
      ).toBeGreaterThanOrEqual(0);
      expect(
        account.balances[common.GAS_ASSET_HASH].toNumber(),
      ).toBeGreaterThanOrEqual(0);
    }
    expect(assets.length).toEqual(3);

    const blockCount = await provider.read(network).getBlockCount();

    const blockIndicies = [];
    for (let i = blockCount - 1; i >= 0; i -= 1) {
      blockIndicies.push(i);
    }
    const blocks = await Promise.all(
      blockIndicies.map((index) => provider.read(network).getBlock(index)),
    );
    const transactionCount = blocks.reduce(
      (acc, block) => acc + block.transactions.length,
      0,
    );
    expect(transactionCount).toEqual(40);
  });
});
