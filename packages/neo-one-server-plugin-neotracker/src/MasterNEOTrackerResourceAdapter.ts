import {
  PluginManager,
  PortAllocator,
  ResourceAdapter,
  ResourceAdapterOptions,
  TaskList,
} from '@neo-one/server-plugin';
import { NEOTrackerResourceAdapter, NEOTrackerResourceAdapterCreateOptions } from './NEOTrackerResourceAdapter';
import { NEOTracker, NEOTrackerResourceOptions, NEOTrackerResourceType } from './NEOTrackerResourceType';

export class MasterNEOTrackerResourceAdapter {
  private readonly pluginManager: PluginManager;
  private readonly resourceType: NEOTrackerResourceType;
  private readonly portAllocator: PortAllocator;

  public constructor({
    pluginManager,
    resourceType,
    portAllocator,
  }: {
    readonly pluginManager: PluginManager;
    readonly resourceType: NEOTrackerResourceType;
    readonly portAllocator: PortAllocator;
  }) {
    this.pluginManager = pluginManager;
    this.resourceType = resourceType;
    this.portAllocator = portAllocator;
  }

  public async initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<NEOTracker, NEOTrackerResourceOptions>> {
    return NEOTrackerResourceAdapter.init(this.getResourceAdapterOptions(options));
  }

  public createResourceAdapter(adapterOptions: ResourceAdapterOptions, options: NEOTrackerResourceOptions): TaskList {
    return NEOTrackerResourceAdapter.create(this.getResourceAdapterOptions(adapterOptions), options);
  }

  private getResourceAdapterOptions(options: ResourceAdapterOptions): NEOTrackerResourceAdapterCreateOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      pluginManager: this.pluginManager,
      portAllocator: this.portAllocator,
      resourceType: this.resourceType,
    };
  }
}
