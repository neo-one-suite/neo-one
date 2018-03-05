/* @flow */
import {
  type GetCLIResourceOptions,
  type InteractiveCLIArgs,
  type InteractiveCLI,
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

import _ from 'lodash';
import { of as _of } from 'rxjs/observable/of';
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
  cli: InteractiveCLI,
  plugin: WalletPlugin,
): Promise<Wallet> {
  const wallet = await plugin.walletResourceType.getResource({
    name: constants.makeWallet({
      network: networkName,
      name: walletName,
    }),
    client: cli.client,
    options: {},
  });

  if (wallet == null) {
    throw new Error(`Failed to find wallet, ${walletName}`);
  }

  return wallet;
}

async function createWallet(
  walletName: string,
  networkName: string,
  cli: InteractiveCLI,
  keystore: LocalKeyStore,
): Promise<void> {
  const walletResource = await cli.client.createResource({
    plugin: constants.PLUGIN,
    resourceType: constants.WALLET_RESOURCE_TYPE,
    name: constants.makeWallet({ name: walletName, network: networkName }),
    options: {
      network: networkName,
    },
    cancel$: _of(),
  });

  const wallet = ((walletResource: $FlowFixMe): Wallet);
  if (wallet == null) {
    throw new Error(`Failed to find wallet, ${walletName}`);
  }
  if (wallet.wif == null) {
    throw new Error(`Something went wrong, wif is null for ${walletName}`);
  }

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
  cli: InteractiveCLI,
  plugin: WalletPlugin,
  from?: ?Wallet,
): Promise<Array<Transfer>> {
  const wallet = await getWallet(walletName, networkName, cli, plugin);

  let neo;
  let gas;
  if (from == null) {
    const seed = randomInt(100);
    neo = randomIntDist(seed);
    gas = randomIntDist(seed);
  } else {
    const transferPercent = randomInt(75) / 100;
    neo = Math.ceil(transferPercent * Number(from.neoBalance));
    gas = Math.ceil(transferPercent * Number(from.gasBalance));
  }

  return [
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
  ];
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

      if (
        networkName === networkConstants.MAIN ||
        networkName === networkConstants.TEST
      ) {
        throw new Error(
          'Invalid Network: Can only bootstrap a private network',
        );
      }

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

      const masterWallet = await getWallet(
        constants.MASTER_WALLET,
        network.name,
        cli,
        plugin,
      );

      if (masterWallet.wif == null) {
        throw new Error('Something went wrong, wif is null');
      }

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
          createWallet(walletName, network.name, cli, keystore),
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
      const [walletsBatch1, walletsBatch2] = _.chunk(
        wallets,
        Math.ceil(wallets.length / 2),
      );

      let transfersBatch1 = await Promise.all(
        walletsBatch1.map(walletName =>
          createTransfers(walletName, network.name, cli, plugin),
        ),
      );
      transfersBatch1 = _.flatten(transfersBatch1);

      const transactionBatch1 = await client.transfer(transfersBatch1, {
        from: masterWallet.accountID,
      });
      await transactionBatch1.confirmed();
      await new Promise(resolve => setTimeout(() => resolve(), 2000));

      const fromWallets = await Promise.all(
        walletsBatch1
          .slice(0, walletsBatch2.length)
          .map(walletName => getWallet(walletName, network.name, cli, plugin)),
      );

      let transfersBatch2 = await Promise.all(
        _.zip(walletsBatch2, fromWallets).map(transferWallets =>
          createTransfers(
            transferWallets[0],
            network.name,
            cli,
            plugin,
            transferWallets[1],
          ),
        ),
      );
      transfersBatch2 = _.zip(transfersBatch2, fromWallets);

      const transactionsBatch2 = await Promise.all(
        transfersBatch2.map(transfer =>
          client.transfer(transfer[0], { from: transfer[1].accountID }),
        ),
      );

      await Promise.all(
        transactionsBatch2.map(transaction => transaction.confirmed()),
      );
    });
