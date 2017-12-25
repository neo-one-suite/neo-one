/* @flow */
import { type ABI } from '@neo-one/client';
import {
  type DescribeTable,
  type ListTable,
  type ResourceState,
  type MasterResourceAdapter,
  type MasterResourceAdapterOptions,
  CRUD,
  DeleteCRUD,
  DescribeCRUD,
  GetCRUD,
  ResourceType,
} from '@neo-one/server-plugin';

import _ from 'lodash';

import { CreateCompiledSmartContractCRUD } from './crud';
import MasterCompiledSmartContractResourceAdapter from './MasterCompiledSmartContractResourceAdapter';
import type CompilerPlugin from './CompilerPlugin';

import constants from './constants';

export type CompiledSmartContract = {|
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
  avmPath: string,
  abi: ABI,
|};
export type CompiledSmartContractResourceOptions = {|
  scPath?: string,
  abi?: ABI,
|};

export default class CompiledSmartContractResourceType extends ResourceType<
  CompiledSmartContract,
  CompiledSmartContractResourceOptions,
> {
  constructor({ plugin }: {| plugin: CompilerPlugin |}) {
    super({
      plugin,
      name: constants.COMPILED_SMART_CONTRACT_RESOURCE_TYPE,
      names: {
        capital: 'Compiled smart contract',
        capitalPlural: 'Compiled smart contracts',
        lower: 'compiled smart contract',
        lowerPlural: 'compiled smart contracts',
      },
    });
  }

  async createMasterResourceAdapter({
    binary,
    portAllocator,
  }: MasterResourceAdapterOptions): Promise<
    MasterResourceAdapter<
      CompiledSmartContract,
      CompiledSmartContractResourceOptions,
    >,
  > {
    return new MasterCompiledSmartContractResourceAdapter({
      resourceType: this,
      binary,
      portAllocator,
    });
  }

  getCRUD(): CRUD<CompiledSmartContract, CompiledSmartContractResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: null,
      stop: null,
      create: new CreateCompiledSmartContractCRUD({ resourceType: this }),
      delete: new DeleteCRUD({
        resourceType: this,
        aliases: ['delete csc'],
      }),
      get: new GetCRUD({
        resourceType: this,
        aliases: ['get csc'],
      }),
      describe: new DescribeCRUD({
        resourceType: this,
        aliases: ['describe csc'],
      }),
    });
  }

  getListTable(resources: Array<CompiledSmartContract>): ListTable {
    return [['Name', 'Smart Contract']].concat(
      _.sortBy(resources, resource => resource.name).map(resource => [
        resource.name,
        resource.avmPath,
      ]),
    );
  }

  getDescribeTable(resource: CompiledSmartContract): DescribeTable {
    return [
      ['Name', resource.name],
      ['Smart Contract', resource.avmPath],
      ['ABI', JSON.stringify(resource.abi, null, 2)],
    ];
  }
}
