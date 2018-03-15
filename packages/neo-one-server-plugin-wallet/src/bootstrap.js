/* @flow */
import BigNumber from 'bignumber.js';
import {
  type GetCLIResourceOptions,
  type InteractiveCLIArgs,
  type InteractiveCLI,
} from '@neo-one/server-plugin';
import {
  Client,
  DeveloperClient,
  LocalKeyStore,
  LocalUserAccountProvider,
  LocalMemoryStore,
  NEOONEProvider,
  wifToPrivateKey,
  type Transfer,
  type Account,
  type AssetType,
  type Hash256String,
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
import { kycContract, conciergeContract } from './__data__/contracts';

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
|}): Promise<Wallet> {
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

  return wallet;
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

async function initializeWallets({
  wallets,
  masterWallet,
  networkName,
  cli,
  plugin,
  client,
  developerClient,
}: {|
  wallets: Array<string>,
  masterWallet: Wallet,
  networkName: string,
  cli: InteractiveCLI,
  plugin: WalletPlugin,
  client: Client<*>,
  developerClient: DeveloperClient,
|}): Promise<void> {
  const [firstWalletBatch, secondWalletBatch] = _.chunk(
    wallets,
    Math.ceil(wallets.length / 2),
  );

  let firstTransferBatch = await Promise.all(
    firstWalletBatch.map(walletName =>
      createTransfers({
        walletName,
        networkName,
        cli,
        plugin,
      }),
    ),
  );
  firstTransferBatch = _.flatten(firstTransferBatch);

  const firstTransactionBatch = await client.transfer(firstTransferBatch, {
    from: masterWallet.accountID,
  });
  await Promise.all([
    developerClient.runConsensusNow(),
    firstTransactionBatch.confirmed(),
  ]);

  const fromWallets = await Promise.all(
    firstWalletBatch
      .slice(0, secondWalletBatch.length)
      .map(walletName => getWallet({ walletName, networkName, cli, plugin })),
  );
  const fromAccounts = await Promise.all(
    fromWallets.map(wallet =>
      client.read(networkName).getAccount(wallet.address),
    ),
  );

  let secondTransferBatch = await Promise.all(
    _.zip(secondWalletBatch, fromAccounts).map(transferWallets =>
      createTransfers({
        walletName: transferWallets[0],
        networkName,
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
    [developerClient.runConsensusNow()].concat(
      secondTransactionBatch.map(transaction => transaction.confirmed()),
    ),
  );
}

async function initiateClaims({
  wallets,
  networkName,
  cli,
  plugin,
  client,
  developerClient,
  provider,
}: {|
  wallets: Array<string>,
  networkName: string,
  cli: InteractiveCLI,
  plugin: WalletPlugin,
  client: Client<*>,
  developerClient: DeveloperClient,
  provider: NEOONEProvider,
|}): Promise<void> {
  const accounts = await Promise.all(
    wallets.map(wallet =>
      getWallet({
        walletName: wallet,
        networkName,
        cli,
        plugin,
      }),
    ),
  );
  const unclaimed = await Promise.all(
    accounts.map(account =>
      provider.getUnclaimed(networkName, account.address),
    ),
  );
  const unclaimedAccounts = _.zip(accounts, unclaimed)
    .filter(account => account[1].unclaimed.length > 0)
    .map(account => account[0]);

  const claims = await Promise.all(
    unclaimedAccounts.map(account => client.claim({ from: account.accountID })),
  );
  await Promise.all(
    [developerClient.runConsensusNow()].concat(
      claims.map(claim => claim.confirmed()),
    ),
  );
}

async function setupAssetWallets({
  names,
  networkName,
  cli,
  keystore,
  client,
  developerClient,
  masterWallet,
}: {|
  names: Array<string>,
  networkName: string,
  cli: InteractiveCLI,
  keystore: LocalKeyStore,
  client: Client<*>,
  developerClient: DeveloperClient,
  masterWallet: Wallet,
|}): Promise<Array<Wallet>> {
  const startingGAS = 50000;
  const walletNames = names.map(name => `${name}-wallet`);
  const wallets = await Promise.all(
    walletNames.map(walletName =>
      createWallet({
        walletName,
        networkName,
        cli,
        keystore,
      }),
    ),
  );

  const transfer = await client.transfer(
    wallets.map(wallet => ({
      amount: new BigNumber(startingGAS),
      asset: common.GAS_ASSET_HASH,
      to: wallet.address,
    })),
    { from: masterWallet.accountID },
  );

  await Promise.all([developerClient.runConsensusNow(), transfer.confirmed()]);

  return wallets;
}

async function registerAssets({
  assets,
  assetWallets,
  client,
  developerClient,
}: {|
  assets: Array<{
    assetType: AssetType,
    name: string,
    amount: BigNumber,
    precision: number,
  }>,
  assetWallets: Array<Wallet>,
  client: Client<*>,
  developerClient: DeveloperClient,
|}): Promise<Array<Hash256String>> {
  const assetRegistrations = await Promise.all(
    _.zip(assets, assetWallets).map(asset =>
      client.registerAsset(
        {
          assetType: asset[0].assetType,
          name: asset[0].name,
          amount: asset[0].amount,
          precision: asset[0].precision,
          owner: asset[1].publicKey,
          admin: asset[1].address,
          issuer: asset[1].address,
        },
        {
          from: asset[1].accountID,
        },
      ),
    ),
  );

  const promises = await Promise.all(
    [developerClient.runConsensusNow()].concat(
      assetRegistrations.map(registration => registration.confirmed()),
    ),
  );
  const registrations = promises.slice(1);
  // $FlowFixMe
  return registrations.map(registration => registration.result.value.hash);
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

      const provider = new NEOONEProvider({
        options: [
          { network: network.name, rpcURL: network.nodes[0].rpcAddress },
        ],
      });

      const client = new Client({
        memory: new LocalUserAccountProvider({
          keystore,
          provider,
        }),
      });
      const developerClient = new DeveloperClient(provider.read(network.name));
      await developerClient.updateSettings({ secondsPerBlock: 1 });

      await initializeWallets({
        wallets,
        masterWallet,
        networkName: network.name,
        cli,
        plugin,
        client,
        developerClient,
      });

      const assets = [
        {
          assetType: 'Token',
          name: 'redcoin',
          amount: new BigNumber(1000000),
          precision: 4,
        },
        {
          assetType: 'Share',
          name: 'bluecoin',
          amount: new BigNumber(650000000),
          precision: 0,
        },
        {
          assetType: 'Currency',
          name: 'greencoin',
          amount: new BigNumber(50000000),
          precision: 6,
        },
      ];
      const assetWallets = await setupAssetWallets({
        names: assets.map(asset => asset.name),
        networkName: network.name,
        cli,
        keystore,
        client,
        developerClient,
        masterWallet,
      });

      await registerAssets({
        assets,
        assetWallets,
        client,
        developerClient,
      });

      const kyc = await client.publish(kycContract);
      await Promise.all([developerClient.runConsensusNow(), kyc.confirmed()]);

      const concierge = await client.publish(conciergeContract);
      await Promise.all([
        developerClient.runConsensusNow(),
        concierge.confirmed(),
      ]);

      await initiateClaims({
        wallets,
        networkName: network.name,
        cli,
        plugin,
        client,
        developerClient,
        provider,
      });
    });
