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

import ContractResourceAdapter, {
  type ContractResourceAdapterInitOptions,
} from './ContractResourceAdapter';
import type ContractResourceType, {
  Contract,
  ContractResourceOptions,
} from './ContractResourceType';

export default class MasterContractResourceAdapter {
  _resourceType: ContractResourceType;
  _binary: Binary;
  _portAllocator: PortAllocator;

  constructor({
    resourceType,
    binary,
    portAllocator,
  }: {|
    resourceType: ContractResourceType,
    binary: Binary,
    portAllocator: PortAllocator,
  |}) {
    this._resourceType = resourceType;
    this._binary = binary;
    this._portAllocator = portAllocator;
  }

  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Contract, ContractResourceOptions>> {
    return ContractResourceAdapter.init(
      this._getResourceAdapterOptions(options),
    );
  }

  createResourceAdapter$(
    adapterOptions: ResourceAdapterOptions,
    options: ContractResourceOptions,
  ): Observable<
    Progress | ResourceAdapterReady<Contract, ContractResourceOptions>,
  > {
    return ContractResourceAdapter.create$(
      this._getResourceAdapterOptions(adapterOptions),
      options,
    );
  }

  _getResourceAdapterOptions(
    options: ResourceAdapterOptions,
  ): ContractResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      binary: this._binary,
      resourceType: this._resourceType,
    };
  }
}
