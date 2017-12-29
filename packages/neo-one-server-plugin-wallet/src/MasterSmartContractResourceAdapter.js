/* @flow */
import {
  type PluginManager,
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type TaskList,
} from '@neo-one/server-plugin';

import SmartContractResourceAdapter, {
  type SmartContractResourceAdapterInitOptions,
} from './SmartContractResourceAdapter';
import type SmartContractResourceType, {
  SmartContract,
  SmartContractResourceOptions,
} from './SmartContractResourceType';

export default class MasterSmartContractResourceAdapter {
  _pluginManager: PluginManager;
  _resourceType: SmartContractResourceType;

  constructor({
    pluginManager,
    resourceType,
  }: {|
    pluginManager: PluginManager,
    resourceType: SmartContractResourceType,
  |}) {
    this._pluginManager = pluginManager;
    this._resourceType = resourceType;
  }

  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<SmartContract, SmartContractResourceOptions>> {
    return SmartContractResourceAdapter.init(
      this._getResourceAdapterOptions(options),
    );
  }

  createResourceAdapter(
    adapterOptions: ResourceAdapterOptions,
    options: SmartContractResourceOptions,
  ): TaskList {
    return SmartContractResourceAdapter.create(
      this._getResourceAdapterOptions(adapterOptions),
      options,
    );
  }

  _getResourceAdapterOptions({
    name,
    dataPath,
  }: ResourceAdapterOptions): SmartContractResourceAdapterInitOptions {
    return {
      pluginManager: this._pluginManager,
      name,
      dataPath,
      resourceType: this._resourceType,
    };
  }
}
