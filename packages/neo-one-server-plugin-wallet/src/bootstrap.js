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
  privateKeyToAddress,
  privateKeyToPublicKey,
  createPrivateKey,
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
import ora from 'ora';
import type { Wallet } from './WalletResourceType';
import type WalletPlugin from './WalletPlugin';

import constants from './constants';
import { kycContract, conciergeContract } from './__data__/contracts';

const DEFAULT_NUM_WALLETS = 10;
const DEFAULT_MASTER_PRIVATE_KEY =
  '9e9522c90f4b33cac8a174353ae54651770f3f4dd1de78e74d9b49ba615d7c1f';
const DEFAULT_NETWORK_NAME = 'priv';
const DEFAULT_PRIVATE_KEYS = [
  'e35ecb8189067a0a06f17f163be3db95c4b7805c81b48af1f4b8bbdfbeeb1afd',
  '6cad314f75624a26b780368a8b0753d10815ca44c1fca6eb3972484548805d9e',
  'e91dc6e5fffcae0510ef5a7e41675d024e5b286769b3ff455e71e01a4cf16ef0',
  'fa38cb00810d173e14631219d8ee689ee183a3d307c3c8bd2e1234d332dd3255',
];
const ASSET_INFO = [
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

type WalletData = {|
  name: string,
  privateKey: string,
  address: string,
|};

type NetworkData = {|
  name: string,
  rpcURL: string,
|};

type BootstrapData = {|
  network: NetworkData,
  master: WalletData,
  wallets: Array<WalletData>,
  assetWallets: Array<WalletData>,
|};

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

async function getRPC({ options }: GetCLIResourceOptions): Promise<string> {
  const { rpc } = options;

  if (rpc != null && typeof rpc === 'string') {
    if (
      rpc === networkConstants.NETWORK_URL.MAIN ||
      rpc === networkConstants.NETWORK_URL.TEST
    ) {
      throw new Error('Invalid Network: Can only bootstrap a private network');
    }
    return rpc;
  }
  throw new Error(
    'Bootstrap requires an input RPC URL to connect to the NEO Tracker private network',
  );
}

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
|}): Promise<WalletData> {
  const walletResource = await plugin.walletResourceType.getResource({
    name: constants.makeWallet({
      network: networkName,
      name: walletName,
    }),
    client: cli.client,
    options: {},
  });

  const wallet = ((walletResource: $FlowFixMe): Wallet);

  if (wallet == null) {
    throw new Error(`Failed to find wallet, ${walletName}`);
  }
  if (wallet.wif == null) {
    throw new Error(`Something went wrong, wif is null for ${walletName}`);
  }

  return {
    name: wallet.name,
    privateKey: wifToPrivateKey(wallet.wif),
    address: wallet.address,
  };
}

async function createWallet({
  walletName,
  networkName,
  cli,
}: {|
  walletName: string,
  networkName: string,
  cli: InteractiveCLI,
|}): Promise<WalletData> {
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

  return {
    name: wallet.name,
    privateKey: wifToPrivateKey(wallet.wif),
    address: wallet.address,
  };
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
  wallet: WalletData,
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
  master,
  networkName,
  client,
  developerClient,
}: {|
  wallets: Array<WalletData>,
  master: WalletData,
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
    from: {
      network: networkName,
      address: master.address,
    },
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
      client.transfer(transfer[0], {
        from: { network: networkName, address: transfer[1].address },
      }),
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
  wallets: Array<WalletData>,
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
    unclaimedAccounts.map(account =>
      client.claim({
        from: { network: networkName, address: account.address },
      }),
    ),
  );
  await Promise.all(
    [developerClient.runConsensusNow()].concat(
      claims.map(claim => claim.confirmed()),
    ),
  );
}

async function setupAssetWallets({
  wallets,
  networkName,
  client,
  developerClient,
  master,
}: {|
  wallets: Array<WalletData>,
  networkName: string,
  client: Client<*>,
  developerClient: DeveloperClient,
  master: WalletData,
|}): Promise<void> {
  const startingGAS = 50000;

  const transfer = await client.transfer(
    wallets.map(wallet => ({
      amount: new BigNumber(startingGAS),
      asset: common.GAS_ASSET_HASH,
      to: wallet.address,
    })),
    { from: { network: networkName, address: master.address } },
  );

  await Promise.all([developerClient.runConsensusNow(), transfer.confirmed()]);
}

async function registerAssets({
  assets,
  assetWallets,
  networkName,
  client,
  developerClient,
}: {|
  assets: Array<{
    assetType: AssetType,
    name: string,
    amount: BigNumber,
    precision: number,
  }>,
  assetWallets: Array<WalletData>,
  networkName: string,
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
          owner: privateKeyToPublicKey(asset[1].privateKey),
          admin: asset[1].address,
          issuer: asset[1].address,
        },
        {
          from: { network: networkName, address: asset[1].address },
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
  networkName,
  client,
}: {|
  wallets: Array<WalletData>,
  asset: {
    assetType: AssetType,
    name: string,
    amount: BigNumber,
    precision: number,
    wallet: WalletData,
    hash: Hash256String,
  },
  networkName: string,
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

  const issue = await client.issue(transfers, {
    from: { network: networkName, address: asset.wallet.address },
  });

  return issue;
}

async function createAssetTransfer({
  wallets,
  assetHash,
  networkName,
  client,
  assetWallet,
}: {|
  wallets: Array<WalletData>,
  assetHash: Hash256String,
  networkName: string,
  client: Client<*>,
  assetWallet: WalletData,
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
    from: { network: networkName, address: assetWallet.address },
  });

  return firstTransfers.concat([secondTransfers]);
}

async function getPresetData({
  cliOptions,
  plugin,
  walletNames,
  assetWalletNames,
}: {|
  cliOptions: GetCLIResourceOptions,
  plugin: WalletPlugin,
  walletNames: Array<string>,
  assetWalletNames: Array<string>,
|}): Promise<BootstrapData> {
  const rpcURL = await getRPC(cliOptions);
  const network = {
    name: DEFAULT_NETWORK_NAME,
    rpcURL,
  };

  let master;
  if (cliOptions.args.options['testing-only']) {
    master = await getWallet({
      walletName: constants.MASTER_WALLET,
      networkName: network.name,
      cli: cliOptions.cli,
      plugin,
    });
  } else {
    master = {
      name: 'master',
      privateKey: DEFAULT_MASTER_PRIVATE_KEY,
      address: privateKeyToAddress(DEFAULT_MASTER_PRIVATE_KEY),
    };
  }

  const hardcodedWallets = _.zip(
    walletNames.slice(0, DEFAULT_PRIVATE_KEYS.length),
    DEFAULT_PRIVATE_KEYS,
  ).map(walletInfo => ({
    name: walletInfo[0],
    privateKey: walletInfo[1],
    address: privateKeyToAddress(walletInfo[1]),
  }));

  const wallets = walletNames
    .slice(DEFAULT_PRIVATE_KEYS.length)
    .map(name => {
      const privateKey = createPrivateKey();
      return {
        name,
        privateKey,
        address: privateKeyToAddress(privateKey),
      };
    })
    .concat(hardcodedWallets);

  const assetWallets = assetWalletNames.map(name => {
    const privateKey = createPrivateKey();
    return {
      name,
      privateKey,
      address: privateKeyToAddress(privateKey),
    };
  });

  return {
    network,
    master,
    wallets,
    assetWallets,
  };
}

async function getNEOONEData({
  cliOptions,
  plugin,
  walletNames,
  assetWalletNames,
}: {|
  cliOptions: GetCLIResourceOptions,
  plugin: WalletPlugin,
  walletNames: Array<string>,
  assetWalletNames: Array<string>,
|}): Promise<BootstrapData> {
  const networkName = await getNetwork(cliOptions);

  if (
    networkName === networkConstants.NETWORK_NAME.MAIN ||
    networkName === networkConstants.NETWORK_NAME.TEST
  ) {
    throw new Error('Invalid Network: Can only bootstrap a private network');
  }

  const networkResource = await cliOptions.cli.client.getResource({
    plugin: networkConstants.PLUGIN,
    name: networkName,
    resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
    options: {},
  });
  if (networkResource == null) {
    throw new Error(`Network ${networkName} does not exist.`);
  }

  const networkInfo = ((networkResource: $FlowFixMe): Network);
  const network = {
    name: networkInfo.name,
    rpcURL: networkInfo.nodes[0].rpcAddress,
  };

  const master = await getWallet({
    walletName: constants.MASTER_WALLET,
    networkName: network.name,
    cli: cliOptions.cli,
    plugin,
  });

  const wallets = await Promise.all(
    walletNames.map(walletName =>
      createWallet({
        walletName,
        networkName: network.name,
        cli: cliOptions.cli,
      }),
    ),
  );

  const assetWallets = await Promise.all(
    assetWalletNames.map(walletName =>
      createWallet({
        walletName,
        networkName: network.name,
        cli: cliOptions.cli,
      }),
    ),
  );

  return {
    network,
    master,
    wallets,
    assetWallets,
  };
}

async function addWalletsToKeystore({
  keystore,
  networkName,
  master,
  wallets,
  assetWallets,
}: {|
  keystore: LocalKeyStore,
  networkName: string,
  master: WalletData,
  wallets: Array<WalletData>,
  assetWallets: Array<WalletData>,
|}): Promise<void> {
  await Promise.all(
    wallets
      .concat([master])
      .concat(assetWallets)
      .map(wallet =>
        keystore.addAccount({
          network: networkName,
          name: wallet.name,
          privateKey: wallet.privateKey,
        }),
      ),
  );
}

export default (plugin: WalletPlugin) => ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command('bootstrap', 'Bootstraps a Network with test data.')
    .option('-n, --network <name>', 'Network to bootstrap')
    .option('--wallets <number>', 'Number of wallets to create - default 10')
    .option(
      '--rpc <string>',
      'Bootstraps a private network with the given rpcURL.',
    )
    .option('--testing-only', 'Option to spoof rpc path for testing')
    .action(async args => {
      const spinner = ora(`Gathering data for bootstrap`).start();

      const walletNames = [];
      const numWallets = getNumWallets(args.options);
      for (let i = 1; i < numWallets + 1; i += 1) {
        walletNames.push(`wallet-${i}`);
      }

      const assetWalletNames = ASSET_INFO.map(asset => `${asset.name}-wallet`);

      try {
        let bootstrapData;
        if (args.options.rpc != null) {
          bootstrapData = await getPresetData({
            cliOptions: {
              cli,
              args,
              options: args.options,
            },
            plugin,
            walletNames,
            assetWalletNames,
          });
        } else {
          bootstrapData = await getNEOONEData({
            cliOptions: {
              cli,
              args,
              options: args.options,
            },
            plugin,
            walletNames,
            assetWalletNames,
          });
        }
        const { network, master, wallets, assetWallets } = bootstrapData;
        spinner.succeed();

        spinner.start(`Bootstrapping network ${bootstrapData.network.name}`);
        const keystore = new LocalKeyStore({
          store: new LocalMemoryStore(),
        });

        await addWalletsToKeystore({
          keystore,
          networkName: network.name,
          master,
          wallets,
          assetWallets,
        });

        const provider = new NEOONEProvider({
          options: [{ network: network.name, rpcURL: network.rpcURL }],
        });

        const client = new Client({
          memory: new LocalUserAccountProvider({
            keystore,
            provider,
          }),
        });
        await client.selectAccount({
          network: network.name,
          address: master.address,
        });

        const developerClient = new DeveloperClient(
          provider.read(network.name),
        );
        spinner.succeed();

        spinner.start('Initializing wallets with funds');
        await initializeWallets({
          wallets,
          master,
          networkName: network.name,
          client,
          developerClient,
        });
        spinner.succeed();

        spinner.start('Setting up asset wallets');
        await setupAssetWallets({
          wallets: assetWallets,
          networkName: network.name,
          client,
          developerClient,
          master,
        });
        spinner.succeed();

        spinner.start('Registering test assets');
        const assetHashes = await registerAssets({
          assets: ASSET_INFO,
          assetWallets,
          networkName: network.name,
          client,
          developerClient,
        });
        spinner.succeed();
        const assets = _.zip(ASSET_INFO, assetWallets, assetHashes).map(
          asset => ({
            ...asset[0],
            wallet: asset[1],
            hash: asset[2],
          }),
        );
        spinner.start('Issuing assets');
        const issues = await Promise.all(
          assets.map(asset =>
            issueAsset({
              wallets,
              networkName: network.name,
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
        spinner.succeed();

        spinner.start('Distributing assets');
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
        spinner.succeed();

        spinner.start('Publishing KYC SmartContract');
        const kyc = await client.publish(kycContract);
        await Promise.all([developerClient.runConsensusNow(), kyc.confirmed()]);
        spinner.succeed();

        spinner.start('Publishing Concierge SmartContract');
        const concierge = await client.publish(conciergeContract);
        await Promise.all([
          developerClient.runConsensusNow(),
          concierge.confirmed(),
        ]);
        spinner.succeed();

        spinner.start('Claiming GAS');
        await initiateClaims({
          wallets,
          networkName: network.name,
          client,
          developerClient,
          provider,
        });
        spinner.succeed();
      } catch (error) {
        spinner.fail(error);
      }
    });
