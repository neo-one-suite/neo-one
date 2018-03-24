/* @flow */
import type { ChildProcess } from 'child_process';
import {
  type DescribeTable,
  type PluginManager,
  type ResourceState,
  TaskList,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';
import {
  type MasterWalletResourceAdapter,
  constants as walletConstants,
} from '@neo-one/server-plugin-wallet';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import type { Subject } from 'rxjs/Subject';

import execa from 'execa';
import fs from 'fs-extra';
import { map, shareReplay } from 'rxjs/operators';
import path from 'path';

import {
  type CreateContext,
  type Options,
  compileContracts,
  createNetwork,
  createSimulationDirectory,
  deployContracts,
  deployContractsEnabled,
  getOptions,
  runCreateHooks,
  runPreCompileHooks,
  setupWallets,
  setupWalletsEnabled,
  writeOptions,
  writeSimulationConfig,
} from './create';
import {
  CouldNotLoadSimulationError,
  SimulationPackageRequiredError,
} from './errors';
import type SimulationResourceType, {
  Simulation,
  SimulationResourceOptions,
} from './SimulationResourceType';
import type { SimulationConfig } from './types';

export type SimulationResourceAdapterInitOptions = {|
  name: string,
  dataPath: string,
  resourceType: SimulationResourceType,
  pluginManager: PluginManager,
|};

export type SimulationResourceAdapterStaticOptions = {|
  ...SimulationResourceAdapterInitOptions,
  createOptionsPath: string,
|};

export type SimulationResourceAdapterCreateOptions = {|
  simulationPath: string,
  simulationPackage: string,
  simulationConfig: SimulationConfig,
|};

export type SimulationResourceAdapterOptions = {|
  ...SimulationResourceAdapterStaticOptions,
  ...SimulationResourceAdapterCreateOptions,
|};

const CREATE_OPTIONS = 'config.json';

export default class SimulationResourceAdapter {
  _name: string;
  _dataPath: string;
  _resourceType: SimulationResourceType;
  _createOptionsPath: string;
  _simulationPath: string;
  _simulationPackage: string;
  _simulationConfig: SimulationConfig;
  _state: ResourceState;
  _subprocesses: Array<ChildProcess>;

  _update$: Subject<void>;

  resource$: Observable<Simulation>;

  constructor({
    name,
    dataPath,
    resourceType,
    createOptionsPath,
    simulationPath,
    simulationPackage,
    simulationConfig,
  }: SimulationResourceAdapterOptions) {
    this._name = name;
    this._dataPath = dataPath;
    this._resourceType = resourceType;
    this._simulationPath = simulationPath;
    this._simulationPackage = simulationPackage;
    this._simulationConfig = simulationConfig;
    this._createOptionsPath = createOptionsPath;
    this._state = 'stopped';
    this._subprocesses = [];

    this._update$ = new ReplaySubject(1);
    this.resource$ = this._update$.pipe(
      map(() => this._toResource()),
      shareReplay(1),
    );
    this._update$.next();
  }

  static async init(
    options: SimulationResourceAdapterInitOptions,
  ): Promise<SimulationResourceAdapter> {
    const staticOptions = this._getStaticOptions(options);
    const createOptions = await fs.readJSON(staticOptions.createOptionsPath);
    return this._createResourceAdapter({
      staticOptions,
      createOptions,
    });
  }

  // eslint-disable-next-line
  async destroy(): Promise<void> {}

  static create(
    adapterOptions: SimulationResourceAdapterInitOptions,
    resourceOptions: SimulationResourceOptions,
  ): TaskList {
    const { pluginManager } = adapterOptions;
    const staticOptions = this._getStaticOptions(adapterOptions);
    const { simulationPackage } = resourceOptions;
    if (simulationPackage == null) {
      throw new SimulationPackageRequiredError();
    }
    const simulationConfig = this._loadSimulationConfig(
      staticOptions,
      simulationPackage,
    );
    const options = getOptions({
      name: staticOptions.name,
      simulationConfig,
      options: resourceOptions,
    });
    const createOptions = this._getCreateOptions({
      staticOptions,
      options,
    });
    const dependencies = [];
    const resourceAdapter = this._createResourceAdapter({
      staticOptions,
      createOptions,
    });

    const masterWalletResourceAdapter = (pluginManager.getResourcesManager({
      plugin: walletConstants.PLUGIN,
      resourceType: walletConstants.WALLET_RESOURCE_TYPE,
    }).masterResourceAdapter: MasterWalletResourceAdapter);
    const { client } = masterWalletResourceAdapter;

    return new TaskList({
      initialContext: {
        options,
        createOptions,
        staticOptions,
        dependencies,
        dependents: dependencies,
        resourceAdapter,
        client,
        pluginManager,
      },
      tasks: [
        {
          title: 'Initialize simulation [1]',
          task: () =>
            new TaskList({
              tasks: [createSimulationDirectory, createNetwork, writeOptions],
              concurrent: true,
              collapse: false,
            }),
        },
        {
          title: 'Initialize simulation [2]',
          task: () =>
            new TaskList({
              tasks: [runPreCompileHooks, compileContracts],
              collapse: false,
            }),
        },
        {
          title: 'Initialize simulation [3]',
          enabled: (ctx: CreateContext) =>
            setupWalletsEnabled(ctx) || deployContractsEnabled(ctx),
          task: () =>
            new TaskList({
              tasks: [setupWallets, deployContracts],
              concurrent: true,
              collapse: false,
            }),
        },
        writeSimulationConfig,
        runCreateHooks,
      ],
      collapse: false,
    });
  }

  static _loadSimulationConfig(
    options: SimulationResourceAdapterStaticOptions,
    simulationPackage: string,
  ): SimulationConfig {
    const config = this._tryRequireConfig(options, simulationPackage);
    if (config == null) {
      throw new CouldNotLoadSimulationError(simulationPackage);
    }

    return config;
  }

  static _tryRequireConfig(
    options: SimulationResourceAdapterStaticOptions,
    simulationPackage: string,
  ): ?SimulationConfig {
    try {
      // $FlowFixMe
      const config = require(simulationPackage); // eslint-disable-line
      return config != null && config.default != null ? config.default : config;
    } catch (error) {
      options.resourceType.plugin.monitor.logError({
        name: 'neo_simulation_resource_adapter_require_error',
        message: `Failed to require ${simulationPackage}`,
        error,
      });
      return null;
    }
  }

  static _getStaticOptions(
    options: SimulationResourceAdapterInitOptions,
  ): SimulationResourceAdapterStaticOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      resourceType: options.resourceType,
      pluginManager: options.pluginManager,
      createOptionsPath: path.resolve(options.dataPath, CREATE_OPTIONS),
    };
  }

  static _getCreateOptions({
    options,
  }: {|
    staticOptions: SimulationResourceAdapterStaticOptions,
    options: Options,
  |}): SimulationResourceAdapterCreateOptions {
    return {
      simulationPath: options.simulationPath,
      simulationPackage: options.simulationPackage,
      simulationConfig: options.simulationConfig,
    };
  }

  static _createResourceAdapter({
    staticOptions,
    createOptions,
  }: {|
    staticOptions: SimulationResourceAdapterStaticOptions,
    createOptions: SimulationResourceAdapterCreateOptions,
  |}): SimulationResourceAdapter {
    return new SimulationResourceAdapter({
      name: staticOptions.name,
      dataPath: staticOptions.dataPath,
      resourceType: staticOptions.resourceType,
      pluginManager: staticOptions.pluginManager,
      createOptionsPath: staticOptions.createOptionsPath,
      simulationPath: createOptions.simulationPath,
      simulationPackage: createOptions.simulationPackage,
      simulationConfig: createOptions.simulationConfig,
    });
  }

  // eslint-disable-next-line
  delete(options: SimulationResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean up local files',
          task: async () => {
            await fs.remove(this._dataPath);
          },
        },
      ],
    });
  }

  // eslint-disable-next-line
  start(options: SimulationResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Start simulation hooks',
          enabled: () =>
            this._simulationConfig.hooks != null &&
            this._simulationConfig.hooks.postStart != null &&
            this._simulationConfig.hooks.postStart.length > 0,
          task: async () => {
            const { hooks } = this._simulationConfig;
            if (hooks == null) {
              throw new Error('For Flow');
            }

            const { postStart } = hooks;
            if (postStart == null) {
              throw new Error('For Flow');
            }

            this._subprocesses = postStart.map(cmd =>
              execa.shell(cmd, {
                cwd: this._simulationPath,
                stdio: 'ignore',
                shell: true,
              }),
            );
          },
        },
      ],
    });
  }

  // eslint-disable-next-line
  stop(options: SimulationResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Stop simulation hooks',
          enabled: () =>
            this._simulationConfig.hooks != null &&
            this._simulationConfig.hooks.postStart != null &&
            this._simulationConfig.hooks.postStart.length > 0,
          task: () => {
            const { hooks } = this._simulationConfig;
            if (hooks == null) {
              throw new Error('For Flow');
            }

            const { postStart } = hooks;
            if (postStart == null) {
              throw new Error('For Flow');
            }

            this._subprocesses.forEach(proc => {
              proc.kill('SIGTERM');
            });
            this._subprocesses = [];
          },
        },
      ],
    });
  }

  _toResource(): Simulation {
    return {
      plugin: this._resourceType.plugin.name,
      resourceType: this._resourceType.name,
      name: this._name,
      baseName: this._name,
      state: this._state,
      simulationPackage: this._simulationPackage,
    };
  }

  getDebug(): DescribeTable {
    return [];
  }
}
