import { compoundName, DescribeTable, PluginManager, TaskList } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { Observable } from 'rxjs';
import { SmartContractResource } from './SmartContractResource';
import { SmartContract, SmartContractResourceOptions, SmartContractResourceType } from './SmartContractResourceType';

export interface SmartContractResourceAdapterInitOptions {
  readonly pluginManager: PluginManager;
  readonly resourceType: SmartContractResourceType;
  readonly name: string;
  readonly dataPath: string;
}

export interface SmartContractResourceAdapterStaticOptions extends SmartContractResourceAdapterInitOptions {}

export interface SmartContractResourceAdapterOptions {
  readonly resourceType: SmartContractResourceType;
  readonly smartContractResource: SmartContractResource;
}

export class SmartContractResourceAdapter {
  public static async init({
    pluginManager,
    resourceType,
    name,
    dataPath,
  }: SmartContractResourceAdapterInitOptions): Promise<SmartContractResourceAdapter> {
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

  public static create(
    { pluginManager, resourceType, name, dataPath }: SmartContractResourceAdapterInitOptions,
    { wallet, abi, contract, hash }: SmartContractResourceOptions,
  ): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Deploy smart contract',
          // tslint:disable-next-line no-any
          task: async (ctx: any) => {
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

            const {
              names: [networkName],
            } = compoundName.extract(name);
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

  public readonly resource$: Observable<SmartContract>;
  private readonly resourceType: SmartContractResourceType;
  private readonly smartContractResource: SmartContractResource;

  public constructor({ resourceType, smartContractResource }: SmartContractResourceAdapterOptions) {
    this.resourceType = resourceType;
    this.smartContractResource = smartContractResource;

    this.resource$ = smartContractResource.resource$;
  }

  public async destroy(): Promise<void> {
    // do nothing
  }

  public delete(_options: SmartContractResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean local files',
          task: async () => {
            await this.smartContractResource.delete();
          },
        },
      ],
    });
  }

  public start(_options: SmartContractResourceOptions): TaskList {
    throw new Error('Cannot be started');
  }

  public stop(_options: SmartContractResourceOptions): TaskList {
    throw new Error('Cannot be stopped');
  }

  public getDebug(): DescribeTable {
    return this.smartContractResource.getDebug();
  }
}
