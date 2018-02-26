/* @flow */
import {
  type DescribeTable,
  type PluginManager,
  TaskList,
  compoundName,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';

import { constants as networkConstants } from '@neo-one/server-plugin-network';

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

  // eslint-disable-next-line
  async destroy(): Promise<void> {}

  static create(
    {
      pluginManager,
      resourceType,
      name,
      dataPath,
    }: SmartContractResourceAdapterInitOptions,
    { wallet, abi, contract, hash }: SmartContractResourceOptions,
  ): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Deploy smart contract',
          task: async ctx => {
            const smartContractResource = await SmartContractResource.createNew(
              {
                pluginManager,
                resourceType,
                name,
                wallet,
                abi,
                contract,
                hash,
                dataPath,
              },
            );

            const { names: [networkName] } = compoundName.extract(name);
            ctx.resourceAdapter = new this({
              resourceType,
              smartContractResource,
            });
            ctx.dependencies = [
              {
                plugin: networkConstants.PLUGIN,
                resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
                name: networkName,
              },
            ];

            await smartContractResource.create();
          },
        },
      ],
    });
  }

  // eslint-disable-next-line
  delete(options: SmartContractResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean local files',
          task: async () => {
            await this._smartContractResource.delete();
          },
        },
      ],
    });
  }

  // eslint-disable-next-line
  start(options: SmartContractResourceOptions): TaskList {
    throw new Error('Cannot be started');
  }

  // eslint-disable-next-line
  stop(options: SmartContractResourceOptions): TaskList {
    throw new Error('Cannot be stopped');
  }

  getDebug(): DescribeTable {
    return this._smartContractResource.getDebug();
  }
}
