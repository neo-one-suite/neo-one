import { Plugin, PluginManager, ResourceType, TaskList } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { utils } from '@neo-one/utils';
import { constants } from './constants';
import { NEOTrackerResourceType } from './NEOTrackerResourceType';
import { ExecuteTaskListOptions } from './types';
import { getNEOTrackerResourceManager } from './utils';

export class NEOTrackerPlugin extends Plugin {
  public readonly neotrackerResourceType = new NEOTrackerResourceType({ plugin: this });

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
      capital: 'NEOTracker',
      capitalPlural: 'NEOTrackers',
      lower: 'neotracker',
      lowerPlural: 'neotrackers',
    };
  }

  public get dependencies(): ReadonlyArray<string> {
    return [networkConstants.PLUGIN];
  }

  public get resourceTypes(): ReadonlyArray<ResourceType> {
    return [this.neotrackerResourceType];
  }

  public executeTaskList(pluginManager: PluginManager, optionsIn: string): TaskList {
    const options = this.parseExecuteTaskListOptions(optionsIn);
    switch (options.command) {
      case 'reset':
        return new TaskList({
          tasks: [
            {
              title: 'Resetting NEO Tracker',
              task: async () => {
                const neotracker = await getNEOTrackerResourceManager(pluginManager).getResource({
                  name: options.name,
                  options: {},
                });

                await neotracker.reset();
              },
            },
          ],
        });
      default:
        utils.assertNever(options.command);
        throw new Error('Unknown command');
    }
  }

  private parseExecuteTaskListOptions(options: string): ExecuteTaskListOptions {
    return JSON.parse(options);
  }
}
