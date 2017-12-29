/* @flow */
import {
  type Binary,
  type PortAllocator,
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type TaskList,
} from '@neo-one/server-plugin';

import NetworkResourceAdapter, {
  type NetworkResourceAdapterInitOptions,
} from './NetworkResourceAdapter';
import type NetworkResourceType, {
  Network,
  NetworkResourceOptions,
} from './NetworkResourceType';

export default class MasterNetworkResourceAdapter {
  _resourceType: NetworkResourceType;
  _binary: Binary;
  _portAllocator: PortAllocator;

  constructor({
    resourceType,
    binary,
    portAllocator,
  }: {|
    resourceType: NetworkResourceType,
    binary: Binary,
    portAllocator: PortAllocator,
  |}) {
    this._resourceType = resourceType;
    this._binary = binary;
    this._portAllocator = portAllocator;
  }

  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Network, NetworkResourceOptions>> {
    return NetworkResourceAdapter.init(
      this._getResourceAdapterOptions(options),
    );
  }

  createResourceAdapter(
    adapterOptions: ResourceAdapterOptions,
    options: NetworkResourceOptions,
  ): TaskList {
    return NetworkResourceAdapter.create(
      this._getResourceAdapterOptions(adapterOptions),
      options,
    );
  }

  _getResourceAdapterOptions(
    options: ResourceAdapterOptions,
  ): NetworkResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      binary: this._binary,
      portAllocator: this._portAllocator,
      resourceType: this._resourceType,
    };
  }
}
