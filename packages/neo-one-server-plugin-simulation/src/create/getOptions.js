/* @flow */
import BigNumber from 'bignumber.js';

import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import path from 'path';
import { utils } from '@neo-one/utils';
import { wifToPrivateKey } from '@neo-one/client';

import {
  InvalidLanguageError,
  InvalidSimulationConfigError,
  SimulationPackageRequiredError,
  SimulationPathRequiredError,
} from '../errors';

import type { Options } from './types';
import type { SimulationConfig } from '../types';
import type { SimulationResourceOptions } from '../SimulationResourceType';

const requireResolve = (simulationPackage: string, requirePath: string) =>
  path.resolve(require.resolve(simulationPackage), requirePath);

export default ({
  name,
  simulationConfig,
  options,
}: {|
  name: string,
  simulationConfig: SimulationConfig,
  options: SimulationResourceOptions,
|}): Options => {
  const { simulationPackage, simulationPath, language: languageIn } = options;
  if (simulationPackage == null) {
    throw new SimulationPackageRequiredError();
  }
  if (simulationPath == null) {
    throw new SimulationPathRequiredError();
  }

  const {
    contract: contractConfig,
    wallets: walletsConfig,
    skipNetworkCreate,
  } = simulationConfig;
  let networkIn;
  if (!skipNetworkCreate) {
    networkIn = { name };
  }

  const network = networkIn;
  let masterWalletIn;
  let walletsIn;
  if (network != null) {
    masterWalletIn = {
      name: walletConstants.makeMasterWallet(network.name),
      baseName: walletConstants.MASTER_WALLET,
      network: network.name,
    };
    if (walletsConfig != null) {
      walletsIn = utils
        .entries(walletsConfig)
        .map(([baseName, { neo, gas, wif }]) => ({
          name: walletConstants.makeWallet({
            network: network.name,
            name: baseName,
          }),
          baseName,
          network: network.name,
          privateKey: wif == null ? undefined : wifToPrivateKey(wif),
          neo: neo == null ? undefined : new BigNumber(neo),
          gas: gas == null ? undefined : new BigNumber(gas),
        }));
    }
  } else if (walletsConfig != null) {
    throw new InvalidSimulationConfigError(
      `Network is required to create additional wallets`,
    );
  }
  const masterWallet = masterWalletIn;
  const wallets = walletsIn;

  let targetContract;
  let preCompileConfig;
  if (contractConfig != null) {
    const language =
      languageIn == null ? contractConfig.defaultLanguage : languageIn;
    const languageConfig = contractConfig.languages[language];
    if (languageConfig == null) {
      throw new InvalidLanguageError(language);
    }

    const contractsDir = path.resolve(simulationPath, contractConfig.targetDir);
    preCompileConfig = {
      language,
      contractsDir,
      contractConfig: languageConfig,
      options,
    };
    const compileContracts = languageConfig.contracts
      .filter(contract => contract.target != null)
      .map(contract => ({
        name: contract.resourceName,
        path: path.resolve(contractsDir, contract.file),
        abi: contract.abi,
        hasDynamicInvoke:
          contract.properties == null
            ? undefined
            : contract.properties.dynamicInvoke,
        hasStorage:
          contract.properties == null ? undefined : contract.properties.storage,
      }));
    const deployContracts = languageConfig.contracts
      .filter(contract => contract.target === 'deploy')
      .map(contract => {
        if (network == null || masterWallet == null) {
          throw new InvalidSimulationConfigError(
            `Network is required to deploy contracts`,
          );
        }

        return {
          baseName: contract.resourceName,
          name: walletConstants.makeContract({
            name: contract.resourceName,
            network: network.name,
          }),
          network: network.name,
          wallet: masterWallet.name,
          contract: {
            name: contract.resourceName,
            register: {
              name:
                contract.name == null
                  ? path.basename(contract.file, path.extname(contract.file))
                  : contract.name,
              codeVersion:
                contract.codeVersion == null ? '1.0.0' : contract.codeVersion,
              author: contract.author == null ? '' : contract.author,
              email: contract.email == null ? '' : contract.email,
              description:
                contract.description == null ? '' : contract.description,
            },
          },
        };
      });
    targetContract = {
      rootPath: requireResolve(simulationPackage, languageConfig.rootDir),
      targetPath: contractsDir,
      language,
      compileContracts,
      deployContracts,
    };
  }

  return {
    simulationPackage,
    simulationConfig,
    simulationPath,
    templatePath: requireResolve(
      simulationPackage,
      simulationConfig.templateDir,
    ),
    targetContract,
    wallets,
    network,
    preCompile:
      simulationConfig.hooks == null
        ? undefined
        : simulationConfig.hooks.preCompile,
    preCompileConfig,
    createHook:
      simulationConfig.hooks == null
        ? undefined
        : simulationConfig.hooks.postCreate,
    configPath: path.resolve(
      simulationPath,
      simulationConfig.configPath == null
        ? 'neo-one.json'
        : simulationConfig.configPath,
    ),
    options,
  };
};
