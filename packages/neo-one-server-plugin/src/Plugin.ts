import { Monitor } from '@neo-one/monitor';
import { ResourceType } from './ResourceType';
import { TaskList } from './TaskList';
import { CLIArgs, CLIHook, CreateHook, InteractiveCommand, PluginManager } from './types';

export interface PluginOptions {
  readonly monitor: Monitor;
}

export interface CLIHookConfig {
  readonly name: string;
  readonly hook: CLIHook;
}

export interface CreateHookConfig {
  readonly plugin: string;
  readonly resourceType: string;
  readonly hook: CreateHook;
}

export class Plugin {
  public readonly monitor: Monitor;

  public constructor({ monitor }: PluginOptions) {
    this.monitor = monitor;
  }

  // Called when the user requests a full reset of neo-one
  public async reset(): Promise<void> {
    // do nothing
  }

  // Plugin name, should match the module name, e.g.
  // `@neo-one/server-plugin-network`
  public get name(): string {
    throw new Error('Not Implemented');
  }

  // Names used for display.
  public get names(): {
    readonly capital: string;
    readonly capitalPlural: string;
    readonly lower: string;
    readonly lowerPlural: string;
  } {
    throw new Error('Not Implemented');
  }

  public get resourceTypes(): ReadonlyArray<ResourceType> {
    return [];
  }

  public get resourceTypeByName(): { readonly [resourceType: string]: ResourceType } {
    return this.resourceTypes.reduce<{ readonly [resourceType: string]: ResourceType }>(
      (acc, resourceType) => ({
        ...acc,
        [resourceType.name]: resourceType,
      }),
      {},
    );
  }

  // Names of plugins this module depends on, e.g.
  // ['@neo-one/server-plugin-network']
  public get dependencies(): ReadonlyArray<string> {
    return [];
  }

  // Add additional commands.
  public get commands(): ReadonlyArray<(cliArgs: CLIArgs) => void> {
    return [];
  }

  // Add additional interactive commands
  public get interactive(): ReadonlyArray<InteractiveCommand> {
    return [];
  }

  // Hook into other plugin's create resource lifecycle
  public get createHooks(): ReadonlyArray<CreateHookConfig> {
    return [];
  }

  // Hook into other plugin's command lifecycle
  public get cliPreHooks(): ReadonlyArray<CLIHookConfig> {
    return [];
  }

  // Hook into other plugin's command lifecycle
  public get cliPostHooks(): ReadonlyArray<CLIHookConfig> {
    return [];
  }

  public executeTaskList(_pluginManager: PluginManager, _options: string): TaskList {
    throw new Error('Plugin does not define a way to execute task lists.');
  }
}
