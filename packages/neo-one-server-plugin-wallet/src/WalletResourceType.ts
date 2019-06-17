import { UserAccountID } from '@neo-one/client-common';
import { LocalKeyStore, LocalStringStore, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider } from '@neo-one/client-full-core';
import {
  CRUD,
  DescribeTable,
  ListTable,
  MasterResourceAdapter,
  MasterResourceAdapterOptions,
  ResourceState,
  ResourceType,
} from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { AsyncNodeStorage } from 'redux-persist-node-storage';
import { constants } from './constants';
import {
  CreateWalletCRUD,
  DeleteWalletCRUD,
  DescribeWalletCRUD,
  GetWalletCRUD,
  StartWalletCRUD,
  StopWalletCRUD,
} from './crud';
import { MasterWalletResourceAdapter } from './MasterWalletResourceAdapter';
import { WalletPlugin } from './WalletPlugin';

export interface Coin {
  readonly assetName: string;
  readonly asset: string;
  readonly amount: string;
}

export interface Wallet {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
  readonly network: string;
  readonly accountID: UserAccountID;
  readonly address: string;
  readonly unlocked: boolean;
  readonly neoBalance: string;
  readonly gasBalance: string;
  readonly wif: string | undefined;
  readonly nep2: string | undefined;
  readonly publicKey: string;
  readonly balance: readonly Coin[];
}

export interface WalletResourceOptions {
  readonly network?: string;
  readonly password?: string;
  readonly privateKey?: string;
}

const WALLETS_PATH = 'wallets';

export class WalletResourceType extends ResourceType<Wallet, WalletResourceOptions> {
  public constructor({ plugin }: { readonly plugin: WalletPlugin }) {
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

  public async createMasterResourceAdapter({
    pluginManager,
    dataPath,
  }: MasterResourceAdapterOptions): Promise<MasterResourceAdapter<Wallet, WalletResourceOptions>> {
    const walletsPath = path.resolve(dataPath, WALLETS_PATH);
    fs.mkdirpSync(walletsPath);
    const client = new Client({
      file: new LocalUserAccountProvider({
        keystore: new LocalKeyStore(new LocalStringStore(new AsyncNodeStorage(walletsPath))),
        provider: new NEOONEProvider([{ network: 'main', rpcURL: constants.MAIN_URL }]),
      }),
    });

    return new MasterWalletResourceAdapter({
      client,
      pluginManager,
      resourceType: this,
    });
  }

  public getCRUD(): CRUD<Wallet, WalletResourceOptions> {
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

  public getListTable(resources: readonly Wallet[]): ListTable {
    return [['Wallet', 'Name', 'Address', 'Unlocked', 'NEO', 'GAS']].concat(
      _.sortBy(resources, (resource) => resource.name).map((resource) => [
        resource.network,
        resource.baseName,
        resource.address,
        resource.unlocked ? 'Yes' : 'No',
        resource.neoBalance,
        resource.gasBalance,
      ]),
    );
  }

  public getDescribeTable(resource: Wallet): DescribeTable {
    const table: DescribeTable = [
      ['Network', resource.network] as const,
      ['Name', resource.baseName] as const,
      ['Unlocked', resource.unlocked ? 'Yes' : 'No'] as const,
      ['Private Key', resource.wif === undefined ? 'Locked' : resource.wif] as const,
      ['NEP2', resource.nep2 === undefined ? 'N/A' : resource.nep2] as const,
      ['Public Key', resource.publicKey] as const,
      ['Address', resource.address] as const,
    ];

    return table.concat([
      [
        'Balance',
        {
          type: 'list',
          table: [['Asset', 'Amount', 'Hash']].concat(
            _.sortBy(resource.balance, (coin) => coin.asset).map((coin) => [coin.assetName, coin.amount, coin.asset]),
          ),
        },
      ] as const,
    ]);
  }
}
