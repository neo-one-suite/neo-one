/* @flow */
import BigNumber from 'bignumber.js';
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
  type Account,
} from '@neo-one/client';
import { common } from '@neo-one/client-core';
import {
  constants as networkConstants,
  type Network,
} from '@neo-one/server-plugin-network';

import _ from 'lodash';
import { of as _of } from 'rxjs/observable/of';

import type { Wallet } from './WalletResourceType';
import type WalletPlugin from './WalletPlugin';

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

async function getWallet({
  walletName,
  networkName,
  cli,
  plugin,
}: {|
  walletName: string,
  networkName: string,
  cli: InteractiveCLI,
  plugin: WalletPlugin,
|}): Promise<Wallet> {
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

async function createWallet({
  walletName,
  networkName,
  cli,
  keystore,
}: {|
  walletName: string,
  networkName: string,
  cli: InteractiveCLI,
  keystore: LocalKeyStore,
|}): Promise<void> {
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
  if (wallet.wif == null) {
    throw new Error(`Something went wrong, wif is null for ${walletName}`);
  }

  await keystore.addAccount({
    network: networkName,
    name: wallet.name,
    privateKey: wifToPrivateKey(wallet.wif),
  });
}

function getNumWallets(options: Object): number {
  const { wallets } = options;
  if (wallets != null) {
    if (typeof wallets === 'number') {
      return wallets;
    }
    throw new Error('--wallets <number> option must be a number');
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

async function createTransfers({
  walletName,
  networkName,
  cli,
  plugin,
  from,
}: {|
  walletName: string,
  networkName: string,
  cli: InteractiveCLI,
  plugin: WalletPlugin,
  from?: Account,
|}): Promise<Array<Transfer>> {
  const wallet = await getWallet({ walletName, networkName, cli, plugin });

  let neo;
  let gas;
  if (from == null) {
    const seed = randomInt(100);
    neo = randomIntDist(seed);
    gas = randomIntDist(seed);
  } else {
    const transferPercent = randomInt(75) / 100;
    neo = Math.ceil(
      transferPercent * Number(from.balances[common.NEO_ASSET_HASH]),
    );
    gas = Math.ceil(
      transferPercent * Number(from.balances[common.GAS_ASSET_HASH]),
    );
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

      const masterWallet = await getWallet({
        walletName: constants.MASTER_WALLET,
        networkName: network.name,
        cli,
        plugin,
      });

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
          createWallet({
            walletName,
            networkName: network.name,
            cli,
            keystore,
          }),
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
      const [firstWalletBatch, secondWalletBatch] = _.chunk(
        wallets,
        Math.ceil(wallets.length / 2),
      );

      let firstTransferBatch = await Promise.all(
        firstWalletBatch.map(walletName =>
          createTransfers({
            walletName,
            networkName: network.name,
            cli,
            plugin,
          }),
        ),
      );
      firstTransferBatch = _.flatten(firstTransferBatch);

      const firstTransactionBatch = await client.transfer(firstTransferBatch, {
        from: masterWallet.accountID,
      });
      await firstTransactionBatch.confirmed();

      const fromWallets = await Promise.all(
        firstWalletBatch
          .slice(0, secondWalletBatch.length)
          .map(walletName =>
            getWallet({ walletName, networkName: network.name, cli, plugin }),
          ),
      );
      const fromAccounts = await Promise.all(
        fromWallets.map(wallet =>
          client.read(network.name).getAccount(wallet.address),
        ),
      );

      let secondTransferBatch = await Promise.all(
        _.zip(secondWalletBatch, fromAccounts).map(transferWallets =>
          createTransfers({
            walletName: transferWallets[0],
            networkName: network.name,
            cli,
            plugin,
            from: transferWallets[1],
          }),
        ),
      );
      secondTransferBatch = _.zip(secondTransferBatch, fromWallets);

      const secondTransactionBatch = await Promise.all(
        secondTransferBatch.map(transfer =>
          client.transfer(transfer[0], { from: transfer[1].accountID }),
        ),
      );

      await Promise.all(
        secondTransactionBatch.map(transaction => transaction.confirmed()),
      );
    });
