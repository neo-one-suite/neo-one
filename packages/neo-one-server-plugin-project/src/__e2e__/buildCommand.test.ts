/// <reference types="@neo-one/types/e2e"/>

import { common, crypto, privateKeyToAddress } from '@neo-one/client-common';
import * as path from 'path';
import {
  getClients,
  getContracts,
  getNetworks,
  getWallets,
  LOCAL,
  TO_PRIVATE_KEY,
  TO_PUBLIC_KEY,
  verifyEscrowContract,
  verifyICOContract,
  verifySmartContractsManual,
  verifySmartContractsTest,
  verifyTokenContract,
} from '../__data__/buildCommand.bootstrap';

const TEST_DATA_ROOT = path.resolve(__dirname, '../__data__/ico');

describe('buildCommand', () => {
  test('build', async () => {
    crypto.addPublicKey(common.stringToPrivateKey(TO_PRIVATE_KEY), common.stringToECPoint(TO_PUBLIC_KEY));

    const nowSeconds = Math.round(Date.now() / 1000);

    await one.execute('build --no-progress', { cwd: TEST_DATA_ROOT });

    const networks = await getNetworks();
    expect(networks.length).toEqual(1);

    const network = networks[0];
    expect(network.name.includes('ico-local')).toBeTruthy();
    expect(network.type).toEqual('private');
    expect(network.nodes.length).toEqual(1);
    expect(network.nodes[0].live).toBeTruthy();
    expect(network.nodes[0].ready).toBeTruthy();

    const wallets = await getWallets(LOCAL);
    expect(wallets.length).toEqual(11);
    const wallet = wallets.find((localWallet) => localWallet.name.includes('master'));
    if (wallet === undefined) {
      expect(wallet).toBeDefined();
      throw new Error('For TS');
    }

    const { client } = await getClients(network, wallet);

    const contracts = await getContracts(client, LOCAL);
    verifyICOContract(contracts.find((contract) => contract.name === 'ICO'));
    verifyTokenContract(contracts.find((contract) => contract.name === 'Token'));
    verifyEscrowContract(contracts.find((contract) => contract.name === 'Escrow'));

    await Promise.all([
      verifySmartContractsTest(TEST_DATA_ROOT, nowSeconds),
      verifySmartContractsManual(
        TEST_DATA_ROOT,
        { ...wallet.accountID, network: LOCAL },
        { network: LOCAL, address: privateKeyToAddress(TO_PRIVATE_KEY) },
        nowSeconds,
      ),
    ]);

    await one.execute('build --no-progress --reset', { cwd: TEST_DATA_ROOT });
  });
});
