import { ABI } from '@neo-one/client';
import {
  CRUD,
  DescribeTable,
  ListTable,
  MasterResourceAdapter,
  MasterResourceAdapterOptions,
  ResourceState,
  ResourceType,
} from '@neo-one/server-plugin';
import _ from 'lodash';
import { constants } from './constants';
import {
  CreateSmartContractCRUD,
  DeleteSmartContractCRUD,
  DescribeSmartContractCRUD,
  GetSmartContractCRUD,
} from './crud';
import { MasterSmartContractResourceAdapter } from './MasterSmartContractResourceAdapter';
import { WalletPlugin } from './WalletPlugin';

export interface SmartContract {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
  readonly network: string;
  readonly contractName?: string;
  readonly hash: string;
  readonly abi: ABI;
}

export interface SmartContractRegister {
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
}

export interface SmartContractResourceOptions {
  readonly network?: string;
  readonly wallet?: string;
  readonly abi?: ABI;
  readonly contract?: {
    readonly name: string;
    readonly register: SmartContractRegister;
  };

  readonly hash?: string;
}

export class SmartContractResourceType extends ResourceType<SmartContract, SmartContractResourceOptions> {
  public constructor({ plugin }: { readonly plugin: WalletPlugin }) {
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

  public async createMasterResourceAdapter({
    pluginManager,
  }: MasterResourceAdapterOptions): Promise<MasterResourceAdapter<SmartContract, SmartContractResourceOptions>> {
    return new MasterSmartContractResourceAdapter({
      pluginManager,
      resourceType: this,
    });
  }

  public getCRUD(): CRUD<SmartContract, SmartContractResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: undefined,
      stop: undefined,
      delete: new DeleteSmartContractCRUD({ resourceType: this }),
      create: new CreateSmartContractCRUD({ resourceType: this }),
      get: new GetSmartContractCRUD({ resourceType: this }),
      describe: new DescribeSmartContractCRUD({ resourceType: this }),
    });
  }

  public getListTable(resources: ReadonlyArray<SmartContract>): ListTable {
    return [['Network', 'Name', 'Hash']].concat(
      _.sortBy(resources, (resource) => resource.name).map((resource) => [
        resource.network,
        resource.baseName,
        resource.hash,
      ]),
    );
  }

  public getDescribeTable(resource: SmartContract): DescribeTable {
    return [
      ['Network', resource.network],
      ['Name', resource.baseName],
      ['Hash', resource.hash],
      ['ABI', JSON.stringify(resource.abi, undefined, 2)],
    ];
  }
}
