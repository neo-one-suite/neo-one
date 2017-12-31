/* @flow */
import type { ABI } from '@neo-one/client';
import {
  type DescribeTable,
  type ListTable,
  type ResourceState,
  type MasterResourceAdapter,
  type MasterResourceAdapterOptions,
  CRUD,
  ResourceType,
} from '@neo-one/server-plugin';

import _ from 'lodash';

import {
  DeleteSmartContractCRUD,
  CreateSmartContractCRUD,
  GetSmartContractCRUD,
  DescribeSmartContractCRUD,
} from './crud';
import MasterSmartContractResourceAdapter from './MasterSmartContractResourceAdapter';
import type WalletPlugin from './WalletPlugin';

import constants from './constants';

export type SmartContract = {|
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
  network: string,
  contractName?: string,
  hash: string,
  abi: ABI,
|};
export type SmartContractRegister = {|
  name: string,
  codeVersion: string,
  author: string,
  email: string,
  description: string,
|};
export type SmartContractResourceOptions = {|
  network?: string,
  wallet?: string,
  abi?: ABI,
  contract?: {|
    name: string,
    register: SmartContractRegister,
  |},
  hash?: string,
|};

export default class SmartContractResourceType extends ResourceType<
  SmartContract,
  SmartContractResourceOptions,
> {
  constructor({ plugin }: {| plugin: WalletPlugin |}) {
    super({
      plugin,
      name: constants.SMART_CONTRACT_RESOURCE_TYPE,
      names: {
        capital: 'Smart Contract',
        capitalPlural: 'Smart Contracts',
        lower: 'smart contract',
        lowerPlural: 'smart contracts',
      },
    });
  }

  async createMasterResourceAdapter({
    pluginManager,
  }: MasterResourceAdapterOptions): Promise<
    MasterResourceAdapter<SmartContract, SmartContractResourceOptions>,
  > {
    return new MasterSmartContractResourceAdapter({
      pluginManager,
      resourceType: this,
    });
  }

  getCRUD(): CRUD<SmartContract, SmartContractResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: null,
      stop: null,
      delete: new DeleteSmartContractCRUD({ resourceType: this }),
      create: new CreateSmartContractCRUD({ resourceType: this }),
      get: new GetSmartContractCRUD({ resourceType: this }),
      describe: new DescribeSmartContractCRUD({ resourceType: this }),
    });
  }

  getListTable(resources: Array<SmartContract>): ListTable {
    return [['Network', 'Name', 'Hash']].concat(
      _.sortBy(resources, resource => resource.name).map(resource => [
        resource.network,
        resource.baseName,
        resource.hash,
      ]),
    );
  }

  getDescribeTable(resource: SmartContract): DescribeTable {
    return [
      ['Network', resource.network],
      ['Name', resource.baseName],
      ['Hash', resource.hash],
      ['ABI', JSON.stringify(resource.abi, null, 2)],
    ];
  }
}
