/* @flow */
import { addressToScriptHash } from '@neo-one/client';

describe('bootstrap', () => {
  test.only('bootstrap on active network - default', async () => {
    const numWallets = 10;

    await one.execute('create network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    await one.execute('bootstrap');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    const output = await one.execute('get wallet --json');
    const wallets = one.parseJSON(output);

    expect(wallets.length).toEqual(numWallets + 2);
    wallets.slice(1);
    // eslint-disable-next-line
    for (const wallet in wallets) {
      expect(wallet[0]).toEqual('boottest');
      expect(addressToScriptHash(wallet[2])).toBeDefined();
      expect(wallet[3]).toEqual('Yes');
      expect(wallet[4]).toBeGreaterThan(0);
      expect(wallet[5]).toBeGreaterThan(0);
    }
  });

  test('bootstrap on active network - 20 wallets', async () => {
    const numWallets = 20;

    await one.execute('create network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    await one.execute('bootstrap --wallets 20');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    const output = await one.execute('get wallet --json');
    const wallets = one.parseJSON(output);

    expect(wallets.length).toEqual(numWallets + 2);
    wallets.slice(1);
    // eslint-disable-next-line
    for (const wallet in wallets) {
      expect(wallet[0]).toEqual('boottest');
      expect(addressToScriptHash(wallet[2])).toBeDefined();
      expect(wallet[3]).toEqual('Yes');
      expect(wallet[4]).toBeGreaterThan(0);
      expect(wallet[5]).toBeGreaterThan(0);
    }
  });

  test('bootstrap on inactive network', async () => {
    const numWallets = 10;

    await one.execute('create network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));
    await one.execute('deactivate network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    await one.execute('bootstrap --network boottest');
    await new Promise(resolve => setTimeout(() => resolve(), 10000));

    const output = await one.execute('get wallet --json');
    const wallets = one.parseJSON(output);

    expect(wallets.length).toEqual(numWallets + 2);
    wallets.slice(1);
    // eslint-disable-next-line
    for (const wallet in wallets) {
      expect(wallet[0]).toEqual('boottest');
      expect(addressToScriptHash(wallet[2])).toBeDefined();
      expect(wallet[3]).toEqual('Yes');
      expect(wallet[4]).toBeGreaterThan(0);
      expect(wallet[5]).toBeGreaterThan(0);
    }
  });
});
