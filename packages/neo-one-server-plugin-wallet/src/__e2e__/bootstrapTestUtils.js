/* @flow */
import { addressToScriptHash, NEOONEProvider } from '@neo-one/client';
import { common } from '@neo-one/client-core';

export async function getRPC(network: string): Promise<string> {
  const networkOutput = await one.execute(`describe network ${network} --json`);
  const networkInfo = one.parseJSON(networkOutput);

  return networkInfo[3][1].table[1][3];
}

async function testAssetIssue({
  assetWalletAddresses,
  walletAddresses,
  network,
}: {|
  assetWalletAddresses: Array<string>,
  walletAddresses: Array<string>,
  network: string,
|}): Promise<void> {
  const rpcURL = await getRPC(network);
  const provider = new NEOONEProvider({
    options: [{ network, rpcURL }],
  });

  const assetAccounts = await Promise.all(
    assetWalletAddresses.map((address) =>
      provider.read(network).getAccount(address),
    ),
  );

  const assets = {};
  for (const account of assetAccounts) {
    expect(Object.keys(account.balances).length).toEqual(2);
    expect(account.balances[common.GAS_ASSET_HASH].toNumber()).toEqual(44510);
    expect(
      account.balances[Object.keys(account.balances)[1]].toNumber(),
    ).toBeGreaterThan(450000);
    assets[Object.keys(account.balances)[1]] = 0;
  }

  const accounts = await Promise.all(
    walletAddresses.map((address) =>
      provider.read(network).getAccount(address),
    ),
  );

  for (const account of accounts) {
    for (const balance of Object.keys(account.balances)) {
      if (
        balance !== common.NEO_ASSET_HASH &&
        balance !== common.GAS_ASSET_HASH
      ) {
        assets[balance] += 1;
      }
    }
  }
  expect(Object.keys(assets).length).toEqual(3);
  for (const asset of Object.keys(assets)) {
    expect(assets[asset]).toBeGreaterThanOrEqual(
      Math.floor(walletAddresses.length / 3),
    );
  }
}

export default (async function testBootstrap(
  command: string,
  numWallets: number,
  network: string,
): Promise<void> {
  await one.execute(`create network ${network}`);
  await one.execute(command);

  const output = await one.execute(`get wallet --network ${network} --json`);
  let wallets = one.parseJSON(output);
  wallets = wallets.filter((wallet) => wallet[0] === network);
  // Bootstrap creates numWallets number of wallets
  // Wallets will also have the master wallet plus
  // 3 asset wallets
  expect(wallets.length).toEqual(numWallets + 4);

  let neoBalanceCount = 0;
  let gasBalanceCount = 0;
  const walletAddresses = [];
  const assetWalletAddresses = [];
  for (const wallet of wallets) {
    // Check wallet is on network boottest
    expect(wallet[0]).toEqual(network);
    // Assert address is a valid address
    expect(addressToScriptHash(wallet[2])).toBeDefined();
    if (wallet[1].substring(0, 6) === 'wallet') {
      walletAddresses.push(wallet[2]);
    } else if (wallet[1].includes('coin')) {
      assetWalletAddresses.push(wallet[2]);
    }
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
  // Check that at least ceil(numWallets/2) have nonzero neo balances
  // and ceil(nuwallets/2 + 3) have nonzero gas balances to account for asset wallets.
  // This is the minimum number of wallets that could have balance,
  // so this checks that the transfers succeeded
  expect(neoBalanceCount).toBeGreaterThanOrEqual(Math.ceil(numWallets / 2));
  expect(gasBalanceCount).toBeGreaterThanOrEqual(Math.ceil(numWallets / 2) + 3);

  await testAssetIssue({ assetWalletAddresses, walletAddresses, network });
});
