import { PluginManager, ResourceAdapter, ResourceAdapterOptions, TaskList } from '@neo-one/server-plugin';
import { SmartContractResourceAdapter, SmartContractResourceAdapterInitOptions } from './SmartContractResourceAdapter';
import { SmartContract, SmartContractResourceOptions, SmartContractResourceType } from './SmartContractResourceType';

export class MasterSmartContractResourceAdapter {
  private readonly pluginManager: PluginManager;
  private readonly resourceType: SmartContractResourceType;

  public constructor({
    pluginManager,
    resourceType,
  }: {
    readonly pluginManager: PluginManager;
    readonly resourceType: SmartContractResourceType;
  }) {
    this.pluginManager = pluginManager;
    this.resourceType = resourceType;
  }

  public async initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<SmartContract, SmartContractResourceOptions>> {
    return SmartContractResourceAdapter.init(this.getResourceAdapterOptions(options));
  }

  public createResourceAdapter(
    adapterOptions: ResourceAdapterOptions,
    options: SmartContractResourceOptions,
  ): TaskList {
    return SmartContractResourceAdapter.create(this.getResourceAdapterOptions(adapterOptions), options);
  }

  private getResourceAdapterOptions({
    name,
    dataPath,
  }: ResourceAdapterOptions): SmartContractResourceAdapterInitOptions {
    return {
      pluginManager: this.pluginManager,
      name,
      dataPath,
      resourceType: this.resourceType,
    };
  }
}
