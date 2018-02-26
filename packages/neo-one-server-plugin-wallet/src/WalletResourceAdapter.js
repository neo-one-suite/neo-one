/* @flow */
import {
  type DescribeTable,
  type PluginManager,
  TaskList,
  compoundName,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';

import { constants as networkConstants } from '@neo-one/server-plugin-network';

import type { WalletClient } from './types';
import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from './WalletResourceType';
import WalletResource from './WalletResource';

export type WalletResourceAdapterInitOptions = {|
  client: WalletClient,
  pluginManager: PluginManager,
  resourceType: WalletResourceType,
  name: string,
  dataPath: string,
|};

export type WalletResourceAdapterStaticOptions = {|
  ...WalletResourceAdapterInitOptions,
|};

export type WalletResourceAdapterOptions = {|
  resourceType: WalletResourceType,
  walletResource: WalletResource,
|};

export default class WalletResourceAdapter {
  _resourceType: WalletResourceType;
  walletResource: WalletResource;

  resource$: Observable<Wallet>;

  constructor({ resourceType, walletResource }: WalletResourceAdapterOptions) {
    this._resourceType = resourceType;
    this.walletResource = walletResource;

    this.resource$ = walletResource.resource$;
  }

  static async init({
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

  // eslint-disable-next-line
  async destroy(): Promise<void> {}

  static create(
    {
      client,
      pluginManager,
      resourceType,
      name,
      dataPath,
    }: WalletResourceAdapterInitOptions,
    { privateKey, password }: WalletResourceOptions,
  ): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Create wallet resource',
          task: async ctx => {
            const walletResource = await WalletResource.createNew({
              client,
              pluginManager,
              resourceType,
              name,
              privateKey,
              password,
              dataPath,
            });

            const { names: [networkName] } = compoundName.extract(name);
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

  // eslint-disable-next-line
  delete(options: WalletResourceOptions): TaskList {
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

  start({ password }: WalletResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Unlock wallet',
          task: async () => {
            if (this.walletResource.unlocked) {
              return;
            }

            if (password == null) {
              throw new Error('Password is required to unlock a wallet.');
            }

            await this.walletResource.unlock({ password });
          },
        },
      ],
    });
  }

  // eslint-disable-next-line
  stop(options: WalletResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Lock wallet',
          task: () => {
            this.walletResource.lock();
          },
        },
      ],
    });
  }

  getDebug(): DescribeTable {
    return this.walletResource.getDebug();
  }
}
