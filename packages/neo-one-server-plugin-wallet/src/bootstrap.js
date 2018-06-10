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
  privateKeyToScriptHash,
  createPrivateKey,
  type ABI,
  type Transfer,
  type Hash256String,
  type InvokeReceipt,
  type PublishReceipt,
  type SmartContract,
  type TransactionResult,
  type TransactionReceipt,
  type UserAccountID,
} from '@neo-one/client';
import { common } from '@neo-one/client-core';
import {
  constants as networkConstants,
  type Network,
} from '@neo-one/server-plugin-network';

import _ from 'lodash';
import { findAndCompileContract } from '@neo-one/smart-contract-compiler';
import fs from 'fs-extra';
import { of as _of } from 'rxjs';
import ora from 'ora';
import path from 'path';

import type { Wallet } from './WalletResourceType';
import type WalletPlugin from './WalletPlugin';

import constants from './constants';

const DEFAULT_NUM_WALLETS = 10;
export const DEFAULT_MASTER_PRIVATE_KEY =
  '9e9522c90f4b33cac8a174353ae54651770f3f4dd1de78e74d9b49ba615d7c1f';
const DEFAULT_NETWORK_NAME = 'priv';
export const DEFAULT_PRIVATE_KEYS = [
  'e35ecb8189067a0a06f17f163be3db95c4b7805c81b48af1f4b8bbdfbeeb1afd',
  '6cad314f75624a26b780368a8b0753d10815ca44c1fca6eb3972484548805d9e',
  'e91dc6e5fffcae0510ef5a7e41675d024e5b286769b3ff455e71e01a4cf16ef0',
  'fa38cb00810d173e14631219d8ee689ee183a3d307c3c8bd2e1234d332dd3255',
  '3ca9e1140253f75dded54a1e73bfd44678d0cbf7b9ee7229dfa2cf06aba6a3b5',
  '3cdafff958a81f84425b062085aad7a842fd35d980f873aee392116cdd10969d',
  '48e297109c2a9d46a9f72ad9bcf71ad784e2613695b9455dc1b1a3295955c774',
  '996b7ff875733a4b4aa92f450923bf64ee0f1b9d8c88028d06cef808221f2fb2',
  'eeb0940129baed17ae519a228afed2664a7bce372df0885a2675ee4426151a0f',
  '31efd094e0e299daaae8e08c1f7e99df0d71f8f26b30924274901812a4730992',
];
type AssetInfo = {|
  assetType: string,
  name: string,
  amount: BigNumber,
  precision: number,
  privateKey: string,
|};
export const ASSET_INFO = [
  {
    assetType: 'Token',
    name: 'redcoin',
    amount: new BigNumber(1000000),
    precision: 4,
    privateKey:
      '7bb05e6087cd116aa5f1da9001736a5350981c4548116e2bc08c9a4f29b3fee4',
  },
  {
    assetType: 'Token',
    name: 'bluecoin',
    amount: new BigNumber(660000),
    precision: 0,
    privateKey:
      'c27b96a2854ead7d4b4ef50de2695201fef87d3d46c9b36a6cd113774706748b',
  },
  {
    assetType: 'Currency',
    name: 'greencoin',
    amount: new BigNumber(50000000),
    precision: 6,
    privateKey:
      '8868b8c6152e3ba39e3c31b4774f67fcce3465f41720a408d59bfd34e6980ec3',
  },
];
export type TokenInfo = {|
  name: string,
  amount: BigNumber,
  privateKey: string,
|};
export const TOKEN_INFO = [
  {
    name: 'RedToken',
    amount: new BigNumber(1000000),
    privateKey:
      '3fedc9048caf7b75cece9d0db85748e5cb44940ff4d48f6230526db295040df4',
  },
  {
    name: 'BlueToken',
    amount: new BigNumber(660000),
    privateKey:
      'b29b677bf6c1abb7e184d943df10c3b57bedc14a85f9fda21cc93ec1b91be9ae',
  },
  {
    name: 'GreenToken',
    amount: new BigNumber(50000000),
    privateKey:
      'b8ec5eb6c6f499240fc431bbf68feee76ef503212e61496f0c8b8804168ae954',
  },
];

type WalletData = {|
  name: string,
  privateKey: string,
  accountID: UserAccountID,
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
  tokenWallets: Array<WalletData>,
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

const makeWallet = ({
  networkName,
  wallet,
}: {|
  networkName: string,
  wallet: Wallet,
|}) => {
  if (wallet.wif == null) {
    throw new Error(`Something went wrong, wif is null for ${wallet.name}`);
  }

  return {
    name: wallet.name,
    privateKey: wifToPrivateKey(wallet.wif),
    accountID: {
      network: networkName,
      address: wallet.address,
    },
  };
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

  return makeWallet({ networkName, wallet });
}

async function createWallet({
  walletName,
  networkName,
  cli,
  privateKey,
}: {|
  walletName: string,
  networkName: string,
  cli: InteractiveCLI,
  privateKey?: string,
|}): Promise<WalletData> {
  const walletResource = await cli.client.createResource({
    plugin: constants.PLUGIN,
    resourceType: constants.WALLET_RESOURCE_TYPE,
    name: constants.makeWallet({ name: walletName, network: networkName }),
    options: {
      network: networkName,
      privateKey,
    },
    cancel$: _of(),
  });

  const wallet = ((walletResource: $FlowFixMe): Wallet);

  return makeWallet({ networkName, wallet });
}

function getNumWallets(options: Object): number {
  let { wallets } = options;
  if (wallets != null && typeof wallets !== 'number') {
    throw new Error('--wallets <number> option must be a number');
  }

  if (wallets == null) {
    wallets = DEFAULT_NUM_WALLETS;
  }

  return wallets % 2 === 0 ? wallets : wallets + 1;
}

async function createTransfers({
  wallet,
  from,
}: {|
  wallet: WalletData,
  from?: WalletData,
|}): Promise<Array<Transfer>> {
  let neo;
  let gas;
  if (from == null) {
    neo = new BigNumber('1000000');
    gas = new BigNumber('1000000');
  } else {
    neo = new BigNumber('250000');
    gas = new BigNumber('250000');
  }

  return [
    {
      amount: neo,
      asset: common.NEO_ASSET_HASH,
      to: wallet.accountID.address,
    },
    {
      amount: gas,
      asset: common.GAS_ASSET_HASH,
      to: wallet.accountID.address,
    },
  ];
}

async function initializeWallets({
  wallets,
  master,
  client,
  developerClient,
}: {|
  wallets: Array<WalletData>,
  master: WalletData,
  client: Client<*>,
  developerClient: DeveloperClient,
|}): Promise<void> {
  const [firstWalletBatch, secondWalletBatch] = _.chunk(
    wallets,
    wallets.length / 2,
  );

  let firstTransferBatch = await Promise.all(
    firstWalletBatch.map((wallet) => createTransfers({ wallet })),
  );
  firstTransferBatch = _.flatten(firstTransferBatch);

  const firstTransactionBatch = await client.transfer(firstTransferBatch, {
    from: master.accountID,
  });
  await Promise.all([
    developerClient.runConsensusNow(),
    firstTransactionBatch.confirmed(),
  ]);

  const secondTransferBatch = await Promise.all(
    _.zip(firstWalletBatch, secondWalletBatch).map(([from, wallet]) =>
      createTransfers({ wallet, from }),
    ),
  );

  const secondTransactionBatch = await Promise.all(
    _.zip(firstWalletBatch, secondTransferBatch).map(([from, transfer]) =>
      client.transfer(transfer, {
        from: from.accountID,
      }),
    ),
  );

  await Promise.all(
    [developerClient.runConsensusNow()].concat(
      secondTransactionBatch.map((transaction) => transaction.confirmed()),
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
    wallets.map((wallet) =>
      provider.getUnclaimed(networkName, wallet.accountID.address),
    ),
  );
  const unclaimedWallets = _.zip(wallets, unclaimed)
    // eslint-disable-next-line
    .filter(([__, accountUnclaimed]) => accountUnclaimed.unclaimed.length > 0)
    .map(([wallet]) => wallet);

  const claims = await Promise.all(
    unclaimedWallets.map((wallet) => client.claim({ from: wallet.accountID })),
  );
  await Promise.all(
    [developerClient.runConsensusNow()].concat(
      claims.map((claim) => claim.confirmed()),
    ),
  );
}

async function setupWallets({
  wallets,
  client,
  developerClient,
  master,
}: {|
  wallets: Array<WalletData>,
  client: Client<*>,
  developerClient: DeveloperClient,
  master: WalletData,
|}): Promise<void> {
  const startingGAS = new BigNumber(50000);

  const transfer = await client.transfer(
    wallets.map((wallet) => ({
      amount: startingGAS,
      asset: common.GAS_ASSET_HASH,
      to: wallet.accountID.address,
    })),
    { from: master.accountID },
  );

  await Promise.all([developerClient.runConsensusNow(), transfer.confirmed()]);
}

type AssetWithWallet = {|
  ...AssetInfo,
  wallet: WalletData,
  hash: Hash256String,
|};

async function registerAssets({
  assetWallets,
  client,
  developerClient,
}: {|
  assetWallets: Array<WalletData>,
  client: Client<*>,
  developerClient: DeveloperClient,
|}): Promise<Array<AssetWithWallet>> {
  const assetRegistrations = await Promise.all(
    _.zip(ASSET_INFO, assetWallets).map(([asset, wallet]) =>
      client.registerAsset(
        {
          assetType: asset.assetType,
          name: asset.name,
          amount: asset.amount,
          precision: asset.precision,
          owner: privateKeyToPublicKey(wallet.privateKey),
          admin: wallet.accountID.address,
          issuer: wallet.accountID.address,
        },
        {
          from: wallet.accountID,
        },
      ),
    ),
  );

  // eslint-disable-next-line
  const [nada, ...registrations] = await Promise.all(
    [developerClient.runConsensusNow()].concat(
      assetRegistrations.map((registration) => registration.confirmed()),
    ),
  );

  const assetHashes = registrations.filter(Boolean).map((registration) => {
    if (registration.result.state === 'FAULT') {
      throw new Error(registration.result.message);
    }

    return registration.result.value.hash;
  });

  return _.zip(ASSET_INFO, assetWallets, assetHashes).map((asset) => ({
    ...asset[0],
    wallet: asset[1],
    hash: asset[2],
  }));
}

async function issueAsset({
  asset,
  client,
}: {|
  asset: AssetWithWallet,
  client: Client<*>,
|}): Promise<TransactionResult<TransactionReceipt>> {
  const transfer = {
    to: asset.wallet.accountID.address,
    asset: asset.hash,
    amount: asset.amount,
  };

  return client.issue([transfer], {
    from: asset.wallet.accountID,
  });
}

const issueAssets = async ({
  assets,
  client,
  developerClient,
}: {|
  assets: Array<AssetWithWallet>,
  client: Client<*>,
  developerClient: DeveloperClient,
|}) => {
  const issues = await Promise.all(
    assets.map((asset) => issueAsset({ asset, client })),
  );

  await Promise.all(
    [developerClient.runConsensusNow()].concat(
      issues.map((issue) => issue.confirmed()),
    ),
  );
};

async function createAssetTransfer({
  wallets,
  asset,
  client,
}: {|
  wallets: Array<WalletData>,
  asset: AssetWithWallet,
  client: Client<*>,
|}): Promise<TransactionResult<TransactionReceipt>> {
  const transfers = wallets.map((wallet) => ({
    to: wallet.accountID.address,
    asset: asset.hash,
    amount: asset.amount
      .div(2)
      .div(wallets.length)
      .integerValue(BigNumber.ROUND_FLOOR),
  }));

  return client.transfer(transfers, {
    from: asset.wallet.accountID,
  });
}

const transferAssets = async ({
  wallets,
  assets,
  client,
  developerClient,
}: {|
  wallets: Array<WalletData>,
  assets: Array<AssetWithWallet>,
  client: Client<*>,
  developerClient: DeveloperClient,
|}) => {
  const assetTransfers = await Promise.all(
    assets.map((asset, idx) =>
      createAssetTransfer({
        wallets:
          idx % 2 === 0
            ? wallets.slice(0, wallets.length / 2)
            : wallets.slice(wallets.length / 2),
        asset,
        client,
      }),
    ),
  );

  await Promise.all(
    [developerClient.runConsensusNow()].concat(
      assetTransfers.map((transfer) => transfer.confirmed()),
    ),
  );
};

const getAssetWallets = (networkName: string) =>
  ASSET_INFO.map(({ name, privateKey }) => ({
    name: `${name}-wallet`,
    privateKey,
    accountID: {
      network: networkName,
      address: privateKeyToAddress(privateKey),
    },
  }));

const getTokenWallets = (networkName: string) =>
  TOKEN_INFO.map(({ name, privateKey }) => ({
    name: `${name}-token-wallet`,
    privateKey,
    accountID: {
      network: networkName,
      address: privateKeyToAddress(privateKey),
    },
  }));

async function getPresetData({
  cliOptions,
  plugin,
  walletNames,
}: {|
  cliOptions: GetCLIResourceOptions,
  plugin: WalletPlugin,
  walletNames: Array<string>,
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
      accountID: {
        network: network.name,
        address: privateKeyToAddress(DEFAULT_MASTER_PRIVATE_KEY),
      },
    };
  }

  const getHardCodedWallet = ([name, privateKey]: [string, string]) => ({
    name,
    privateKey,
    accountID: {
      network: network.name,
      address: privateKeyToAddress(privateKey),
    },
  });

  const getGeneratedWallet = (name: string) => {
    const privateKey = createPrivateKey();
    return {
      name,
      privateKey,
      accountID: {
        network: network.name,
        address: privateKeyToAddress(privateKey),
      },
    };
  };

  const wallets = _.zip(
    walletNames.slice(0, DEFAULT_PRIVATE_KEYS.length / 2),
    DEFAULT_PRIVATE_KEYS.slice(0, DEFAULT_PRIVATE_KEYS.length / 2),
  )
    .map(getHardCodedWallet)
    .concat(
      walletNames
        .slice(DEFAULT_PRIVATE_KEYS.length / 2, walletNames.length / 2)
        .map(getGeneratedWallet),
    )
    .concat(
      _.zip(
        walletNames.slice(
          walletNames.length / 2,
          walletNames.length / 2 + DEFAULT_PRIVATE_KEYS.length / 2,
        ),
        DEFAULT_PRIVATE_KEYS.slice(DEFAULT_PRIVATE_KEYS.length / 2),
      ).map(getHardCodedWallet),
    )
    .concat(
      walletNames
        .slice(walletNames.length / 2 + DEFAULT_PRIVATE_KEYS.length / 2)
        .map(getGeneratedWallet),
    );

  return {
    network,
    master,
    wallets,
    assetWallets: getAssetWallets(network.name),
    tokenWallets: getTokenWallets(network.name),
  };
}

async function getNEOONEData({
  cliOptions,
  plugin,
  walletNames,
}: {|
  cliOptions: GetCLIResourceOptions,
  plugin: WalletPlugin,
  walletNames: Array<string>,
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
    walletNames.map((walletName) =>
      createWallet({
        walletName,
        networkName: network.name,
        cli: cliOptions.cli,
      }),
    ),
  );

  const assetWallets = await Promise.all(
    getAssetWallets(network.name).map((wallet) =>
      createWallet({
        walletName: wallet.name,
        networkName: network.name,
        cli: cliOptions.cli,
        privateKey: wallet.privateKey,
      }),
    ),
  );

  const tokenWallets = await Promise.all(
    getTokenWallets(network.name).map((wallet) =>
      createWallet({
        walletName: wallet.name,
        networkName: network.name,
        cli: cliOptions.cli,
        privateKey: wallet.privateKey,
      }),
    ),
  );

  return {
    network,
    master,
    wallets,
    assetWallets,
    tokenWallets,
  };
}

async function addWalletsToKeystore({
  keystore,
  networkName,
  master,
  wallets,
  assetWallets,
  tokenWallets,
}: {|
  keystore: LocalKeyStore,
  networkName: string,
  master: WalletData,
  wallets: Array<WalletData>,
  assetWallets: Array<WalletData>,
  tokenWallets: Array<WalletData>,
|}): Promise<void> {
  await Promise.all(
    wallets
      .concat([master])
      .concat(assetWallets)
      .concat(tokenWallets)
      .map((wallet) =>
        keystore.addAccount({
          network: networkName,
          name: wallet.name,
          privateKey: wallet.privateKey,
        }),
      ),
  );
}

const findContracts = async (current: string): Promise<string> => {
  const exists = await fs.pathExists(path.resolve(current, 'package.json'));
  if (exists) {
    return path.resolve(current, 'src', 'contracts');
  }

  return findContracts(path.dirname(current));
};

type CompileResult = {|
  code: Buffer,
  abi: ABI,
  name: string,
|};

export const compileSmartContract = async (
  contractName: string,
): Promise<CompileResult> => {
  const dir = await findContracts(
    require.resolve('@neo-one/server-plugin-wallet'),
  );
  const { script: code, abi } = await findAndCompileContract({
    dir,
    contractName,
  });

  return { code, abi, name: contractName };
};

const compileSmartContracts = async (
  contractNames: Array<string>,
): Promise<Array<CompileResult>> =>
  Promise.all(
    contractNames.map((contractName) => compileSmartContract(contractName)),
  );

const publishContract = async ({
  wallet,
  client,
  result: { code, name },
}: {|
  wallet: WalletData,
  isRPC: boolean,
  client: Client<any>,
  result: CompileResult,
|}): Promise<TransactionResult<PublishReceipt>> => {
  // TODO: Support using neo-one cli for compiling/publishing when !isRPC
  const result = await client.publish(
    {
      script: code.toString('hex'),
      // TODO: Get all of these directly from smart contract compilation
      parameters: ['String', 'Array'],
      returnType: 'ByteArray',
      name,
      codeVersion: '1.0',
      author: 'test',
      email: 'test@test.com',
      description: 'test',
      properties: {
        storage: true,
        dynamicInvoke: true,
        payable: true,
      },
    },
    { from: wallet.accountID },
  );

  return result;
};

type TokenWithWallet = {|
  ...TokenInfo,
  wallet: WalletData,
  smartContract: SmartContract,
|};

const publishTokens = async ({
  tokenWallets,
  isRPC,
  client,
  developerClient,
}: {|
  tokenWallets: Array<WalletData>,
  isRPC: boolean,
  client: Client<any>,
  developerClient: DeveloperClient,
|}): Promise<Array<TokenWithWallet>> => {
  const wallets = _.zip(tokenWallets, TOKEN_INFO).map(([wallet, token]) => ({
    wallet,
    token,
  }));

  const compileResults = await compileSmartContracts(
    wallets.map(({ token }) => token.name),
  );
  const publishResults = await Promise.all(
    _.zip(wallets, compileResults).map(async ([{ wallet }, compileResult]) =>
      publishContract({
        wallet,
        result: compileResult,
        isRPC,
        client,
      }),
    ),
  );

  const [receipts] = await Promise.all([
    Promise.all(publishResults.map((result) => result.confirmed())),
    developerClient.runConsensusNow(),
  ]);

  const tokenWithWallets = _.zip(wallets, compileResults, receipts).map(
    ([{ token, wallet }, compileResult, receipt]) => {
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }

      const smartContract = client.smartContract({
        networks: {
          [wallet.accountID.network]: { hash: receipt.result.value.hash },
        },
        abi: compileResult.abi,
      });

      return { ...token, smartContract, wallet };
    },
  );

  const deployResults = await Promise.all(
    tokenWithWallets.map(({ smartContract, wallet, amount }) =>
      smartContract.deploy(privateKeyToScriptHash(wallet.privateKey), amount, {
        from: wallet.accountID,
      }),
    ),
  );

  const [deployReceipts] = await Promise.all([
    Promise.all(deployResults.map((result) => result.confirmed())),
    developerClient.runConsensusNow(),
  ]);

  deployReceipts.forEach((receipt) => {
    if (receipt.result.state === 'FAULT') {
      throw new Error(receipt.result.message);
    }
  });

  return tokenWithWallets;
};

async function transferToken({
  wallets,
  token,
}: {|
  wallets: Array<WalletData>,
  token: TokenWithWallet,
|}): Promise<Array<TransactionResult<InvokeReceipt>>> {
  return Promise.all(
    wallets.map((wallet) =>
      token.smartContract.transfer(
        privateKeyToScriptHash(token.wallet.privateKey),
        privateKeyToScriptHash(wallet.privateKey),
        token.amount
          .div(2)
          .div(wallets.length)
          .integerValue(BigNumber.ROUND_FLOOR),
        { from: token.wallet.accountID },
      ),
    ),
  );
}

const transferTokens = async ({
  wallets,
  tokens,
  developerClient,
}: {|
  wallets: Array<WalletData>,
  tokens: Array<TokenWithWallet>,
  developerClient: DeveloperClient,
|}) => {
  const resultss = await Promise.all(
    tokens.map((token, idx) =>
      transferToken({
        wallets:
          idx % 2 === 0
            ? wallets.slice(0, wallets.length / 2)
            : wallets.slice(wallets.length / 2),
        token,
      }),
    ),
  );
  const results = _.flatten(resultss);

  await Promise.all(
    [developerClient.runConsensusNow()].concat(
      results.map(async (result) => {
        const receipt = await result.confirmed();

        if (receipt.result.state === 'FAULT') {
          throw new Error(receipt.result.message);
        }
      }),
    ),
  );
};

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
    .option('--reset', 'Reset blockchain before bootstrapping')
    .action(async (args) => {
      const spinner = ora(`Gathering data for bootstrap`).start();

      const walletNames = [];
      const numWallets = getNumWallets(args.options);
      for (let i = 1; i < numWallets + 1; i += 1) {
        walletNames.push(`wallet-${i}`);
      }

      try {
        let bootstrapData;
        const cliOptions = {
          cli,
          args,
          options: args.options,
        };
        if (args.options.rpc != null) {
          bootstrapData = await getPresetData({
            cliOptions,
            plugin,
            walletNames,
          });
        } else {
          bootstrapData = await getNEOONEData({
            cliOptions,
            plugin,
            walletNames,
          });
        }
        const {
          network,
          master,
          wallets,
          assetWallets,
          tokenWallets,
        } = bootstrapData;
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
          tokenWallets,
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
        await client.selectAccount(master.accountID);

        const developerClient = new DeveloperClient(
          provider.read(network.name),
        );
        spinner.succeed();

        await developerClient.updateSettings({
          secondsPerBlock: 600,
        });

        if (args.options.reset) {
          spinner.start('Resetting network');
          await developerClient.reset();
          spinner.succeed();
        }

        spinner.start('Initializing wallets with funds');
        await initializeWallets({
          wallets,
          master,
          client,
          developerClient,
        });
        spinner.succeed();

        spinner.start('Setting up asset wallets');
        await setupWallets({
          wallets: assetWallets,
          client,
          developerClient,
          master,
        });
        spinner.succeed();

        spinner.start('Setting up token wallets');
        await setupWallets({
          wallets: tokenWallets,
          client,
          developerClient,
          master,
        });
        spinner.succeed();

        spinner.start('Registering test assets');
        const assets = await registerAssets({
          assetWallets,
          client,
          developerClient,
        });
        spinner.succeed();

        spinner.start('Issuing assets');
        await issueAssets({
          assets,
          client,
          developerClient,
        });
        spinner.succeed();

        spinner.start('Distributing assets');
        await transferAssets({
          wallets,
          assets,
          client,
          developerClient,
        });
        spinner.succeed();

        spinner.start('Publishing tokens');
        const isRPC = args.options.rpc != null;
        const tokens = await publishTokens({
          tokenWallets,
          client,
          isRPC,
          developerClient,
        });
        spinner.succeed();

        spinner.start('Transferring tokens');
        await transferTokens({
          wallets,
          tokens,
          developerClient,
        });
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

        await developerClient.updateSettings({ secondsPerBlock: 15 });
      } catch (error) {
        spinner.fail(error);
      }
    });
