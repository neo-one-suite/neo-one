import { InteractiveCommand, Plugin, PluginManager, TaskList } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import { utils } from '@neo-one/utils';
import { build } from './build';
import { buildCommand } from './buildCommand';
import { constants } from './constants';
import { ExecuteTaskListOptions } from './types';

export class ProjectPlugin extends Plugin {
  public get name(): string {
    return constants.PLUGIN;
  }

  public get names(): {
    readonly capital: string;
    readonly capitalPlural: string;
    readonly lower: string;
    readonly lowerPlural: string;
  } {
    return {
      capital: 'Projects',
      capitalPlural: 'Projects',
      lower: 'project',
      lowerPlural: 'projects',
    };
  }

  public get dependencies(): ReadonlyArray<string> {
    return [networkConstants.PLUGIN, walletConstants.PLUGIN];
  }

  public get interactive(): ReadonlyArray<InteractiveCommand> {
    return [buildCommand];
  }

  public executeTaskList(pluginManager: PluginManager, optionsIn: string): TaskList {
    const options = this.parseExecuteTaskListOptions(optionsIn);
    switch (options.command) {
      case 'build':
        return build(pluginManager, options);
      default:
        utils.assertNever(options.command);
        throw new Error('Unknown command');
    }
  }

  private parseExecuteTaskListOptions(options: string): ExecuteTaskListOptions {
    return JSON.parse(options);
  }
}
