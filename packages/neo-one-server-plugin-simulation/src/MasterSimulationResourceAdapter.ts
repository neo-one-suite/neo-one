import { PluginManager, ResourceAdapter, ResourceAdapterOptions, TaskList } from '@neo-one/server-plugin';
import { SimulationResourceAdapter, SimulationResourceAdapterInitOptions } from './SimulationResourceAdapter';
import { Simulation, SimulationResourceOptions, SimulationResourceType } from './SimulationResourceType';

export class MasterSimulationResourceAdapter {
  private readonly resourceType: SimulationResourceType;
  private readonly pluginManager: PluginManager;

  public constructor({
    resourceType,
    pluginManager,
  }: {
    readonly resourceType: SimulationResourceType;
    readonly pluginManager: PluginManager;
  }) {
    this.resourceType = resourceType;
    this.pluginManager = pluginManager;
  }

  public async initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Simulation, SimulationResourceOptions>> {
    return SimulationResourceAdapter.init(this.getResourceAdapterOptions(options));
  }

  public createResourceAdapter(adapterOptions: ResourceAdapterOptions, options: SimulationResourceOptions): TaskList {
    return SimulationResourceAdapter.create(this.getResourceAdapterOptions(adapterOptions), options);
  }

  private getResourceAdapterOptions(options: ResourceAdapterOptions): SimulationResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      resourceType: this.resourceType,
      pluginManager: this.pluginManager,
    };
  }
}
