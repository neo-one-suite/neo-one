import { PluginManager, ResourceAdapter, ResourceAdapterOptions, TaskList } from '@neo-one/server-plugin';
import { WalletClient } from './types';
import { WalletResourceAdapter, WalletResourceAdapterInitOptions } from './WalletResourceAdapter';
import { Wallet, WalletResourceOptions, WalletResourceType } from './WalletResourceType';

export class MasterWalletResourceAdapter {
  public readonly client: WalletClient;
  private readonly pluginManager: PluginManager;
  private readonly resourceType: WalletResourceType;

  public constructor({
    client,
    pluginManager,
    resourceType,
  }: {
    readonly client: WalletClient;
    readonly pluginManager: PluginManager;
    readonly resourceType: WalletResourceType;
  }) {
    this.client = client;
    this.pluginManager = pluginManager;
    this.resourceType = resourceType;
  }

  public async initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Wallet, WalletResourceOptions>> {
    return WalletResourceAdapter.init(this.getResourceAdapterOptions(options));
  }

  public createResourceAdapter(adapterOptions: ResourceAdapterOptions, options: WalletResourceOptions): TaskList {
    return WalletResourceAdapter.create(this.getResourceAdapterOptions(adapterOptions), options);
  }

  private getResourceAdapterOptions({ name, dataPath }: ResourceAdapterOptions): WalletResourceAdapterInitOptions {
    return {
      client: this.client,
      pluginManager: this.pluginManager,
      name,
      dataPath,
      resourceType: this.resourceType,
    };
  }
}
