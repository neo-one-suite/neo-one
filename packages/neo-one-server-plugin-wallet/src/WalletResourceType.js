/* @flow */
import { AsyncNodeStorage } from 'redux-persist-node-storage';
import {
  type DescribeTable,
  type ListTable,
  type ResourceState,
  type MasterResourceAdapter,
  type MasterResourceAdapterOptions,
  CRUD,
  ResourceType,
} from '@neo-one/server-plugin';
import {
  type UserAccountID,
  Client,
  LocalKeyStore,
  LocalStringStore,
  LocalUserAccountProvider,
  provider,
} from '@neo-one/client';

import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';

import {
  StartWalletCRUD,
  StopWalletCRUD,
  DeleteWalletCRUD,
  CreateWalletCRUD,
  GetWalletCRUD,
  DescribeWalletCRUD,
} from './crud';
import MasterWalletResourceAdapter from './MasterWalletResourceAdapter';
import type WalletPlugin from './WalletPlugin';

export type Coin = {|
  assetName: string,
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
  accountID: UserAccountID,
  address: string,
  unlocked: boolean,
  neoBalance: string,
  gasBalance: string,
  wif: ?string,
  nep2: ?string,
  publicKey: string,
  scriptHash: string,
  balance: Array<Coin>,
|};
export type WalletResourceOptions = {|
  network?: string,
  password?: string,
  privateKey?: string,
|};

const WALLETS_PATH = 'wallets';

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

  async createMasterResourceAdapter({
    pluginManager,
    dataPath,
  }: MasterResourceAdapterOptions): Promise<
    MasterResourceAdapter<Wallet, WalletResourceOptions>,
  > {
    const walletsPath = path.resolve(dataPath, WALLETS_PATH);
    fs.mkdirpSync(walletsPath);
    const client = new Client({
      file: new LocalUserAccountProvider({
        keystore: new LocalKeyStore({
          store: new LocalStringStore({
            type: 'file',
            storage: new AsyncNodeStorage(walletsPath),
          }),
        }),
        provider: provider(),
      }),
    });
    return new MasterWalletResourceAdapter({
      client,
      pluginManager,
      resourceType: this,
    });
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
      ['Private Key', resource.wif == null ? 'Locked' : resource.wif],
      resource.nep2 == null ? null : ['NEP2', resource.nep2],
      ['Public Key', resource.publicKey],
      ['Address', resource.address],
      ['Script Hash', resource.scriptHash],
      [
        'Balance',
        {
          type: 'list',
          table: [['Asset', 'Amount', 'Hash']].concat(
            _.sortBy(resource.balance, coin => coin.asset).map(coin => [
              coin.assetName,
              coin.amount,
              coin.asset,
            ]),
          ),
        },
      ],
    ].filter(Boolean);
  }
}
