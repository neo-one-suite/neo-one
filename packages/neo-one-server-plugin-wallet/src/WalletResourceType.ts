import {
  Client,
  LocalKeyStore,
  LocalStringStore,
  LocalUserAccountProvider,
  provider,
  UserAccountID,
} from '@neo-one/client';
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
import * as _ from 'lodash';
import * as path from 'path';
import { AsyncNodeStorage } from 'redux-persist-node-storage';
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
  readonly scriptHash: string;
  readonly balance: ReadonlyArray<Coin>;
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

  public getListTable(resources: ReadonlyArray<Wallet>): ListTable {
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
      ['Network', resource.network],
      ['Name', resource.baseName],
      ['Unlocked', resource.unlocked ? 'Yes' : 'No'],
      ['Private Key', resource.wif === undefined ? 'Locked' : resource.wif],
      ['NEP2', resource.nep2 === undefined ? 'N/A' : resource.nep2],
      ['Public Key', resource.publicKey],
      ['Address', resource.address],
      ['Script Hash', resource.scriptHash],
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
      ],
    ]);
  }
}
