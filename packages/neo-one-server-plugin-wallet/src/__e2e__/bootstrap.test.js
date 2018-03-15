/* @flow */
import { addressToScriptHash } from '@neo-one/client';

async function testBootstrap(
  command: string,
  numWallets: number,
): Promise<void> {
  await one.execute('create network boottest');
  await one.execute(command);

  const output = await one.execute('get wallet --network boottest --json');
  let wallets = one.parseJSON(output);

  // Bootstrap creates numWallets number of wallets
  // Wallets will also have the master wallet plus the header row
  expect(wallets.length).toEqual(numWallets + 2);
  // remove header row
  wallets = wallets.slice(1);

  let neoBalanceCount = 0;
  let gasBalanceCount = 0;

  for (const wallet of wallets) {
    // Check wallet is on network boottest
    expect(wallet[0]).toEqual('boottest');
    // Assert address is a valid address
    expect(addressToScriptHash(wallet[2])).toBeDefined();
    // Check wallet is unlocked
    expect(wallet[3]).toEqual('Yes');
    // Check NEO balance is a number 0 or greater
    expect(Number(wallet[4])).toBeGreaterThanOrEqual(0);
    if (Number(wallet[4]) > 0) {
      neoBalanceCount += 1;
    }
    // Check GAS balance is a number 0 or greater
    expect(Number(wallet[5])).toBeGreaterThanOrEqual(0);
    if (Number(wallet[5]) > 0) {
      gasBalanceCount += 1;
    }
  }
  // Check that at least ceil((numWallets - 3)/2) have nonzero neo balances
  // and ceil((nuwallets-3)/2 + 3) have nonzero gas balances.
  // This is the minimum number of wallets that could have balance,
  // so this checks that the transfers succeeded
  expect(neoBalanceCount).toBeGreaterThanOrEqual(
    Math.ceil((numWallets - 3) / 2),
  );
  expect(gasBalanceCount).toBeGreaterThanOrEqual(
    Math.ceil((numWallets - 3) / 2) + 3,
  );
}

describe('bootstrap', () => {
  test('bootstrap - default', async () => {
    const numWallets = 13;
    const command = 'bootstrap --network boottest';

    await testBootstrap(command, numWallets);
  });

  test('bootstrap - 20 wallets', async () => {
    const numWallets = 23;
    const command = 'bootstrap --network boottest --wallets 20';

    await testBootstrap(command, numWallets);
  });
});
