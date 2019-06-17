import { InteractiveCommand, Plugin, PluginManager, ResourceType, TaskList } from '@neo-one/server-plugin';
import { constants as neotrackerConstants, getNEOTrackerResourceManager } from '@neo-one/server-plugin-neotracker';
import { constants as networkConstants, getNetworkResourceManager } from '@neo-one/server-plugin-network';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import { utils } from '@neo-one/utils';
import { filter, take } from 'rxjs/operators';
import { build } from './build';
import { buildCommand } from './buildCommand';
import { constants } from './constants';
import { initCommand } from './initCommand';
import { ProjectResourceType } from './ProjectResourceType';
import { reset } from './reset';
import { ExecuteTaskListOptions, RequestOptions } from './types';
import { getLocalNEOTrackerName, getLocalNetworkName, getProject } from './utils';

export class ProjectPlugin extends Plugin {
  public readonly projectResourceType = new ProjectResourceType({ plugin: this });

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

  public get dependencies(): readonly string[] {
    return [networkConstants.PLUGIN, walletConstants.PLUGIN, neotrackerConstants.PLUGIN];
  }

  public get resourceTypes(): readonly ResourceType[] {
    return [this.projectResourceType];
  }

  public get interactive(): readonly InteractiveCommand[] {
    return [buildCommand, initCommand];
  }

  public executeTaskList(pluginManager: PluginManager, optionsIn: string): TaskList {
    const options = this.parseExecuteTaskListOptions(optionsIn);
    switch (options.command) {
      case 'build':
        return build(pluginManager, options);
      case 'reset':
        return reset(pluginManager, options);
      default:
        utils.assertNever(options);
        throw new Error('Unknown command');
    }
  }

  // tslint:disable-next-line no-any
  public async request(pluginManager: PluginManager, optionsIn: string): Promise<any> {
    const options = this.parseRequestOptions(optionsIn);
    const { projectID } = options;
    const project = await getProject(pluginManager, options.projectID);
    const networkName = getLocalNetworkName(project.rootDir, projectID);
    switch (options.type) {
      case 'network':
        return getNetworkResourceManager(pluginManager)
          .getResource$({
            name: networkName,
            options: {},
          })
          .pipe(
            filter(utils.notNull),
            take(1),
          )
          .toPromise();
      case 'sourceMaps':
        return project.sourceMaps;
      case 'neotracker':
        const neotracker = await getNEOTrackerResourceManager(pluginManager).getResource({
          name: getLocalNEOTrackerName(networkName),
          options: {},
        });

        return neotracker.url;
      default:
        utils.assertNever(options);
        throw new Error('Unknown command');
    }
  }

  private parseExecuteTaskListOptions(options: string): ExecuteTaskListOptions {
    return JSON.parse(options);
  }

  private parseRequestOptions(options: string): RequestOptions {
    return JSON.parse(options);
  }
}
