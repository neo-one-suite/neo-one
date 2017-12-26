/* @flow */
import {
  type DescribeTable,
  type PluginManager,
  type Progress,
  type ResourceAdapterReady,
} from '@neo-one/server-plugin';
import { Observable } from 'rxjs/Observable';

import { concat } from 'rxjs/observable/concat';
import { concatAll } from 'rxjs/operators';
import { defer } from 'rxjs/observable/defer';
import { of as _of } from 'rxjs/observable/of';

import type SmartContractResourceType, {
  SmartContract,
  SmartContractResourceOptions,
} from './SmartContractResourceType';
import SmartContractResource from './SmartContractResource';

export type SmartContractResourceAdapterInitOptions = {|
  pluginManager: PluginManager,
  resourceType: SmartContractResourceType,
  name: string,
  dataPath: string,
|};

export type SmartContractResourceAdapterStaticOptions = {|
  ...SmartContractResourceAdapterInitOptions,
|};

export type SmartContractResourceAdapterOptions = {|
  resourceType: SmartContractResourceType,
  smartContractResource: SmartContractResource,
|};

export default class SmartContractResourceAdapter {
  _resourceType: SmartContractResourceType;
  _smartContractResource: SmartContractResource;

  resource$: Observable<SmartContract>;

  constructor({
    resourceType,
    smartContractResource,
  }: SmartContractResourceAdapterOptions) {
    this._resourceType = resourceType;
    this._smartContractResource = smartContractResource;

    this.resource$ = smartContractResource.resource$;
  }

  static async init({
    pluginManager,
    resourceType,
    name,
    dataPath,
  }: SmartContractResourceAdapterInitOptions): Promise<
    SmartContractResourceAdapter,
  > {
    const smartContractResource = await SmartContractResource.createExisting({
      pluginManager,
      resourceType,
      name,
      dataPath,
    });

    return new this({
      resourceType,
      smartContractResource,
    });
  }

  async destroy(): Promise<void> {
    // eslint-disable-next-line
  }

  static create$(
    {
      pluginManager,
      resourceType,
      name,
      dataPath,
    }: SmartContractResourceAdapterInitOptions,
    { wallet, abi, contract, hash }: SmartContractResourceOptions,
  ): Observable<
    | Progress
    | ResourceAdapterReady<SmartContract, SmartContractResourceOptions>,
  > {
    return concat(
      _of({
        type: 'progress',
        message: 'Deploying smart contract',
      }),
      defer(async () => {
        const smartContractResource = await SmartContractResource.createNew({
          pluginManager,
          resourceType,
          name,
          wallet,
          abi,
          contract,
          hash,
          dataPath,
        });
        return concat(
          _of({
            type: 'progress',
            persist: true,
            message: 'Deployed smart contract',
          }),
          _of({
            type: 'ready',
            resourceAdapter: new this({
              resourceType,
              smartContractResource,
            }),
          }),
        );
      }).pipe(concatAll()),
    );
  }

  // eslint-disable-next-line
  delete$(options: SmartContractResourceOptions): Observable<Progress> {
    return concat(
      _of({
        type: 'progress',
        message: 'Cleaning up local files',
      }),
      defer(async () => {
        try {
          await this._smartContractResource.delete();
          return {
            type: 'progress',
            persist: true,
            message: 'Cleaned up local files',
          };
        } catch (error) {
          this._resourceType.plugin.log({
            event: 'SMART_CONTRACT_RESOURCE_ADAPTER_DELETE_ERROR',
            error,
          });
          throw error;
        }
      }),
    );
  }

  // eslint-disable-next-line
  start$(options: SmartContractResourceOptions): Observable<Progress> {
    throw new Error('Cannot be started');
  }

  // eslint-disable-next-line
  stop$(options: SmartContractResourceOptions): Observable<Progress> {
    throw new Error('Cannot be stopped');
  }

  getDebug(): DescribeTable {
    return this._smartContractResource.getDebug();
  }
}
