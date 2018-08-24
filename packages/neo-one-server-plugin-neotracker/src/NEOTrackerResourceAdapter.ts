import { DescribeTable, PluginManager, PortAllocator, TaskList } from '@neo-one/server-plugin';
import { getNetworkResourceManager } from '@neo-one/server-plugin-network';
import { Observable } from 'rxjs';
import { NEOTrackerResource } from './NEOTrackerResource';
import { NEOTracker, NEOTrackerResourceOptions, NEOTrackerResourceType } from './NEOTrackerResourceType';

export interface NEOTrackerResourceAdapterInitOptions {
  readonly resourceType: NEOTrackerResourceType;
  readonly name: string;
  readonly dataPath: string;
}

export interface NEOTrackerResourceAdapterCreateOptions extends NEOTrackerResourceAdapterInitOptions {
  readonly pluginManager: PluginManager;
  readonly portAllocator: PortAllocator;
}

export interface NEOTrackerResourceAdapterOptions {
  readonly neotrackerResource: NEOTrackerResource;
}

export class NEOTrackerResourceAdapter {
  public static create(
    { pluginManager, resourceType, portAllocator, name, dataPath }: NEOTrackerResourceAdapterCreateOptions,
    { network: networkName }: NEOTrackerResourceOptions,
  ): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Create neotracker resource',
          task: async (ctx) => {
            if (networkName === undefined) {
              throw new Error('"network" must be defined');
            }

            const network = await getNetworkResourceManager(pluginManager).getResource({
              name: networkName,
              options: {},
            });

            const neotrackerResource = await NEOTrackerResource.createNew({
              resourceType,
              name,
              dataPath,
              network: network.type === 'main' ? 'main' : network.type === 'test' ? 'test' : 'priv',
              rpcURL: network.nodes[0].rpcAddress,
              metricsPort: portAllocator.allocatePort({
                plugin: resourceType.plugin.name,
                resourceType: resourceType.name,
                resource: name,
                name: 'metricsPort',
              }),
              port: portAllocator.allocatePort({
                plugin: resourceType.plugin.name,
                resourceType: resourceType.name,
                resource: name,
                name: 'port',
              }),
            });

            ctx.resourceAdapter = new this({ neotrackerResource });
            ctx.dependencies = [network];
            await neotrackerResource.create();
          },
        },
      ],
    });
  }

  public static async init({
    resourceType,
    name,
    dataPath,
  }: NEOTrackerResourceAdapterInitOptions): Promise<NEOTrackerResourceAdapter> {
    const neotrackerResource = await NEOTrackerResource.createExisting({
      resourceType,
      name,
      dataPath,
    });

    return new this({ neotrackerResource });
  }

  public readonly neotrackerResource: NEOTrackerResource;
  public readonly resource$: Observable<NEOTracker>;

  public constructor({ neotrackerResource }: NEOTrackerResourceAdapterOptions) {
    this.neotrackerResource = neotrackerResource;

    this.resource$ = neotrackerResource.resource$;
  }

  public async destroy(): Promise<void> {
    await this.neotrackerResource.stop();
  }

  public delete(_options: NEOTrackerResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean up local files',
          task: async () => {
            await this.neotrackerResource.delete();
          },
        },
      ],
    });
  }

  public start(_options: NEOTrackerResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Starting NEO Tracker',
          task: async () => {
            await this.neotrackerResource.start();
          },
        },
      ],
    });
  }

  public stop(_options: NEOTrackerResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Stopping NEO Tracker',
          task: async () => {
            await this.neotrackerResource.stop();
          },
        },
      ],
    });
  }

  public getDebug(): DescribeTable {
    return this.neotrackerResource.getDebug();
  }
}
