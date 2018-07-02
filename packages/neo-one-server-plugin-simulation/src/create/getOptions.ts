import { wifToPrivateKey } from '@neo-one/client';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import BigNumber from 'bignumber.js';
import * as path from 'path';
import {
  InvalidLanguageError,
  InvalidSimulationConfigError,
  SimulationPackageRequiredError,
  SimulationPathRequiredError,
} from '../errors';
import { SimulationResourceOptions } from '../SimulationResourceType';
import { LanguageContractConfig, SimulationConfig } from '../types';
import { Options } from './types';

const requireResolve = (simulationPackage: string, requirePath: string) =>
  path.resolve(require.resolve(simulationPackage), requirePath);

export const getOptions = ({
  name,
  simulationConfig,
  options,
}: {
  readonly name: string;
  readonly simulationConfig: SimulationConfig;
  readonly options: SimulationResourceOptions;
}): Options => {
  const { simulationPackage, simulationPath, language: languageIn } = options;
  if (simulationPackage === undefined) {
    throw new SimulationPackageRequiredError();
  }
  if (simulationPath === undefined) {
    throw new SimulationPathRequiredError();
  }

  const { contract: contractConfig, wallets: walletsConfig, skipNetworkCreate } = simulationConfig;
  let networkIn;
  if (!skipNetworkCreate) {
    networkIn = { name };
  }

  const network = networkIn;
  let masterWalletIn;
  let walletsIn;
  if (network !== undefined) {
    masterWalletIn = {
      name: walletConstants.makeMasterWallet(network.name),
      baseName: walletConstants.MASTER_WALLET,
      network: network.name,
    };

    if (walletsConfig !== undefined) {
      walletsIn = Object.entries(walletsConfig).map(([baseName, { neo, gas, wif }]) => ({
        name: walletConstants.makeWallet({
          network: network.name,
          name: baseName,
        }),

        baseName,
        network: network.name,
        privateKey: wif === undefined ? undefined : wifToPrivateKey(wif),
        neo: neo === undefined ? undefined : new BigNumber(neo),
        gas: gas === undefined ? undefined : new BigNumber(gas),
      }));
    }
  } else if (walletsConfig !== undefined) {
    throw new InvalidSimulationConfigError(`Network is required to create additional wallets`);
  }
  const masterWallet = masterWalletIn;
  const wallets = walletsIn;

  let targetContract;
  let preCompileConfig;
  if (contractConfig !== undefined) {
    const language = languageIn === undefined ? contractConfig.defaultLanguage : languageIn;
    const languageConfig = contractConfig.languages[language] as LanguageContractConfig | undefined;
    if (languageConfig === undefined) {
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
      .filter((contract) => contract.target !== undefined)
      .map((contract) => ({
        name: contract.resourceName,
        path: path.resolve(contractsDir, contract.file),
        abi: contract.abi,
        hasDynamicInvoke: contract.properties === undefined ? undefined : contract.properties.dynamicInvoke,
        hasStorage: contract.properties === undefined ? undefined : contract.properties.storage,
        payable: contract.properties === undefined ? undefined : contract.properties.payable,
      }));

    const deployContracts = languageConfig.contracts
      .filter((contract) => contract.target === 'deploy')
      .map((contract) => {
        if (network === undefined || masterWallet === undefined) {
          throw new InvalidSimulationConfigError(`Network is required to deploy contracts`);
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
                contract.name === undefined ? path.basename(contract.file, path.extname(contract.file)) : contract.name,
              codeVersion: contract.codeVersion === undefined ? '1.0.0' : contract.codeVersion,
              author: contract.author === undefined ? '' : contract.author,
              email: contract.email === undefined ? '' : contract.email,
              description: contract.description === undefined ? '' : contract.description,
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
    templatePath: requireResolve(simulationPackage, simulationConfig.templateDir),
    targetContract,
    wallets,
    network,
    preCompile: simulationConfig.hooks === undefined ? undefined : simulationConfig.hooks.preCompile,
    preCompileConfig,
    createHook: simulationConfig.hooks === undefined ? undefined : simulationConfig.hooks.postCreate,
    configPath: path.resolve(
      simulationPath,
      simulationConfig.configPath === undefined ? 'neo-one.json' : simulationConfig.configPath,
    ),
    options,
  };
};
