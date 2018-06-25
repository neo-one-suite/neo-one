import {
  AssetType,
  Client,
  createPrivateKey,
  DeveloperClient,
  Hash256String,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  privateKeyToAddress,
  privateKeyToPublicKey,
  privateKeyToScriptHash,
  PublishReceipt,
  SmartContract,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccountID,
  wifToPrivateKey,
} from '@neo-one/client';
import { common } from '@neo-one/client-core';
import { GetCLIResourceOptions, InteractiveCLI, InteractiveCLIArgs } from '@neo-one/server-plugin';
import { constants as networkConstants, Network } from '@neo-one/server-plugin-network';
import { CompileContractResult, findAndCompileContract } from '@neo-one/smart-contract-compiler';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import fs from 'fs-extra';
import _ from 'lodash';
import ora from 'ora';
import path from 'path';
import { of as _of } from 'rxjs';
import { constants } from './constants';
import { WalletPlugin } from './WalletPlugin';
import { Wallet } from './WalletResourceType';

const DEFAULT_NUM_WALLETS = 10;
export const DEFAULT_MASTER_PRIVATE_KEY = '9e9522c90f4b33cac8a174353ae54651770f3f4dd1de78e74d9b49ba615d7c1f';
const DEFAULT_NETWORK_NAME = 'priv';
export const DEFAULT_PRIVATE_KEYS: ReadonlyArray<string> = [
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

export interface AssetInfo {
  readonly assetType: AssetType;
  readonly name: string;
  readonly amount: BigNumber;
  readonly precision: number;
  readonly privateKey: string;
}

export const ASSET_INFO: ReadonlyArray<AssetInfo> = [
  {
    assetType: 'Token',
    name: 'redcoin',
    amount: new BigNumber(1000000),
    precision: 4,
    privateKey: '7bb05e6087cd116aa5f1da9001736a5350981c4548116e2bc08c9a4f29b3fee4',
  },

  {
    assetType: 'Token',
    name: 'bluecoin',
    amount: new BigNumber(660000),
    precision: 0,
    privateKey: 'c27b96a2854ead7d4b4ef50de2695201fef87d3d46c9b36a6cd113774706748b',
  },

  {
    assetType: 'Currency',
    name: 'greencoin',
    amount: new BigNumber(50000000),
    precision: 6,
    privateKey: '8868b8c6152e3ba39e3c31b4774f67fcce3465f41720a408d59bfd34e6980ec3',
  },
];

export interface TokenInfo {
  readonly name: string;
  readonly amount: BigNumber;
  readonly privateKey: string;
}

export const TOKEN_INFO: ReadonlyArray<TokenInfo> = [
  {
    name: 'RedToken',
    amount: new BigNumber(1000000),
    privateKey: '3fedc9048caf7b75cece9d0db85748e5cb44940ff4d48f6230526db295040df4',
  },

  {
    name: 'BlueToken',
    amount: new BigNumber(660000),
    privateKey: 'b29b677bf6c1abb7e184d943df10c3b57bedc14a85f9fda21cc93ec1b91be9ae',
  },

  {
    name: 'GreenToken',
    amount: new BigNumber(50000000),
    privateKey: 'b8ec5eb6c6f499240fc431bbf68feee76ef503212e61496f0c8b8804168ae954',
  },
];

interface WalletData {
  readonly name: string;
  readonly privateKey: string;
  readonly accountID: UserAccountID;
}

interface NetworkData {
  readonly name: string;
  readonly rpcURL: string;
}

interface BootstrapData {
  readonly network: NetworkData;
  readonly master: WalletData;
  readonly wallets: ReadonlyArray<WalletData>;
  readonly assetWallets: ReadonlyArray<WalletData>;
  readonly tokenWallets: ReadonlyArray<WalletData>;
}

const getNetwork = async ({ cli, options }: GetCLIResourceOptions): Promise<string> => {
  const { network: networkName } = options;
  if (networkName != undefined && typeof networkName === 'string') {
    return networkName;
  }

  const { network } = await cli.getSession(networkConstants.PLUGIN);
  if (network != undefined && typeof network === 'string') {
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

  if (rpc != undefined && typeof rpc === 'string') {
    if (rpc === networkConstants.NETWORK_URL.MAIN || rpc === networkConstants.NETWORK_URL.TEST) {
      throw new Error('Invalid Network: Can only bootstrap a private network');
    }

    return rpc;
  }
  throw new Error('Bootstrap requires an input RPC URL to connect to the NEO Tracker private network');
}

const makeWallet = ({ networkName, wallet }: { readonly networkName: string; readonly wallet: Wallet }) => {
  if (wallet.wif === undefined) {
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
}: {
  readonly walletName: string;
  readonly networkName: string;
  readonly cli: InteractiveCLI;
  readonly plugin: WalletPlugin;
}): Promise<WalletData> {
  const wallet = await plugin.walletResourceType.getResource({
    name: constants.makeWallet({
      network: networkName,
      name: walletName,
    }),

    client: cli.client,
    options: {},
  });

  if (wallet === undefined) {
    throw new Error(`Something went wrong, could not get wallet ${walletName}`);
  }

  return makeWallet({ networkName, wallet });
}

async function createWallet({
  walletName,
  networkName,
  cli,
  privateKey,
}: {
  readonly walletName: string;
  readonly networkName: string;
  readonly cli: InteractiveCLI;
  readonly privateKey?: string;
}): Promise<WalletData> {
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

  const wallet = walletResource as Wallet;

  return makeWallet({ networkName, wallet });
}
// tslint:disable-next-line no-any
function getNumWallets(options: any): number {
  let { wallets } = options;
  if (wallets != undefined && typeof wallets !== 'number') {
    throw new Error('--wallets <number> option must be a number');
  }

  if (wallets == undefined) {
    wallets = DEFAULT_NUM_WALLETS;
  }

  return wallets % 2 === 0 ? wallets : wallets + 1;
}

async function createTransfers({
  wallet,
  from,
}: {
  readonly wallet: WalletData;
  readonly from?: WalletData;
  // tslint:disable-next-line readonly-array
}): Promise<Transfer[]> {
  let neo;
  let gas;
  if (from === undefined) {
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
}: {
  readonly wallets: ReadonlyArray<WalletData>;
  readonly master: WalletData;
  readonly client: Client;
  readonly developerClient: DeveloperClient;
}): Promise<void> {
  const [firstWalletBatch, secondWalletBatch] = _.chunk(wallets, wallets.length / 2);

  const firstTransferBatchRaw = await Promise.all(firstWalletBatch.map(async (wallet) => createTransfers({ wallet })));
  const firstTransferBatch = _.flatten<Transfer>(firstTransferBatchRaw);

  const firstTransactionBatch = await client.transfer(firstTransferBatch, {
    from: master.accountID,
  });

  await Promise.all([developerClient.runConsensusNow(), firstTransactionBatch.confirmed()]);

  const secondTransactionBatch = await Promise.all(
    utils.zip(firstWalletBatch, secondWalletBatch).map(async ([from, wallet]) =>
      client.transfer(await createTransfers({ wallet, from }), {
        from: from.accountID,
      }),
    ),
  );

  await Promise.all([
    Promise.all(secondTransactionBatch.map(async (transaction) => transaction.confirmed())),
    developerClient.runConsensusNow(),
  ]);
}

async function initiateClaims({
  wallets,
  networkName,
  client,
  developerClient,
  provider,
}: {
  readonly wallets: ReadonlyArray<WalletData>;
  readonly networkName: string;
  readonly client: Client;
  readonly developerClient: DeveloperClient;
  readonly provider: NEOONEProvider;
}): Promise<void> {
  const unclaimed = await Promise.all(
    wallets.map(async (wallet) => provider.getUnclaimed(networkName, wallet.accountID.address)),
  );

  const unclaimedWallets = utils
    .zip(wallets, unclaimed)
    // tslint:disable-next-line no-unused
    .filter(([__, accountUnclaimed]) => accountUnclaimed.unclaimed.length > 0)
    .map(([wallet]) => wallet);

  const claims = await Promise.all(unclaimedWallets.map(async (wallet) => client.claim({ from: wallet.accountID })));

  await Promise.all([developerClient.runConsensusNow(), Promise.all(claims.map(async (claim) => claim.confirmed()))]);
}

async function setupWallets({
  wallets,
  client,
  developerClient,
  master,
}: {
  readonly wallets: ReadonlyArray<WalletData>;
  readonly client: Client;
  readonly developerClient: DeveloperClient;
  readonly master: WalletData;
}): Promise<void> {
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

interface AssetWithWallet extends AssetInfo {
  readonly wallet: WalletData;
  readonly hash: Hash256String;
}

async function registerAssets({
  assetWallets,
  client,
  developerClient,
}: {
  readonly assetWallets: ReadonlyArray<WalletData>;
  readonly client: Client;
  readonly developerClient: DeveloperClient;
}): Promise<ReadonlyArray<AssetWithWallet>> {
  const assetRegistrations = await Promise.all(
    utils.zip(ASSET_INFO, assetWallets).map(async ([asset, wallet]) =>
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

  const [registrations] = await Promise.all([
    Promise.all(assetRegistrations.map(async (registration) => registration.confirmed())),
    developerClient.runConsensusNow(),
  ]);

  const assetHashes = registrations.filter(Boolean).map((registration) => {
    if (registration.result.state === 'FAULT') {
      throw new Error(registration.result.message);
    }

    return registration.result.value.hash;
  });

  return utils.zip(ASSET_INFO, assetWallets, assetHashes).map((asset) => ({
    ...asset[0],
    wallet: asset[1],
    hash: asset[2],
  }));
}

async function issueAsset({
  asset,
  client,
}: {
  readonly asset: AssetWithWallet;
  readonly client: Client;
}): Promise<TransactionResult<TransactionReceipt>> {
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
}: {
  readonly assets: ReadonlyArray<AssetWithWallet>;
  readonly client: Client;
  readonly developerClient: DeveloperClient;
}) => {
  const issues = await Promise.all(assets.map(async (asset) => issueAsset({ asset, client })));

  await Promise.all([developerClient.runConsensusNow(), Promise.all(issues.map(async (issue) => issue.confirmed()))]);
};

async function createAssetTransfer({
  wallets,
  asset,
  client,
}: {
  readonly wallets: ReadonlyArray<WalletData>;
  readonly asset: AssetWithWallet;
  readonly client: Client;
}): Promise<TransactionResult<TransactionReceipt>> {
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
}: {
  readonly wallets: ReadonlyArray<WalletData>;
  readonly assets: ReadonlyArray<AssetWithWallet>;
  readonly client: Client;
  readonly developerClient: DeveloperClient;
}) => {
  const assetTransfers = await Promise.all(
    assets.map(async (asset, idx) =>
      createAssetTransfer({
        wallets: idx % 2 === 0 ? wallets.slice(0, wallets.length / 2) : wallets.slice(wallets.length / 2),
        asset,
        client,
      }),
    ),
  );

  await Promise.all([
    developerClient.runConsensusNow(),
    Promise.all(assetTransfers.map(async (transfer) => transfer.confirmed())),
  ]);
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
}: {
  readonly cliOptions: GetCLIResourceOptions;
  readonly plugin: WalletPlugin;
  readonly walletNames: ReadonlyArray<string>;
}): Promise<BootstrapData> {
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

  const wallets = utils
    .zip(
      walletNames.slice(0, DEFAULT_PRIVATE_KEYS.length / 2),
      DEFAULT_PRIVATE_KEYS.slice(0, DEFAULT_PRIVATE_KEYS.length / 2),
    )
    .map(getHardCodedWallet)
    .concat(walletNames.slice(DEFAULT_PRIVATE_KEYS.length / 2, walletNames.length / 2).map(getGeneratedWallet))
    .concat(
      utils
        .zip(
          walletNames.slice(walletNames.length / 2, walletNames.length / 2 + DEFAULT_PRIVATE_KEYS.length / 2),

          DEFAULT_PRIVATE_KEYS.slice(DEFAULT_PRIVATE_KEYS.length / 2),
        )
        .map(getHardCodedWallet),
    )
    .concat(walletNames.slice(walletNames.length / 2 + DEFAULT_PRIVATE_KEYS.length / 2).map(getGeneratedWallet));

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
}: {
  readonly cliOptions: GetCLIResourceOptions;
  readonly plugin: WalletPlugin;
  readonly walletNames: ReadonlyArray<string>;
}): Promise<BootstrapData> {
  const networkName = await getNetwork(cliOptions);

  if (networkName === networkConstants.NETWORK_NAME.MAIN || networkName === networkConstants.NETWORK_NAME.TEST) {
    throw new Error('Invalid Network: Can only bootstrap a private network');
  }

  const networkResource = await cliOptions.cli.client.getResource({
    plugin: networkConstants.PLUGIN,
    name: networkName,
    resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
    options: {},
  });

  if (networkResource === undefined) {
    throw new Error(`Network ${networkName} does not exist.`);
  }

  const networkInfo = networkResource as Network;
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
    walletNames.map(async (walletName) =>
      createWallet({
        walletName,
        networkName: network.name,
        cli: cliOptions.cli,
      }),
    ),
  );

  const assetWallets = await Promise.all(
    getAssetWallets(network.name).map(async (wallet) =>
      createWallet({
        walletName: wallet.name,
        networkName: network.name,
        cli: cliOptions.cli,
        privateKey: wallet.privateKey,
      }),
    ),
  );

  const tokenWallets = await Promise.all(
    getTokenWallets(network.name).map(async (wallet) =>
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
}: {
  readonly keystore: LocalKeyStore;
  readonly networkName: string;
  readonly master: WalletData;
  readonly wallets: ReadonlyArray<WalletData>;
  readonly assetWallets: ReadonlyArray<WalletData>;
  readonly tokenWallets: ReadonlyArray<WalletData>;
}): Promise<void> {
  await Promise.all(
    wallets
      .concat([master])
      .concat(assetWallets)
      .concat(tokenWallets)
      .map(async (wallet) =>
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

export const compileSmartContract = async (contractName: string): Promise<CompileContractResult> => {
  const dir = await findContracts(require.resolve('@neo-one/server-plugin-wallet'));

  return findAndCompileContract({
    dir,
    contractName,
  });
};

const compileSmartContracts = async (
  contractNames: ReadonlyArray<string>,
): Promise<ReadonlyArray<CompileContractResult>> => Promise.all(contractNames.map(compileSmartContract));

// tslint:disable-next-line no-suspicious-comment
// TODO: Support using neo-one cli for compiling/publishing when !isRPC
const publishContract = async ({
  wallet,
  client,
  result: { contract },
}: {
  readonly wallet: WalletData;
  readonly isRPC: boolean;
  readonly client: Client;
  readonly result: CompileContractResult;
}): Promise<TransactionResult<PublishReceipt>> => client.publish(contract, { from: wallet.accountID });

interface TokenWithWallet extends TokenInfo {
  readonly wallet: WalletData;
  readonly smartContract: SmartContract;
  readonly hash: string;
}

const publishTokens = async ({
  tokenWallets,
  isRPC,
  client,
  developerClient,
}: {
  readonly tokenWallets: ReadonlyArray<WalletData>;
  readonly isRPC: boolean;
  readonly client: Client;
  readonly developerClient: DeveloperClient;
}): Promise<ReadonlyArray<TokenWithWallet>> => {
  const wallets = utils.zip(tokenWallets, TOKEN_INFO).map(([wallet, token]) => ({
    wallet,
    token,
  }));

  const compileResults = await compileSmartContracts(wallets.map(({ token }) => token.name));

  const publishResults = await Promise.all(
    utils.zip(wallets, compileResults).map(async ([{ wallet }, compileResult]) =>
      publishContract({
        wallet,
        result: compileResult,
        isRPC,
        client,
      }),
    ),
  );

  const [receipts] = await Promise.all([
    Promise.all(publishResults.map(async (result) => result.confirmed())),
    developerClient.runConsensusNow(),
  ]);

  const tokenWithWallets = utils
    .zip(wallets, compileResults, receipts)
    .map(([{ token, wallet }, compileResult, receipt]) => {
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }

      const hash = receipt.result.value.hash;
      const smartContract = client.smartContract({
        networks: {
          [wallet.accountID.network]: { hash },
        },
        abi: compileResult.abi,
        sourceMap: compileResult.sourceMap,
      });

      return { ...token, smartContract, wallet, hash };
    });

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
  tokens,
  count,
  developerClient,
}: {
  readonly tokens: ReadonlyArray<[TokenWithWallet, WalletData]>;
  readonly count: number;
  readonly developerClient: DeveloperClient;
}): Promise<void> {
  const results = await Promise.all(
    tokens.map(([token, wallet]) =>
      token.smartContract.transfer(
        privateKeyToScriptHash(token.wallet.privateKey),
        privateKeyToScriptHash(wallet.privateKey),
        token.amount
          .div(2)
          .div(count)
          .integerValue(BigNumber.ROUND_FLOOR),
        { from: token.wallet.accountID },
      ),
    ),
  );

  await Promise.all([Promise.all(results.map((result) => result.confirmed())), developerClient.runConsensusNow()]);
}

const transferTokens = async ({
  wallets,
  tokens,
  developerClient,
}: {
  readonly wallets: ReadonlyArray<WalletData>;
  readonly tokens: ReadonlyArray<TokenWithWallet>;
  readonly developerClient: DeveloperClient;
}) => {
  const count = wallets.length / 2;
  const tokensWithWallets = tokens.map<[TokenWithWallet, ReadonlyArray<WalletData>]>((token, idx) => [
    token,
    idx % 2 === 0 ? wallets.slice(0, count) : wallets.slice(count),
  ]);
  // tslint:disable-next-line no-loop-statement
  for (const idx of _.range(count)) {
    await transferToken({
      tokens: tokensWithWallets.map<[TokenWithWallet, WalletData]>(([token, tokenWallets]) => [
        token,
        tokenWallets[idx],
      ]),
      count,
      developerClient,
    });
  }
};

export const bootstrap = (plugin: WalletPlugin) => ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command('bootstrap', 'Bootstraps a Network with test data.')
    .option('-n, --network <name>', 'Network to bootstrap')
    .option('--wallets <number>', 'Number of wallets to create - default 10')
    .option('--rpc <string>', 'Bootstraps a private network with the given rpcURL.')
    .option('--testing-only', 'Option to spoof rpc path for testing')
    .option('--reset', 'Reset blockchain before bootstrapping')
    .action(async (args) => {
      const spinner = ora(`Gathering data for bootstrap`).start();

      const walletNames: string[] = [];
      const numWallets = getNumWallets(args.options);
      // tslint:disable-next-line no-loop-statement
      for (let i = 1; i < numWallets + 1; i += 1) {
        // tslint:disable-next-line no-array-mutation
        walletNames.push(`wallet-${i}`);
      }

      try {
        let bootstrapData;
        const cliOptions = {
          cli,
          args,
          options: args.options,
        };

        if (args.options.rpc != undefined) {
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
        const { network, master, wallets, assetWallets, tokenWallets } = bootstrapData;
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

        const developerClient = new DeveloperClient(provider.read(network.name));

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
        const isRPC = args.options.rpc != undefined;
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

        cli.print('Published contracts:');
        tokens.forEach(({ name, hash }) => {
          cli.print(`${name}:${hash}`);
        });
      } catch (error) {
        spinner.fail(error);
        throw error;
      }
    });
