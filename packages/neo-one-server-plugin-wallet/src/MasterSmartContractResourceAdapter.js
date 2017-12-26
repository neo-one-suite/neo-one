/* @flow */
import {
  type PluginManager,
  type Progress,
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type ResourceAdapterReady,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';

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

  createResourceAdapter$(
    adapterOptions: ResourceAdapterOptions,
    options: SmartContractResourceOptions,
  ): Observable<
    | Progress
    | ResourceAdapterReady<SmartContract, SmartContractResourceOptions>,
  > {
    return SmartContractResourceAdapter.create$(
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
