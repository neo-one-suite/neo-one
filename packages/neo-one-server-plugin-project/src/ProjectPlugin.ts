import { InteractiveCommand, Plugin, PluginManager, ResourceType, TaskList } from '@neo-one/server-plugin';
import { constants as networkConstants, getNetworkResourceManager } from '@neo-one/server-plugin-network';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import { utils } from '@neo-one/utils';
import { filter, take } from 'rxjs/operators';
import { build } from './build';
import { buildCommand } from './buildCommand';
import { constants } from './constants';
import { ProjectResourceType } from './ProjectResourceType';
import { reset } from './reset';
import { ExecuteTaskListOptions, RequestOptions } from './types';
import { getLocalNetworkName, getProject } from './utils';

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

  public get dependencies(): ReadonlyArray<string> {
    return [networkConstants.PLUGIN, walletConstants.PLUGIN];
  }

  public get resourceTypes(): ReadonlyArray<ResourceType> {
    return [this.projectResourceType];
  }

  public get interactive(): ReadonlyArray<InteractiveCommand> {
    return [buildCommand];
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
    switch (options.type) {
      case 'network':
        const { projectID } = options;
        const project = await getProject(pluginManager, options.projectID);

        return getNetworkResourceManager(pluginManager)
          .getResource$({
            name: getLocalNetworkName(project.rootDir, projectID),
            options: {},
          })
          .pipe(
            filter(utils.notNull),
            take(1),
          )
          .toPromise();
      default:
        utils.assertNever(options.type);
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
