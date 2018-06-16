import { wifToPrivateKey } from '@neo-one/client';
import { PluginManager } from '@neo-one/server-plugin';
import { constants as compilerConstants, Contract } from '@neo-one/server-plugin-compiler';
import { constants as networkConstants, Network } from '@neo-one/server-plugin-network';
import { constants as walletConstants, SmartContract, Wallet } from '@neo-one/server-plugin-wallet';
import fs from 'fs-extra';
import { take } from 'rxjs/operators';
import {
  CompiledContractsOutputConfig,
  DeployedContractsOutputConfig,
  NetworkOutputConfig,
  SimulationOutputConfig,
  WalletsOutputConfig,
} from '../types';
import { CreateContext, Options } from './types';

interface CommonOptions {
  readonly pluginManager: PluginManager;
  readonly options: Options;
}

const getNetwork = async ({
  pluginManager,
  options: { network },
}: CommonOptions): Promise<NetworkOutputConfig | undefined> => {
  if (network === undefined) {
    return undefined;
  }

  const networkResource = await (pluginManager
    .getResourcesManager({
      plugin: networkConstants.PLUGIN,
      resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
    })
    .getResource$({ name: network.name, options: {} })
    .pipe(take(1))
    .toPromise() as Promise<Network | undefined>);

  if (networkResource === undefined) {
    throw new Error('Something went wrong');
  }

  return {
    name: networkResource.name,
    rpcURL: networkResource.nodes[0].rpcAddress,
  };
};

const getWallets = async ({ pluginManager, options }: CommonOptions): Promise<WalletsOutputConfig> => {
  const { network, wallets: walletsIn } = options;
  if (network === undefined) {
    return {};
  }

  const wallets = (walletsIn === undefined ? [] : walletsIn)
    .map((wallet) => ({
      name: wallet.name,
      network: wallet.network,
    }))
    .concat([
      {
        name: walletConstants.makeMasterWallet(network.name),
        network: network.name,
      },
    ]);

  const walletResources = await Promise.all(
    wallets.map(
      async (wallet) =>
        pluginManager
          .getResourcesManager({
            plugin: walletConstants.PLUGIN,
            resourceType: walletConstants.WALLET_RESOURCE_TYPE,
          })
          .getResource$({
            name: wallet.name,
            options: { network: wallet.network },
          })
          .pipe(take(1))
          .toPromise() as Promise<Wallet | undefined>,
    ),
  ).then((resources) =>
    resources.map((resource) => {
      if (resource === undefined) {
        throw new Error('Something went wrong.');
      }

      return resource;
    }),
  );

  return walletResources.reduce<WalletsOutputConfig>((acc, wallet) => {
    const { name } = walletConstants.extractWallet(wallet.name);
    if (wallet.wif === undefined) {
      throw new Error('Something went wrong.');
    }

    return {
      ...acc,
      [name]: {
        address: wallet.address,
        scriptHash: wallet.scriptHash,
        publicKey: wallet.publicKey,
        wif: wallet.wif,
        privateKey: wifToPrivateKey(wallet.wif),
      },
    };
  }, {});
};

const getCompiledContracts = async ({
  pluginManager,
  options,
}: CommonOptions): Promise<CompiledContractsOutputConfig> => {
  const { targetContract } = options;
  if (targetContract === undefined) {
    return {};
  }

  const contractResources = await Promise.all(
    targetContract.compileContracts.map(
      async (contract) =>
        pluginManager
          .getResourcesManager({
            plugin: compilerConstants.PLUGIN,
            resourceType: compilerConstants.CONTRACT_RESOURCE_TYPE,
          })
          .getResource$({ name: contract.name, options: {} })
          .pipe(take(1))
          .toPromise() as Promise<Contract | undefined>,
    ),
  ).then((resources) =>
    resources.map((resource) => {
      if (resource === undefined) {
        throw new Error('Something went wrong.');
      }

      return resource;
    }),
  );

  return contractResources.reduce<CompiledContractsOutputConfig>(
    (acc, contract) => ({
      ...acc,
      [contract.name]: { abi: contract.abi },
    }),
    {},
  );
};

const getDeployedContracts = async ({
  pluginManager,
  options,
}: CommonOptions): Promise<DeployedContractsOutputConfig> => {
  const { targetContract } = options;
  if (targetContract === undefined || targetContract.deployContracts === undefined) {
    return {};
  }

  const contractResources = await Promise.all(
    targetContract.deployContracts.map(
      async (contract) =>
        pluginManager
          .getResourcesManager({
            plugin: walletConstants.PLUGIN,
            resourceType: walletConstants.SMART_CONTRACT_RESOURCE_TYPE,
          })
          .getResource$({
            name: contract.name,
            options: { network: contract.network },
          })
          .pipe(take(1))
          .toPromise() as Promise<SmartContract | undefined>,
    ),
  ).then((resources) =>
    resources.map((resource) => {
      if (resource === undefined) {
        throw new Error('Something went wrong.');
      }

      return resource;
    }),
  );

  return contractResources.reduce<DeployedContractsOutputConfig>((acc, contract) => {
    const { name } = walletConstants.extractContract(contract.name);

    return {
      ...acc,
      [name]: {
        hash: contract.hash,
        abi: contract.abi,
      },
    };
  }, {});
};

const getSimulationConfiguration = async (common: CommonOptions): Promise<SimulationOutputConfig> => {
  const [network, wallets, compiledContracts, deployedContracts] = await Promise.all([
    getNetwork(common),
    getWallets(common),
    getCompiledContracts(common),
    getDeployedContracts(common),
  ]);

  return {
    network,
    wallets,
    compiledContracts,
    deployedContracts,
    language: common.options.targetContract === undefined ? undefined : common.options.targetContract.language,
    options: common.options.options,
  };
};

export const writeSimulationConfig = {
  title: 'Write simulation configuration',
  task: async (ctx: CreateContext) => {
    const config = await getSimulationConfiguration({
      pluginManager: ctx.pluginManager,
      options: ctx.options,
    });

    await fs.writeJSON(ctx.options.configPath, config, { spaces: 2 });
  },
};
