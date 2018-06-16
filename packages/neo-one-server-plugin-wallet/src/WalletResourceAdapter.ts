import { compoundName, DescribeTable, PluginManager, TaskList } from '@neo-one/server-plugin';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { Observable } from 'rxjs';
import { WalletClient } from './types';
import { WalletResource } from './WalletResource';
import { Wallet, WalletResourceOptions, WalletResourceType } from './WalletResourceType';

export interface WalletResourceAdapterInitOptions {
  readonly client: WalletClient;
  readonly pluginManager: PluginManager;
  readonly resourceType: WalletResourceType;
  readonly name: string;
  readonly dataPath: string;
}

export interface WalletResourceAdapterStaticOptions extends WalletResourceAdapterInitOptions {}

export interface WalletResourceAdapterOptions {
  readonly resourceType: WalletResourceType;
  readonly walletResource: WalletResource;
}

export class WalletResourceAdapter {
  public static create(
    { client, pluginManager, resourceType, name, dataPath }: WalletResourceAdapterInitOptions,
    { privateKey, password }: WalletResourceOptions,
  ): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Create wallet resource',
          // tslint:disable-next-line no-any
          task: async (ctx: any) => {
            const walletResource = await WalletResource.createNew({
              client,
              pluginManager,
              resourceType,
              name,
              privateKey,
              password,
              dataPath,
            });

            const {
              names: [networkName],
            } = compoundName.extract(name);
            ctx.resourceAdapter = new this({
              resourceType,
              walletResource,
            });

            ctx.dependencies = [
              {
                plugin: networkConstants.PLUGIN,
                resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
                name: networkName,
              },
            ];

            await walletResource.create();
          },
        },
      ],
    });
  }

  public static async init({
    client,
    pluginManager,
    resourceType,
    name,
    dataPath,
  }: WalletResourceAdapterInitOptions): Promise<WalletResourceAdapter> {
    const walletResource = await WalletResource.createExisting({
      client,
      pluginManager,
      resourceType,
      name,
      dataPath,
    });

    return new this({
      resourceType,
      walletResource,
    });
  }

  public readonly walletResource: WalletResource;
  public readonly resource$: Observable<Wallet>;
  private readonly resourceType: WalletResourceType;

  public constructor({ resourceType, walletResource }: WalletResourceAdapterOptions) {
    this.resourceType = resourceType;
    this.walletResource = walletResource;

    this.resource$ = walletResource.resource$;
  }

  public async destroy(): Promise<void> {
    // do nothing
  }

  public delete(_options: WalletResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean up local files',
          task: async () => {
            await this.walletResource.delete();
          },
        },
      ],
    });
  }

  public start({ password }: WalletResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Unlock wallet',
          task: async () => {
            if (this.walletResource.unlocked) {
              return undefined;
            }

            if (password === undefined) {
              throw new Error('Password is required to unlock a wallet.');
            }

            await this.walletResource.unlock({ password });
          },
        },
      ],
    });
  }

  public stop(_options: WalletResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Lock wallet',
          task: async () => {
            await this.walletResource.lock();
          },
        },
      ],
    });
  }

  public getDebug(): DescribeTable {
    return this.walletResource.getDebug();
  }
}
