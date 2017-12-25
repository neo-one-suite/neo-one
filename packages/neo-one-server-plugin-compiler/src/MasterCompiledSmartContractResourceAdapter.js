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

import CompiledSmartContractResourceAdapter, {
  type CompiledSmartContractResourceAdapterInitOptions,
} from './CompiledSmartContractResourceAdapter';
import type CompiledSmartContractResourceType, {
  CompiledSmartContract,
  CompiledSmartContractResourceOptions,
} from './CompiledSmartContractResourceType';

export default class MasterCompiledSmartContractResourceAdapter {
  _resourceType: CompiledSmartContractResourceType;
  _binary: Binary;
  _portAllocator: PortAllocator;

  constructor({
    resourceType,
    binary,
    portAllocator,
  }: {|
    resourceType: CompiledSmartContractResourceType,
    binary: Binary,
    portAllocator: PortAllocator,
  |}) {
    this._resourceType = resourceType;
    this._binary = binary;
    this._portAllocator = portAllocator;
  }

  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<
    ResourceAdapter<
      CompiledSmartContract,
      CompiledSmartContractResourceOptions,
    >,
  > {
    return CompiledSmartContractResourceAdapter.init(
      this._getResourceAdapterOptions(options),
    );
  }

  createResourceAdapter$(
    adapterOptions: ResourceAdapterOptions,
    options: CompiledSmartContractResourceOptions,
  ): Observable<
    | Progress
    | ResourceAdapterReady<
        CompiledSmartContract,
        CompiledSmartContractResourceOptions,
      >,
  > {
    return CompiledSmartContractResourceAdapter.create$(
      this._getResourceAdapterOptions(adapterOptions),
      options,
    );
  }

  _getResourceAdapterOptions(
    options: ResourceAdapterOptions,
  ): CompiledSmartContractResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      binary: this._binary,
      resourceType: this._resourceType,
    };
  }
}
