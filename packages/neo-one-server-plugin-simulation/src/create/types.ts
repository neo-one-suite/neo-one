import { ABI, Client } from '@neo-one/client';
import { PluginManager, ResourceDependency } from '@neo-one/server-plugin';
import { SmartContractRegister } from '@neo-one/server-plugin-wallet';
import BigNumber from 'bignumber.js';
import {
  SimulationResourceAdapter,
  SimulationResourceAdapterCreateOptions,
  SimulationResourceAdapterStaticOptions,
} from '../SimulationResourceAdapter';
import { SimulationConfig, SimulationPreCompileOutputConfig } from '../types';
export interface Options {
  readonly simulationPackage: string;
  readonly simulationConfig: SimulationConfig;
  readonly simulationPath: string;
  readonly templatePath: string;
  readonly targetContract?: {
    readonly rootPath: string;
    readonly targetPath: string;
    readonly language: string;
    readonly compileContracts: ReadonlyArray<{
      readonly name: string;
      readonly path: string;
      readonly abi?: ABI;
      readonly hasDynamicInvoke?: boolean;
      readonly hasStorage?: boolean;
      readonly payable?: boolean;
    }>;
    readonly deployContracts?: ReadonlyArray<{
      readonly baseName: string;
      readonly name: string;
      readonly network: string;
      readonly wallet: string;
      readonly contract: {
        readonly name: string;
        readonly register: SmartContractRegister;
      };
    }>;
  };
  readonly wallets?: ReadonlyArray<{
    readonly name: string;
    readonly baseName: string;
    readonly network: string;
    readonly privateKey?: string;
    readonly neo?: BigNumber;
    readonly gas?: BigNumber;
  }>;
  readonly network?: {
    readonly name: string;
  };
  readonly preCompile?: string;
  readonly preCompileConfig?: SimulationPreCompileOutputConfig;
  readonly createHook?: string;
  readonly configPath: string;
  // tslint:disable-next-line no-any
  readonly options: any;
}
export interface CreateContext {
  readonly staticOptions: SimulationResourceAdapterStaticOptions;
  readonly createOptions: SimulationResourceAdapterCreateOptions;
  readonly options: Options;
  mutableDependencies: ResourceDependency[];
  readonly resourceAdapter: SimulationResourceAdapter;
  readonly pluginManager: PluginManager;
  readonly client: Client;
}
