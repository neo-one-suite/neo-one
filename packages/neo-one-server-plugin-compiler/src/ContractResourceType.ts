import { ABI } from '@neo-one/client';
import { disassembleByteCode } from '@neo-one/client-core';
import {
  CRUD,
  DeleteCRUD,
  DescribeCRUD,
  DescribeTable,
  GetCRUD,
  ListTable,
  MasterResourceAdapter,
  MasterResourceAdapterOptions,
  ResourceState,
  ResourceType,
} from '@neo-one/server-plugin';
import _ from 'lodash';
import { CompilerPlugin } from './CompilerPlugin';
import { constants } from './constants';
import { CreateContractCRUD } from './crud';
import { MasterContractResourceAdapter } from './MasterContractResourceAdapter';

export interface Contract {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
  readonly avmPath: string;
  readonly script: string;
  readonly abi: ABI;
  readonly hasStorage: boolean;
  readonly hasDynamicInvoke: boolean;
  readonly payable: boolean;
}

export interface ContractResourceOptions {
  readonly scPath?: string;
  readonly abi?: ABI;
  readonly hasStorage?: boolean;
  readonly hasDynamicInvoke?: boolean;
  readonly payable?: boolean;
}

export class ContractResourceType extends ResourceType<Contract, ContractResourceOptions> {
  public constructor({ plugin }: { readonly plugin: CompilerPlugin }) {
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

  public async createMasterResourceAdapter({
    binary,
  }: MasterResourceAdapterOptions): Promise<MasterResourceAdapter<Contract, ContractResourceOptions>> {
    return new MasterContractResourceAdapter({
      resourceType: this,
      binary,
    });
  }

  public getCRUD(): CRUD<Contract, ContractResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: undefined,
      stop: undefined,
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

  public getListTable(resources: ReadonlyArray<Contract>): ListTable {
    return [['Name', 'Smart Contract']].concat(
      _.sortBy(resources, (resource) => resource.name).map((resource) => [resource.name, resource.avmPath]),
    );
  }

  public getDescribeTable(resource: Contract): DescribeTable {
    return [
      ['Name', resource.name],
      ['Smart Contract', resource.avmPath],
      ['Storage', resource.hasStorage ? 'Yes' : 'No'],
      ['Dynamic Invoke', resource.hasDynamicInvoke ? 'Yes' : 'No'],
      ['Payable', resource.payable ? 'Yes' : 'No'],
      ['ABI', JSON.stringify(resource.abi, undefined, 2)],
      ['Contract', `\n${disassembleByteCode(Buffer.from(resource.script, 'hex')).join('\n')}`],
    ];
  }
}
