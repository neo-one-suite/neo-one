/* @flow */
import {
  type Contract,
  constants as compilerConstants,
} from '@neo-one/server-plugin-compiler';
import {
  type Network,
  constants as networkConstants,
} from '@neo-one/server-plugin-network';
import type { PluginManager } from '@neo-one/server-plugin';
import {
  type SmartContract,
  type Wallet,
  constants as walletConstants,
} from '@neo-one/server-plugin-wallet';

import fs from 'fs-extra';
import { wifToPrivateKey } from '@neo-one/client';
import { take } from 'rxjs/operators';

import type { CreateContext, Options } from './types';
import type {
  CompiledContractOutputConfig,
  CompiledContractsOutputConfig,
  DeployedContractOutputConfig,
  DeployedContractsOutputConfig,
  NetworkOutputConfig,
  SimulationOutputConfig,
  WalletOutputConfig,
  WalletsOutputConfig,
} from '../types';

type CommonOptions = {|
  pluginManager: PluginManager,
  options: Options,
|};

const getNetwork = async ({
  pluginManager,
  options: { network },
}: CommonOptions): Promise<?NetworkOutputConfig> => {
  if (network == null) {
    return null;
  }

  const networkResource = await (pluginManager
    .getResourcesManager({
      plugin: networkConstants.PLUGIN,
      resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
    })
    .getResource$({ name: network.name, options: {} })
    .pipe(take(1))
    .toPromise(): Promise<?Network>);

  if (networkResource == null) {
    throw new Error('Something went wrong');
  }

  return {
    name: networkResource.name,
    rpcURL: networkResource.nodes[0].rpcAddress,
  };
};

const getWallets = async ({
  pluginManager,
  options,
}: CommonOptions): Promise<WalletsOutputConfig> => {
  const { network, wallets: walletsIn } = options;
  if (network == null) {
    return {};
  }

  const wallets = (walletsIn || []).map(wallet => ({
    name: wallet.name,
    network: wallet.network,
  }));
  wallets.push({
    name: walletConstants.makeMasterWallet(network.name),
    network: network.name,
  });

  const walletResources = await Promise.all(
    wallets.map(
      wallet =>
        (pluginManager
          .getResourcesManager({
            plugin: walletConstants.PLUGIN,
            resourceType: walletConstants.WALLET_RESOURCE_TYPE,
          })
          .getResource$({
            name: wallet.name,
            options: { network: wallet.network },
          })
          .pipe(take(1))
          .toPromise(): Promise<?Wallet>),
    ),
  ).then(resources =>
    resources.map(resource => {
      if (resource == null) {
        throw new Error('Something went wrong.');
      }
      return resource;
    }),
  );

  return walletResources.reduce((acc, wallet) => {
    const { name } = walletConstants.extractWallet(wallet.name);
    if (wallet.wif == null) {
      throw new Error('Something went wrong.');
    }
    acc[name] = ({
      address: wallet.address,
      scriptHash: wallet.scriptHash,
      publicKey: wallet.publicKey,
      wif: wallet.wif,
      privateKey: wifToPrivateKey(wallet.wif),
    }: WalletOutputConfig);
    return acc;
  }, {});
};

const getCompiledContracts = async ({
  pluginManager,
  options,
}: CommonOptions): Promise<CompiledContractsOutputConfig> => {
  const { targetContract } = options;
  if (targetContract == null) {
    return {};
  }

  const contractResources = await Promise.all(
    targetContract.compileContracts.map(
      contract =>
        (pluginManager
          .getResourcesManager({
            plugin: compilerConstants.PLUGIN,
            resourceType: compilerConstants.CONTRACT_RESOURCE_TYPE,
          })
          .getResource$({ name: contract.name, options: {} })
          .pipe(take(1))
          .toPromise(): Promise<?Contract>),
    ),
  ).then(resources =>
    resources.map(resource => {
      if (resource == null) {
        throw new Error('Something went wrong.');
      }
      return resource;
    }),
  );

  return contractResources.reduce((acc, contract) => {
    acc[contract.name] = ({ abi: contract.abi }: CompiledContractOutputConfig);
    return acc;
  }, {});
};

const getDeployedContracts = async ({
  pluginManager,
  options,
}: CommonOptions): Promise<DeployedContractsOutputConfig> => {
  const { targetContract } = options;
  if (targetContract == null) {
    return {};
  }

  const contractResources = await Promise.all(
    targetContract.deployContracts.map(
      contract =>
        (pluginManager
          .getResourcesManager({
            plugin: walletConstants.PLUGIN,
            resourceType: walletConstants.SMART_CONTRACT_RESOURCE_TYPE,
          })
          .getResource$({
            name: contract.name,
            options: { network: contract.network },
          })
          .pipe(take(1))
          .toPromise(): Promise<?SmartContract>),
    ),
  ).then(resources =>
    resources.map(resource => {
      if (resource == null) {
        throw new Error('Something went wrong.');
      }
      return resource;
    }),
  );

  return contractResources.reduce((acc, contract) => {
    const { name } = walletConstants.extractContract(contract.name);
    acc[name] = ({
      hash: contract.hash,
      abi: contract.abi,
    }: DeployedContractOutputConfig);
    return acc;
  }, {});
};

const getSimulationConfiguration = async (
  common: CommonOptions,
): Promise<SimulationOutputConfig> => {
  const [
    network,
    wallets,
    compiledContracts,
    deployedContracts,
  ] = await Promise.all([
    getNetwork(common),
    getWallets(common),
    getCompiledContracts(common),
    getDeployedContracts(common),
  ]);

  return {
    network: network == null ? undefined : network,
    wallets,
    compiledContracts,
    deployedContracts,
    language:
      common.options.targetContract == null
        ? undefined
        : common.options.targetContract.language,
    options: common.options.options,
  };
};

export default {
  title: 'Write simulation configuration',
  task: async (ctx: CreateContext) => {
    const config = await getSimulationConfiguration({
      pluginManager: ctx.pluginManager,
      options: ctx.options,
    });
    await fs.writeJSON(ctx.options.configPath, config, { spaces: 2 });
  },
};
