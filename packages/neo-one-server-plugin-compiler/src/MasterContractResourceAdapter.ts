import { Binary, PortAllocator, ResourceAdapter, ResourceAdapterOptions, TaskList } from '@neo-one/server-plugin';
import { ContractResourceAdapter, ContractResourceAdapterInitOptions } from './ContractResourceAdapter';
import { Contract, ContractResourceOptions, ContractResourceType } from './ContractResourceType';

export class MasterContractResourceAdapter {
  private readonly resourceType: ContractResourceType;
  private readonly binary: Binary;
  private readonly portAllocator: PortAllocator;

  public constructor({
    resourceType,
    binary,
    portAllocator,
  }: {
    readonly resourceType: ContractResourceType;
    readonly binary: Binary;
    readonly portAllocator: PortAllocator;
  }) {
    this.resourceType = resourceType;
    this.binary = binary;
    this.portAllocator = portAllocator;
  }

  public async initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Contract, ContractResourceOptions>> {
    return ContractResourceAdapter.init(this.getResourceAdapterOptions(options));
  }

  public createResourceAdapter(adapterOptions: ResourceAdapterOptions, options: ContractResourceOptions): TaskList {
    return ContractResourceAdapter.create(this.getResourceAdapterOptions(adapterOptions), options);
  }

  private getResourceAdapterOptions(options: ResourceAdapterOptions): ContractResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      binary: this.binary,
      resourceType: this.resourceType,
    };
  }
}
