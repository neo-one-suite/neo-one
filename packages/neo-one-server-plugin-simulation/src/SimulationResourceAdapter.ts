import { DescribeTable, PluginManager, ResourceState, TaskList } from '@neo-one/server-plugin';
import { constants as walletConstants, MasterWalletResourceAdapter } from '@neo-one/server-plugin-wallet';
import { ChildProcess } from 'child_process';
import execa from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  compileContracts,
  CreateContext,
  createNetwork,
  createSimulationDirectory,
  deployContracts,
  deployContractsEnabled,
  getOptions,
  Options,
  runCreateHooks,
  runPreCompileHooks,
  setupWallets,
  setupWalletsEnabled,
  writeOptions,
  writeSimulationConfig,
} from './create';
import { CouldNotLoadSimulationError, SimulationPackageRequiredError } from './errors';
import { Simulation, SimulationResourceOptions, SimulationResourceType } from './SimulationResourceType';
import { SimulationConfig } from './types';
export interface SimulationResourceAdapterInitOptions {
  readonly name: string;
  readonly dataPath: string;
  readonly resourceType: SimulationResourceType;
  readonly pluginManager: PluginManager;
}
export interface SimulationResourceAdapterStaticOptions extends SimulationResourceAdapterInitOptions {
  readonly createOptionsPath: string;
}
export interface SimulationResourceAdapterCreateOptions {
  readonly simulationPath: string;
  readonly simulationPackage: string;
  readonly simulationConfig: SimulationConfig;
}
export interface SimulationResourceAdapterOptions
  extends SimulationResourceAdapterStaticOptions,
    SimulationResourceAdapterCreateOptions {}

const CREATE_OPTIONS = 'config.json';

export class SimulationResourceAdapter {
  public static async init(options: SimulationResourceAdapterInitOptions): Promise<SimulationResourceAdapter> {
    const staticOptions = this.getStaticOptions(options);
    const createOptions = await fs.readJSON(staticOptions.createOptionsPath);

    return this.createResourceAdapter({
      staticOptions,
      createOptions,
    });
  }

  public static create(
    adapterOptions: SimulationResourceAdapterInitOptions,
    resourceOptions: SimulationResourceOptions,
  ): TaskList {
    const { pluginManager } = adapterOptions;
    const staticOptions = this.getStaticOptions(adapterOptions);
    const { simulationPackage } = resourceOptions;
    if (simulationPackage === undefined) {
      throw new SimulationPackageRequiredError();
    }
    const simulationConfig = this.loadSimulationConfig(staticOptions, simulationPackage);

    const options = getOptions({
      name: staticOptions.name,
      simulationConfig,
      options: resourceOptions,
    });

    const createOptions = this.getCreateOptions({
      staticOptions,
      options,
    });

    const dependencies: string[] = [];
    const resourceAdapter = this.createResourceAdapter({
      staticOptions,
      createOptions,
    });

    const masterWalletResourceAdapter = pluginManager.getResourcesManager({
      plugin: walletConstants.PLUGIN,
      resourceType: walletConstants.WALLET_RESOURCE_TYPE,
    }).masterResourceAdapter as MasterWalletResourceAdapter;
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
          enabled: (ctx: CreateContext) => setupWalletsEnabled(ctx) || deployContractsEnabled(ctx),
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

  private static loadSimulationConfig(
    options: SimulationResourceAdapterStaticOptions,
    simulationPackage: string,
  ): SimulationConfig {
    const config = this.tryRequireConfig(options, simulationPackage);
    if (config === undefined) {
      throw new CouldNotLoadSimulationError(simulationPackage);
    }

    return config;
  }

  private static tryRequireConfig(
    options: SimulationResourceAdapterStaticOptions,
    simulationPackage: string,
  ): SimulationConfig | undefined {
    try {
      const config = require(simulationPackage);

      return config != undefined && config.default != undefined ? config.default : config;
    } catch (error) {
      options.resourceType.plugin.monitor.logError({
        name: 'neo_simulation_resource_adapter_require_error',
        message: `Failed to require ${simulationPackage}`,
        error,
      });

      return undefined;
    }
  }

  private static getStaticOptions(
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

  private static getCreateOptions({
    options,
  }: {
    readonly staticOptions: SimulationResourceAdapterStaticOptions;
    readonly options: Options;
  }): SimulationResourceAdapterCreateOptions {
    return {
      simulationPath: options.simulationPath,
      simulationPackage: options.simulationPackage,
      simulationConfig: options.simulationConfig,
    };
  }

  private static createResourceAdapter({
    staticOptions,
    createOptions,
  }: {
    readonly staticOptions: SimulationResourceAdapterStaticOptions;
    readonly createOptions: SimulationResourceAdapterCreateOptions;
  }): SimulationResourceAdapter {
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

  public readonly resource$: Observable<Simulation>;
  private readonly name: string;
  private readonly dataPath: string;
  private readonly resourceType: SimulationResourceType;
  private readonly simulationPath: string;
  private readonly simulationPackage: string;
  private readonly simulationConfig: SimulationConfig;
  private readonly state: ResourceState;
  private mutableSubprocesses: ReadonlyArray<ChildProcess>;
  private readonly update$: Subject<void>;

  public constructor({
    name,
    dataPath,
    resourceType,
    simulationPath,
    simulationPackage,
    simulationConfig,
  }: SimulationResourceAdapterOptions) {
    this.name = name;
    this.dataPath = dataPath;
    this.resourceType = resourceType;
    this.simulationPath = simulationPath;
    this.simulationPackage = simulationPackage;
    this.simulationConfig = simulationConfig;
    this.state = 'stopped';
    this.mutableSubprocesses = [];

    this.update$ = new ReplaySubject(1);
    this.resource$ = this.update$.pipe(map(() => this.toResource()), shareReplay(1));

    this.update$.next();
  }

  public async destroy(): Promise<void> {
    // do nothing
  }

  public delete(_options: SimulationResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean up local files',
          task: async () => {
            await fs.remove(this.dataPath);
          },
        },
      ],
    });
  }

  public start(_options: SimulationResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Start simulation hooks',
          enabled: () =>
            this.simulationConfig.hooks !== undefined &&
            this.simulationConfig.hooks.postStart !== undefined &&
            this.simulationConfig.hooks.postStart.length > 0,
          task: async () => {
            const { hooks } = this.simulationConfig;
            if (hooks === undefined) {
              throw new Error('For Flow');
            }

            const { postStart } = hooks;
            if (postStart === undefined) {
              throw new Error('For Flow');
            }

            this.mutableSubprocesses = postStart.map((cmd) =>
              execa.shell(cmd, {
                cwd: this.simulationPath,
                stdio: 'ignore',
                shell: true,
              }),
            );
          },
        },
      ],
    });
  }

  public stop(_options: SimulationResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Stop simulation hooks',
          enabled: () =>
            this.simulationConfig.hooks !== undefined &&
            this.simulationConfig.hooks.postStart !== undefined &&
            this.simulationConfig.hooks.postStart.length > 0,
          task: () => {
            const { hooks } = this.simulationConfig;
            if (hooks === undefined) {
              throw new Error('For Flow');
            }

            const { postStart } = hooks;
            if (postStart === undefined) {
              throw new Error('For Flow');
            }

            this.mutableSubprocesses.forEach((proc) => {
              proc.kill('SIGTERM');
            });
            this.mutableSubprocesses = [];
          },
        },
      ],
    });
  }

  public getDebug(): DescribeTable {
    return [];
  }

  private toResource(): Simulation {
    return {
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name: this.name,
      baseName: this.name,
      state: this.state,
      simulationPackage: this.simulationPackage,
    };
  }
}
