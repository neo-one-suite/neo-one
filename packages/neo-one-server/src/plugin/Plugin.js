/* @flow */
import {
  type CLIArgs,
  type CLIHook,
  type InteractiveCommand,
} from '@neo-one/server-common';
import type { Log } from '@neo-one/utils';

import type ResourceType from './ResourceType';

export type PluginOptions = {|
  log: Log,
|};

export type CLIHookConfig = {|
  name: string,
  hook: CLIHook,
|};

export default class Plugin {
  log: Log;

  constructor({ log }: PluginOptions) {
    this.log = log;
  }

  // Plugin name, should match the module name, e.g.
  // `@neo-one/server-plugin-network`
  get name(): string {
    throw new Error('Not Implemented');
  }

  // Names used for display.
  get names(): {|
    // Capital form of the name, e.g. `Network`
    capital: string,
    // Capital plural form of the name, e.g. `Networks`
    capitalPlural: string,
    // Lowercase form of the name, e.g. `network`
    lower: string,
    // Lowercase plural form of the name, e.g. `networks`
    lowerPlural: string,
  |} {
    throw new Error('Not Implemented');
  }

  get resourceTypes(): Array<ResourceType<*, *>> {
    return [];
  }

  get resourceTypeByName(): { [resourceType: string]: ResourceType<*, *> } {
    return this.resourceTypes.reduce((acc, resourceType) => {
      acc[resourceType.name] = resourceType;
      return acc;
    }, {});
  }

  // Names of plugins this module depends on, e.g.
  // ['@neo-one/server-plugin-network']
  get dependencies(): Array<string> {
    return [];
  }

  // Add additional commands.
  get commands(): Array<(cliArgs: CLIArgs) => void> {
    return [];
  }

  // Add additional interactive commands
  get interactive(): Array<InteractiveCommand> {
    return [];
  }

  // Hook into other plugin's command lifecycle
  get cliPreHooks(): Array<CLIHookConfig> {
    return [];
  }

  // Hook into other plugin's command lifecycle
  get cliPostHooks(): Array<CLIHookConfig> {
    return [];
  }
}
