/* @flow */
import { addressToScriptHash } from '@neo-one/client';

describe('bootstrap', () => {
  test('bootstrap - default', async () => {
    const numWallets = 10;

    await one.execute('create network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    await one.execute('bootstrap --network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    const output = await one.execute('get wallet --network boottest --json');
    let wallets = one.parseJSON(output);

    expect(wallets.length).toEqual(numWallets + 2);
    wallets = wallets.slice(1);

    for (const wallet of wallets) {
      expect(wallet[0]).toEqual('boottest');
      expect(addressToScriptHash(wallet[2])).toBeDefined();
      expect(wallet[3]).toEqual('Yes');
      expect(Number(wallet[4])).toBeGreaterThan(0);
      expect(Number(wallet[5])).toBeGreaterThan(0);
    }
  });

  test('bootstrap - 20 wallets', async () => {
    const numWallets = 20;

    await one.execute('create network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    await one.execute('bootstrap --network boottest --wallets 20');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    const output = await one.execute('get wallet --network boottest --json');
    let wallets = one.parseJSON(output);

    expect(wallets.length).toEqual(numWallets + 2);
    wallets = wallets.slice(1);

    for (const wallet of wallets) {
      expect(wallet[0]).toEqual('boottest');
      expect(addressToScriptHash(wallet[2])).toBeDefined();
      expect(wallet[3]).toEqual('Yes');
      expect(Number(wallet[4])).toBeGreaterThan(0);
      expect(Number(wallet[5])).toBeGreaterThan(0);
    }
  });
});
