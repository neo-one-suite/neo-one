import { Binary, ResourceAdapter, ResourceAdapterOptions, TaskList } from '@neo-one/server-plugin';
import { ContractResourceAdapter, ContractResourceAdapterInitOptions } from './ContractResourceAdapter';
import { Contract, ContractResourceOptions, ContractResourceType } from './ContractResourceType';

export class MasterContractResourceAdapter {
  private readonly resourceType: ContractResourceType;
  private readonly binary: Binary;

  public constructor({
    resourceType,
    binary,
  }: {
    readonly resourceType: ContractResourceType;
    readonly binary: Binary;
  }) {
    this.resourceType = resourceType;
    this.binary = binary;
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
