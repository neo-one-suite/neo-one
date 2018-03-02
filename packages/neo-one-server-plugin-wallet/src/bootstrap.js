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
} from '@neo-one/client';
import { common } from '@neo-one/client-core';
import {
  constants as networkConstants,
  type Network,
} from '@neo-one/server-plugin-network';

import { take } from 'rxjs/operators';
import BigNumber from 'bignumber.js';

import type Wallet from './WalletResource';
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

function getNumWallets(options): number {
  const { wallets } = options;
  if (wallets != null && typeof wallets === 'number') {
    return wallets;
  }
  return DEFAULT_NUM_WALLETS;
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

function randomIntDist(seed: number): number {
  if (seed < 40) {
    return randomInt(10);
  } else if (seed >= 40 && seed < 90) {
    return randomInt(100);
  } else if (seed >= 90 && seed < 97) {
    return randomInt(1000);
  } else if (seed >= 97 && seed < 100) {
    return randomInt(10000);
  }
  return randomInt(100000);
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

      const networkResource = await cli.client
        .getResource$({
          plugin: networkConstants.PLUGIN,
          name: networkName,
          resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
          options: {},
        })
        .pipe(take(1))
        .toPromise();
      if (networkResource == null) {
        throw new Error(`Network ${networkName} does not exist.`);
      }
      const network = ((networkResource: $FlowFixMe): Network);

      const masterWalletResource = await plugin.walletResourceType
        .getResource$({
          name: constants.makeMasterWallet(network.name),
          client: cli.client,
          options: {},
        })
        .pipe(take(1))
        .toPromise();

      const masterWallet = ((masterWalletResource: $FlowFixMe): Wallet);

      const keystore = new LocalKeyStore({
        store: new LocalMemoryStore(),
      });

      await keystore.addAccount({
        network: network.name,
        // $FlowFixMe
        name: masterWallet.name,
        privateKey: wifToPrivateKey((masterWallet.wif: $FlowFixMe)),
      });

      const wallets = [];
      const numWallets = getNumWallets(args.options);
      for (let i = 1; i < numWallets + 1; i += 1) {
        wallets.push(`wallet-${i}`);
      }

      async function getWallet(walletName: string): Promise<Wallet> {
        const walletResource = await plugin.walletResourceType
          .getResource$({
            name: constants.makeWallet({
              network: network.name,
              name: walletName,
            }),
            client: cli.client,
            options: {},
          })
          .pipe(take(1))
          .toPromise();

        const wallet = ((walletResource: $FlowFixMe): Wallet);
        return Promise.resolve(wallet);
      }

      async function createWallet(walletName: string): Promise<void> {
        await cli.exec(`create wallet ${walletName} --network ${network.name}`);
        // $FlowFixMe
        const wallet = await getWallet(walletName);

        await keystore.addAccount({
          network: network.name,
          name: wallet.name,
          privateKey: wifToPrivateKey(wallet.wif),
        });

        await cli.exec(`deactivate wallet ${walletName}`);
      }

      for (const walletName of wallets) {
        // eslint-disable-next-line
        await createWallet(walletName);
      }

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

      async function transferFunds(
        walletName: string,
        seed: number,
      ): Promise<void> {
        // $FlowFixMe
        const wallet = await getWallet(walletName);
        const neo = randomIntDist(seed);
        const gas = randomIntDist(seed);

        await client.transfer(
          new BigNumber(neo),
          common.NEO_ASSET_HASH,
          wallet.address,
          // $FlowFixMe
          { from: masterWallet.accountID },
        );

        await client.transfer(
          new BigNumber(gas),
          common.GAS_ASSET_HASH,
          wallet.address,
          // $FlowFixMe
          { from: masterWallet.accountID },
        );
      }
      for (const walletName of wallets) {
        // eslint-disable-next-line
        await transferFunds(walletName, randomInt(100));
      }
    });
