/* @flow */
import {
  type Binary,
  type PortAllocator,
  type Progress,
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type ResourceAdapterReady,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';

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

  createResourceAdapter$(
    adapterOptions: ResourceAdapterOptions,
    options: NetworkResourceOptions,
  ): Observable<
    Progress | ResourceAdapterReady<Network, NetworkResourceOptions>,
  > {
    return NetworkResourceAdapter.create$(
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
