import { Binary, PortAllocator, ResourceAdapter, ResourceAdapterOptions, TaskList } from '@neo-one/server-plugin';
import { NetworkResourceAdapter, NetworkResourceAdapterInitOptions } from './NetworkResourceAdapter';
import { Network, NetworkResourceOptions, NetworkResourceType } from './NetworkResourceType';

export class MasterNetworkResourceAdapter {
  private readonly resourceType: NetworkResourceType;
  private readonly binary: Binary;
  private readonly portAllocator: PortAllocator;

  public constructor({
    resourceType,
    binary,
    portAllocator,
  }: {
    readonly resourceType: NetworkResourceType;
    readonly binary: Binary;
    readonly portAllocator: PortAllocator;
  }) {
    this.resourceType = resourceType;
    this.binary = binary;
    this.portAllocator = portAllocator;
  }

  public async initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Network, NetworkResourceOptions>> {
    return NetworkResourceAdapter.init(this.getResourceAdapterOptions(options));
  }

  public createResourceAdapter(adapterOptions: ResourceAdapterOptions, options: NetworkResourceOptions): TaskList {
    return NetworkResourceAdapter.create(this.getResourceAdapterOptions(adapterOptions), options);
  }

  private getResourceAdapterOptions(options: ResourceAdapterOptions): NetworkResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      binary: this.binary,
      portAllocator: this.portAllocator,
      resourceType: this.resourceType,
    };
  }
}
