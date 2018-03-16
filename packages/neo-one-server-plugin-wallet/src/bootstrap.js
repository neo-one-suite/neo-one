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
  type TransactionResult,
  type TransactionReceipt,
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
  wallet,
  from,
}: {|
  wallet: Wallet,
  from?: Account,
|}): Promise<Array<Transfer>> {
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
  client,
  developerClient,
}: {|
  wallets: Array<Wallet>,
  masterWallet: Wallet,
  networkName: string,
  client: Client<*>,
  developerClient: DeveloperClient,
|}): Promise<void> {
  const [firstWalletBatch, secondWalletBatch] = _.chunk(
    wallets,
    Math.ceil(wallets.length / 2),
  );

  let firstTransferBatch = await Promise.all(
    firstWalletBatch.map(wallet => createTransfers({ wallet })),
  );
  firstTransferBatch = _.flatten(firstTransferBatch);

  const firstTransactionBatch = await client.transfer(firstTransferBatch, {
    from: masterWallet.accountID,
  });
  await Promise.all([
    developerClient.runConsensusNow(),
    firstTransactionBatch.confirmed(),
  ]);

  const fromWallets = firstWalletBatch.slice(0, secondWalletBatch.length);

  const fromAccounts = await Promise.all(
    fromWallets.map(wallet =>
      client.read(networkName).getAccount(wallet.address),
    ),
  );

  let secondTransferBatch = await Promise.all(
    _.zip(secondWalletBatch, fromAccounts).map(transferWallets =>
      createTransfers({
        wallet: transferWallets[0],
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
  client,
  developerClient,
  provider,
}: {|
  wallets: Array<Wallet>,
  networkName: string,
  client: Client<*>,
  developerClient: DeveloperClient,
  provider: NEOONEProvider,
|}): Promise<void> {
  const unclaimed = await Promise.all(
    wallets.map(wallet => provider.getUnclaimed(networkName, wallet.address)),
  );
  const unclaimedAccounts = _.zip(wallets, unclaimed)
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

async function issueAsset({
  wallets,
  asset,
  client,
}: {|
  wallets: Array<Wallet>,
  asset: {
    assetType: AssetType,
    name: string,
    amount: BigNumber,
    precision: number,
    wallet: Wallet,
    hash: Hash256String,
  },
  client: Client<*>,
|}): Promise<TransactionResult<TransactionReceipt>> {
  const numIssues = Math.floor(wallets.length / 3);
  const positions = [];
  const transfers = [];
  let available = asset.amount;
  for (let i = 0; i < numIssues; i += 1) {
    let pos = randomInt(wallets.length) - 1;
    while (positions.includes(pos)) {
      pos = randomInt(wallets.length) - 1;
    }
    positions.push(pos);

    const amount = new BigNumber(randomInt(10000) + 10);
    available = available.minus(amount);
    transfers.push({
      to: wallets[pos].address,
      asset: asset.hash,
      amount,
    });
  }
  transfers.push({
    to: asset.wallet.address,
    asset: asset.hash,
    amount: available,
  });

  const issue = await client.issue(transfers, { from: asset.wallet.accountID });

  return issue;
}

async function createAssetTransfer({
  wallets,
  assetHash,
  networkName,
  client,
  assetWallet,
}: {|
  wallets: Array<Wallet>,
  assetHash: Hash256String,
  networkName: string,
  client: Client<*>,
  assetWallet: Wallet,
|}): Promise<Array<TransactionResult<TransactionReceipt>>> {
  const accounts = await Promise.all(
    wallets.map(wallet => client.read(networkName).getAccount(wallet.address)),
  );
  const assetAccount = await client
    .read(networkName)
    .getAccount(assetWallet.address);
  const walletTransfers = [];
  for (const account of accounts) {
    const transferPercent = randomInt(75) / 100;

    const stringBalance = account.balances[assetHash];
    if (stringBalance != null) {
      const amount = Math.ceil(transferPercent * Number(stringBalance));
      walletTransfers.push({
        transfer: {
          amount: new BigNumber(amount),
          asset: assetHash,
          to: wallets[randomInt(wallets.length) - 1].address,
        },
        from: {
          from: {
            network: networkName,
            address: account.address,
          },
        },
      });
    }
  }

  const firstTransfers = await Promise.all(
    walletTransfers.map(walletTransfer =>
      client.transfer([walletTransfer.transfer], walletTransfer.from),
    ),
  );

  const numTransfers = Math.floor(wallets.length / 3);
  const assetWalletTransfers = [];
  for (let i = 0; i < numTransfers; i += 1) {
    const transferPercent = randomInt(Math.floor(250 / numTransfers)) / 1000;
    const balance = Number(assetAccount.balances[assetHash]);

    const amount = Math.ceil(transferPercent * balance);
    assetWalletTransfers.push({
      amount: new BigNumber(amount),
      asset: assetHash,
      to: wallets[randomInt(wallets.length) - 1].address,
    });
  }

  const secondTransfers = await client.transfer(assetWalletTransfers, {
    from: assetWallet.accountID,
  });

  return firstTransfers.concat([secondTransfers]);
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
        networkName === networkConstants.NETWORK_NAME.MAIN ||
        networkName === networkConstants.NETWORK_NAME.TEST
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

      const walletNames = [];
      const numWallets = getNumWallets(args.options);
      for (let i = 1; i < numWallets + 1; i += 1) {
        walletNames.push(`wallet-${i}`);
      }

      const wallets = await Promise.all(
        walletNames.map(walletName =>
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

      await initializeWallets({
        wallets,
        masterWallet,
        networkName: network.name,
        client,
        developerClient,
      });

      let assets = [
        {
          assetType: 'Token',
          name: 'redcoin',
          amount: new BigNumber(1000000),
          precision: 4,
        },
        {
          assetType: 'Token',
          name: 'bluecoin',
          amount: new BigNumber(650000),
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

      const assetHashes = await registerAssets({
        assets,
        assetWallets,
        client,
        developerClient,
      });

      assets = _.zip(assets, assetWallets, assetHashes).map(asset => ({
        ...asset[0],
        wallet: asset[1],
        hash: asset[2],
      }));

      const issues = await Promise.all(
        assets.map(asset =>
          issueAsset({
            wallets,
            asset,
            client,
          }),
        ),
      );

      await Promise.all(
        [developerClient.runConsensusNow()].concat(
          issues.map(issue => issue.confirmed()),
        ),
      );

      const assetTransfers = await Promise.all(
        assets.map(asset =>
          createAssetTransfer({
            wallets,
            assetHash: asset.hash,
            networkName: network.name,
            client,
            assetWallet: asset.wallet,
          }),
        ),
      );

      await Promise.all(
        [developerClient.runConsensusNow()].concat(
          _.flatten(assetTransfers).map(transfer => transfer.confirmed()),
        ),
      );

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
        client,
        developerClient,
        provider,
      });
    });
