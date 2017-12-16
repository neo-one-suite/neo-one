/* @flow */
import {
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type ResourceAdapterReady,
  CRUD,
  ResourceType,
} from '@neo-one/server';
import type { Observable } from 'rxjs/Observable';
import {
  type DescribeTable,
  type ListTable,
  type Progress,
  type ResourceState,
} from '@neo-one/server-common';

import _ from 'lodash';

import {
  StartWalletCRUD,
  StopWalletCRUD,
  DeleteWalletCRUD,
  CreateWalletCRUD,
  GetWalletCRUD,
  DescribeWalletCRUD,
} from './crud';
import type WalletPlugin from './WalletPlugin';
import WalletResourceAdapter, {
  type WalletResourceAdapterInitOptions,
} from './WalletResourceAdapter';

export type Coin = {|
  asset: string,
  amount: string,
|};
export type Wallet = {|
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
  network: string,
  address: string,
  unlocked: boolean,
  neoBalance: string,
  gasBalance: string,
  privateKey: ?string,
  nep2: ?string,
  publicKey: string,
  scriptHash: string,
  balance: Array<Coin>,
|};
export type WalletResourceOptions = {|
  network: string,
  password?: string,
  privateKey?: string,
|};

export default class WalletResourceType extends ResourceType<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ plugin }: {| plugin: WalletPlugin |}) {
    super({
      plugin,
      name: 'wallet',
      names: {
        capital: 'Wallet',
        capitalPlural: 'Wallets',
        lower: 'wallet',
        lowerPlural: 'wallets',
      },
    });
  }

  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Wallet, WalletResourceOptions>> {
    return WalletResourceAdapter.init(this._getResourceAdapterOptions(options));
  }

  createResourceAdapter$(
    adapterOptions: ResourceAdapterOptions,
    options: WalletResourceOptions,
  ): Observable<
    Progress | ResourceAdapterReady<Wallet, WalletResourceOptions>,
  > {
    return WalletResourceAdapter.create$(
      this._getResourceAdapterOptions(adapterOptions),
      options,
    );
  }

  _getResourceAdapterOptions({
    pluginManager,
    name,
    dataPath,
  }: ResourceAdapterOptions): WalletResourceAdapterInitOptions {
    return {
      pluginManager,
      name,
      dataPath,
      resourceType: this,
    };
  }

  getCRUD(): CRUD<Wallet, WalletResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: new StartWalletCRUD({ resourceType: this }),
      stop: new StopWalletCRUD({ resourceType: this }),
      delete: new DeleteWalletCRUD({ resourceType: this }),
      create: new CreateWalletCRUD({ resourceType: this }),
      get: new GetWalletCRUD({ resourceType: this }),
      describe: new DescribeWalletCRUD({ resourceType: this }),
    });
  }

  getListTable(resources: Array<Wallet>): ListTable {
    return [['Wallet', 'Name', 'Address', 'Unlocked', 'NEO', 'GAS']].concat(
      _.sortBy(resources, resource => resource.name).map(resource => [
        resource.network,
        resource.baseName,
        resource.address,
        resource.unlocked ? 'Yes' : 'No',
        resource.neoBalance,
        resource.gasBalance,
      ]),
    );
  }

  getDescribeTable(resource: Wallet): DescribeTable {
    return [
      ['Network', resource.network],
      ['Name', resource.baseName],
      ['Unlocked', resource.unlocked ? 'Yes' : 'No'],
      [
        'Private Key',
        resource.privateKey == null ? 'Locked' : resource.privateKey,
      ],
      resource.nep2 == null ? null : ['NEP2', resource.nep2],
      ['Public Key', resource.publicKey],
      ['Address', resource.address],
      ['Script Hash', resource.scriptHash],
      [
        'Balance',
        {
          type: 'list',
          table: [['Asset', 'Amount']].concat(
            _.sortBy(resource.balance, coin => coin.asset).map(coin => [
              coin.asset,
              coin.amount,
            ]),
          ),
        },
      ],
    ].filter(Boolean);
  }
}
