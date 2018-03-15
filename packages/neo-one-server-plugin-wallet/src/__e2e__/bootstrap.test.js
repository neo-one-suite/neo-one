/* @flow */
import { addressToScriptHash } from '@neo-one/client';
import _ from 'lodash';

async function testAssetIssue({
  numWallets,
  asset,
  network,
}: {|
  numWallets: number,
  asset: string,
  network: string,
|}): Promise<void> {
  const assetWalletDescribe = await one.execute(
    `describe wallet ${asset}-wallet --network ${network} --json`,
  );
  const assetWallet = one.parseJSON(assetWalletDescribe);
  const balances = assetWallet[7][1].table.slice(1);

  expect(balances.length).toEqual(2);
  let expectedAssetCount = 0;
  for (const balance of balances) {
    if (balance[0] === 'GAS') {
      expectedAssetCount += 1;
      expect(Number(balance[1])).toEqual(44510);
    } else if (balance[0] === asset) {
      expectedAssetCount += 1;
      expect(Number(balance[1])).toBeGreaterThan(450000);
    }
  }
  expect(expectedAssetCount).toEqual(2);

  const walletNames = [];
  for (let i = 1; i < numWallets + 1; i += 1) {
    walletNames.push(`wallet-${i}`);
  }

  const walletNamesSplit = _.chunk(walletNames, 10);
  let walletDescribes = [];

  const chunkOne = await Promise.all(
    walletNamesSplit[0].map(walletName =>
      one.execute(`describe wallet ${walletName} --network ${network} --json`),
    ),
  );
  walletDescribes.push(chunkOne);

  if (walletNamesSplit.length === 2) {
    const chunkTwo = await Promise.all(
      walletNamesSplit[1].map(walletName =>
        one.execute(
          `describe wallet ${walletName} --network ${network} --json`,
        ),
      ),
    );
    walletDescribes.push(chunkTwo);
  }
  walletDescribes = _.flatten(walletDescribes);

  const walletBalances = walletDescribes.map(walletDescribe =>
    one.parseJSON(walletDescribe)[7][1].table.slice(1),
  );
  let assetWalletCount = 0;
  for (const walletBalance of walletBalances) {
    for (const balance of walletBalance) {
      if (balance[0] === asset) {
        assetWalletCount += 1;
        expect(Number(balance[1])).toBeGreaterThan(10);
        break;
      }
    }
  }
  expect(assetWalletCount).toBeGreaterThanOrEqual(Math.floor(numWallets / 3));
}

async function testBootstrap(
  command: string,
  numWallets: number,
  network: string,
): Promise<void> {
  await one.execute(`create network ${network}`);
  await one.execute(command);

  const output = await one.execute(`get wallet --network ${network} --json`);
  let wallets = one.parseJSON(output);
  wallets = wallets.filter(wallet => wallet[0] === network);
  // Bootstrap creates numWallets number of wallets
  // Wallets will also have the master wallet plus
  // 3 asset wallets
  expect(wallets.length).toEqual(numWallets + 4);

  let neoBalanceCount = 0;
  let gasBalanceCount = 0;
  for (const wallet of wallets) {
    // Check wallet is on network boottest
    expect(wallet[0]).toEqual(network);
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
  // Check that at least ceil(numWallets/2) have nonzero neo balances
  // and ceil(nuwallets/2 + 3) have nonzero gas balances to account for asset wallets.
  // This is the minimum number of wallets that could have balance,
  // so this checks that the transfers succeeded
  expect(neoBalanceCount).toBeGreaterThanOrEqual(Math.ceil(numWallets / 2));
  expect(gasBalanceCount).toBeGreaterThanOrEqual(Math.ceil(numWallets / 2) + 3);

  const assets = ['redcoin', 'bluecoin', 'greencoin'];
  await Promise.all(
    assets.map(asset =>
      testAssetIssue({
        numWallets,
        network,
        asset,
      }),
    ),
  );
}

describe('bootstrap', () => {
  test('bootstrap - default', async () => {
    const numWallets = 10;
    const network = 'boottest-1';
    const command = `bootstrap --network ${network}`;

    await testBootstrap(command, numWallets, network);
  });

  test('bootstrap - 20 wallets', async () => {
    const numWallets = 20;
    const network = 'boottest-2';
    const command = `bootstrap --network ${network} --wallets 20`;

    await testBootstrap(command, numWallets, network);
  });
});
