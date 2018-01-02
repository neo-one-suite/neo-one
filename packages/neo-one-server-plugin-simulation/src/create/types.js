/* @flow */
import type { ABI, Client } from '@neo-one/client';
import type BigNumber from 'bignumber.js';
import type { PluginManager, ResourceDependency } from '@neo-one/server-plugin';
import type { SmartContractRegister } from '@neo-one/server-plugin-wallet';

import type {
  SimulationConfig,
  SimulationPreCompileOutputConfig,
} from '../types';
import type SimulationResourceAdapter, {
  SimulationResourceAdapterCreateOptions,
  SimulationResourceAdapterStaticOptions,
} from '../SimulationResourceAdapter';

export type Options = {|
  simulationPackage: string,
  simulationConfig: SimulationConfig,
  simulationPath: string,
  templatePath: string,
  targetContract?: {|
    rootPath: string,
    targetPath: string,
    language: string,
    compileContracts: Array<{|
      name: string,
      path: string,
      abi?: ABI,
      hasDynamicInvoke?: boolean,
      hasStorage?: boolean,
    |}>,
    deployContracts: Array<{|
      baseName: string,
      name: string,
      network: string,
      wallet: string,
      contract: {|
        name: string,
        register: SmartContractRegister,
      |},
    |}>,
  |},
  wallets?: Array<{|
    name: string,
    baseName: string,
    network: string,
    privateKey?: string,
    neo?: BigNumber,
    gas?: BigNumber,
  |}>,
  network?: {|
    name: string,
  |},
  preCompile?: string,
  preCompileConfig?: SimulationPreCompileOutputConfig,
  createHook?: string,
  configPath: string,
  options: Object,
|};

export type CreateContext = {
  staticOptions: SimulationResourceAdapterStaticOptions,
  createOptions: SimulationResourceAdapterCreateOptions,
  options: Options,
  dependencies: Array<ResourceDependency>,
  dependents: Array<ResourceDependency>,
  resourceAdapter: SimulationResourceAdapter,
  pluginManager: PluginManager,
  client: Client<any>,
};
