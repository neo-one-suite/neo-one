/* @flow */
import { NEOONEProvider, privateKeyToAddress } from '@neo-one/client';
import { common } from '@neo-one/client-core';

import { getRPC } from './bootstrapTestUtils';

const PRIVATE_KEYS = [
  'e35ecb8189067a0a06f17f163be3db95c4b7805c81b48af1f4b8bbdfbeeb1afd',
  '6cad314f75624a26b780368a8b0753d10815ca44c1fca6eb3972484548805d9e',
  'e91dc6e5fffcae0510ef5a7e41675d024e5b286769b3ff455e71e01a4cf16ef0',
  'fa38cb00810d173e14631219d8ee689ee183a3d307c3c8bd2e1234d332dd3255',
];

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
      PRIVATE_KEYS.map(key =>
        provider.read(network).getAccount(privateKeyToAddress(key)),
      ),
    );

    const assets = [];
    for (const account of accounts) {
      expect(Object.keys(account.balances).length).toBeGreaterThanOrEqual(2);
      if (Object.keys(account.balances).length > 2) {
        const accountAssets = Object.keys(account.balances).slice(2);
        accountAssets.forEach(asset => {
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
      blockIndicies.map(index => provider.read(network).getBlock(index)),
    );
    const transactionCount = blocks.reduce(
      (acc, block) => acc + block.transactions.length,
      0,
    );
    expect(transactionCount).toBeGreaterThan(40);
  });
});
