/* @flow */
import { type ABI, disassembleByteCode } from '@neo-one/client';
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

import { CreateContractCRUD } from './crud';
import MasterContractResourceAdapter from './MasterContractResourceAdapter';
import type CompilerPlugin from './CompilerPlugin';

import constants from './constants';

export type Contract = {|
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
  avmPath: string,
  script: string,
  abi: ABI,
  hasStorage: boolean,
  hasDynamicInvoke: boolean,
|};
export type ContractResourceOptions = {|
  scPath?: string,
  abi?: ABI,
  hasStorage?: boolean,
  hasDynamicInvoke?: boolean,
|};

export default class ContractResourceType extends ResourceType<
  Contract,
  ContractResourceOptions,
> {
  constructor({ plugin }: {| plugin: CompilerPlugin |}) {
    super({
      plugin,
      name: constants.CONTRACT_RESOURCE_TYPE,
      names: {
        capital: 'Contract',
        capitalPlural: 'Contracts',
        lower: 'contract',
        lowerPlural: 'contracts',
      },
    });
  }

  async createMasterResourceAdapter({
    binary,
    portAllocator,
  }: MasterResourceAdapterOptions): Promise<
    MasterResourceAdapter<Contract, ContractResourceOptions>,
  > {
    return new MasterContractResourceAdapter({
      resourceType: this,
      binary,
      portAllocator,
    });
  }

  getCRUD(): CRUD<Contract, ContractResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: null,
      stop: null,
      create: new CreateContractCRUD({ resourceType: this }),
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

  getListTable(resources: Array<Contract>): ListTable {
    return [['Name', 'Smart Contract']].concat(
      _.sortBy(resources, resource => resource.name).map(resource => [
        resource.name,
        resource.avmPath,
      ]),
    );
  }

  getDescribeTable(resource: Contract): DescribeTable {
    return [
      ['Name', resource.name],
      ['Smart Contract', resource.avmPath],
      ['Storage', resource.hasStorage ? 'Yes' : 'No'],
      ['Dynamic Invoke', resource.hasDynamicInvoke ? 'Yes' : 'No'],
      ['ABI', JSON.stringify(resource.abi, null, 2)],
      [
        'Contract',
        `\n${disassembleByteCode(Buffer.from(resource.script, 'hex')).join(
          '\n',
        )}`,
      ],
    ];
  }
}
