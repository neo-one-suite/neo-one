/* @flow */
import {
  type GetCLIResourceOptions,
  type InteractiveCLIArgs,
} from '@neo-one/server-plugin';
import {
  Client,
  LocalKeyStore,
  LocalUserAccountProvider,
  LocalMemoryStore,
  NEOONEProvider,
  wifToPrivateKey,
  type Transfer,
} from '@neo-one/client';
import { common } from '@neo-one/client-core';
import {
  constants as networkConstants,
  type Network,
} from '@neo-one/server-plugin-network';

import { of } from 'rxjs/observable/of';
import BigNumber from 'bignumber.js';

import type { Wallet } from './WalletResourceType';
import WalletPlugin from './WalletPlugin';
import constants from './constants';

const DEFAULT_NUM_WALLETS = 10;

const getNetwork = async ({
  cli,
  options,
}: GetCLIResourceOptions): Promise<string> => {
  const { network: networkName } = options;
  if (networkName != null && typeof networkName === 'string') {
    return networkName;
  }

  const { network } = await cli.getSession(networkConstants.PLUGIN);
  if (network != null && typeof network === 'string') {
    return network;
  }

  throw new Error(
    'Bootstrap requires a network. Activate a network by ' +
      'running `activate network <name>` or specify the network via ' +
      '`--network <name>`',
  );
};

async function getWallet(
  walletName: string,
  networkName: string,
  { cli }: InteractiveCLIArgs,
  plugin: WalletPlugin,
): Promise<Wallet> {
  const walletResource = await plugin.walletResourceType.getResource({
    name: constants.makeWallet({
      network: networkName,
      name: walletName,
    }),
    client: cli.client,
    options: {},
  });

  return ((walletResource: $FlowFixMe): Wallet);
}

async function createWallet(
  walletName: string,
  networkName: string,
  { cli }: InteractiveCLIArgs,
  keystore: LocalKeyStore,
  plugin: WalletPlugin,
): Promise<void> {
  await cli.client.createResource({
    plugin: constants.PLUGIN,
    resourceType: constants.WALLET_RESOURCE_TYPE,
    name: constants.makeWallet({ name: walletName, network: networkName }),
    options: {
      network: networkName,
    },
    cancel$: of(),
  });
  const wallet = await (getWallet(
    walletName,
    networkName,
    { cli },
    plugin,
  ): $FlowFixMe);

  await keystore.addAccount({
    network: networkName,
    name: wallet.name,
    privateKey: wifToPrivateKey(wallet.wif),
  });
}

function getNumWallets(options): number {
  const { wallets } = options;
  if (wallets != null && typeof wallets === 'number') {
    return wallets;
  }
  return DEFAULT_NUM_WALLETS;
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function randomIntDist(seed: number): number {
  if (seed < 40) {
    return randomInt(100);
  } else if (seed >= 40 && seed < 90) {
    return randomInt(1000);
  } else if (seed >= 90 && seed < 97) {
    return randomInt(10000);
  } else if (seed >= 97 && seed < 100) {
    return randomInt(100000);
  }
  return randomInt(1000000);
}

async function createTransfers(
  walletName: string,
  networkName: string,
  { cli }: InteractiveCLIArgs,
  plugin: WalletPlugin,
): Promise<Array<Transfer>> {
  const wallet = await getWallet(walletName, networkName, { cli }, plugin);

  const seed = randomInt(100);
  const neo = randomIntDist(seed);
  const gas = randomIntDist(seed);

  return Promise.resolve([
    {
      amount: new BigNumber(neo),
      asset: common.NEO_ASSET_HASH,
      to: wallet.address,
    },
    {
      amount: new BigNumber(gas),
      asset: common.GAS_ASSET_HASH,
      to: wallet.address,
    },
  ]);
}

export default (plugin: WalletPlugin) => ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command('bootstrap', 'Bootstraps a Network with test data.')
    .option('-n, --network <name>', 'Network to bootstrap')
    .option('--wallets <number>', 'Number of wallets to create - default 10')
    .action(async args => {
      const networkName = await getNetwork({
        cli,
        args,
        options: args.options,
      });

      const networkResource = await cli.client.getResource({
        plugin: networkConstants.PLUGIN,
        name: networkName,
        resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
        options: {},
      });
      if (networkResource == null) {
        throw new Error(`Network ${networkName} does not exist.`);
      }
      const network = ((networkResource: $FlowFixMe): Network);

      const masterWallet = await (getWallet(
        constants.MASTER_WALLET,
        network.name,
        { cli },
        plugin,
      ): $FlowFixMe);

      const keystore = new LocalKeyStore({
        store: new LocalMemoryStore(),
      });

      await keystore.addAccount({
        network: network.name,
        name: masterWallet.name,
        privateKey: wifToPrivateKey(masterWallet.wif),
      });

      const wallets = [];
      const numWallets = getNumWallets(args.options);
      for (let i = 1; i < numWallets + 1; i += 1) {
        wallets.push(`wallet-${i}`);
      }

      await Promise.all(
        wallets.map(walletName =>
          createWallet(walletName, network.name, { cli }, keystore, plugin),
        ),
      );

      const client = new Client({
        memory: new LocalUserAccountProvider({
          keystore,
          provider: new NEOONEProvider({
            options: [
              { network: network.name, rpcURL: network.nodes[0].rpcAddress },
            ],
          }),
        }),
      });

      const transfers = await Promise.all(
        wallets.map(walletName =>
          createTransfers(walletName, network.name, { cli }, plugin),
        ),
      );
      const neoTransfers = [];
      const gasTransfers = [];
      for (const transfer of transfers) {
        neoTransfers.push(transfer[0]);
        gasTransfers.push(transfer[1]);
      }

      const neoTransaction = await client.transfer(neoTransfers, {
        from: masterWallet.accountID,
      });
      await neoTransaction.confirmed();

      const gasTransaction = await client.transfer(gasTransfers, {
        from: masterWallet.accountID,
      });
      await gasTransaction.confirmed();

      // for (const walletName of wallets) {
      //   const wallet = await getWallet(
      //     walletName,
      //     networkName,
      //     {cli},
      //     plugin,
      //   )
      //   console.log(wallet)
      // }
    });
