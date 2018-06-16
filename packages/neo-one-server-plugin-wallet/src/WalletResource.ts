import {
  createPrivateKey,
  createReadClient,
  LocalWallet,
  networks,
  NetworkType as ClientNetworkType,
  privateKeyToAddress,
  privateKeyToWIF,
} from '@neo-one/client';
import { common } from '@neo-one/client-core';
import { compoundName, DescribeTable, PluginManager } from '@neo-one/server-plugin';
import { constants as networkConstants, Network, NetworkType } from '@neo-one/server-plugin-network';
import { labels } from '@neo-one/utils';
import fs from 'fs-extra';
import path from 'path';
import { combineLatest, Observable, timer } from 'rxjs';
import { concatMap, shareReplay, take } from 'rxjs/operators';
import { NetworkRequiredError } from './errors';
import { ReadWalletClient, WalletClient } from './types';
import { getClientNetworkType } from './utils';
import { Coin, Wallet, WalletResourceType } from './WalletResourceType';

const getRPCURL = (network?: Network | undefined): string | undefined => {
  if (network === undefined) {
    return undefined;
  }

  if (network.state === 'started') {
    const readyNode = network.nodes.find((node) => node.ready);
    if (readyNode !== undefined) {
      return readyNode.rpcAddress;
    }
  }

  return network.nodes[0].rpcAddress;
};

const updateClient = ({
  networkName,
  network,
  client,
}: {
  readonly networkName: string;
  readonly network?: Network;
  readonly client: WalletClient;
}): ReadWalletClient => {
  let rpcURL = getRPCURL(network);
  if (rpcURL === undefined) {
    if (networkName === networkConstants.NETWORK_NAME.MAIN) {
      rpcURL = networks.MAIN_URL;
    } else if (networkName === networkConstants.NETWORK_NAME.TEST) {
      rpcURL = networks.TEST_URL;
    }
  }

  if (rpcURL === undefined) {
    throw new NetworkRequiredError();
  }

  const clientNetworkType = getClientNetworkType(networkName);
  client.providers.file.provider.addNetwork({
    network: clientNetworkType,
    rpcURL,
  });

  return createReadClient({
    network: clientNetworkType,
    rpcURL,
  });
};

const getNetwork$ = ({
  networkName,
  pluginManager,
}: {
  readonly networkName: string;
  readonly pluginManager: PluginManager;
}): Observable<Network | undefined> =>
  pluginManager
    .getResourcesManager({
      plugin: networkConstants.PLUGIN,
      resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
    })
    .getResource$({
      name: networkName,
      options: {},
    }) as Observable<Network | undefined>;

interface InitialOptions {
  readonly privateKey: string;
  readonly password?: string;
}

interface WalletResourceOptions {
  readonly client: WalletClient;
  readonly readClient: ReadWalletClient;
  readonly pluginManager: PluginManager;
  readonly resourceType: WalletResourceType;
  readonly name: string;
  readonly baseName: string;
  readonly networkName: string;
  readonly address: string;
  readonly dataPath: string;
  readonly walletPath: string;
  readonly clientNetworkType: ClientNetworkType;
  readonly initial?: InitialOptions;
}

interface NewWalletResourceOptions {
  readonly client: WalletClient;
  readonly pluginManager: PluginManager;
  readonly resourceType: WalletResourceType;
  readonly name: string;
  readonly privateKey?: string;
  readonly password?: string;
  readonly dataPath: string;
}

interface ExistingWalletResourceOptions {
  readonly client: WalletClient;
  readonly pluginManager: PluginManager;
  readonly resourceType: WalletResourceType;
  readonly name: string;
  readonly dataPath: string;
}

const WALLET_PATH = 'wallet.json';

export class WalletResource {
  public static async createNew({
    client,
    pluginManager,
    resourceType,
    name,
    privateKey: privateKeyIn,
    password,
    dataPath,
  }: NewWalletResourceOptions): Promise<WalletResource> {
    const {
      name: baseName,
      names: [networkName],
    } = compoundName.extract(name);

    const network = await getNetwork$({ networkName, pluginManager })
      .pipe(take(1))
      .toPromise();
    if (
      network === undefined &&
      !(networkName === networkConstants.NETWORK_NAME.MAIN || networkName === networkConstants.NETWORK_NAME.TEST)
    ) {
      throw new NetworkRequiredError();
    }

    const readClient = updateClient({ networkName, network, client });
    const clientNetworkType = getClientNetworkType(networkName);
    const privateKey = privateKeyIn === undefined ? createPrivateKey() : privateKeyIn;
    const address = privateKeyToAddress(privateKey);

    const walletPath = this.getWalletPath(dataPath);

    return new WalletResource({
      client,
      readClient,
      pluginManager,
      resourceType,
      name,
      baseName,
      networkName,
      address,
      dataPath,
      walletPath,
      clientNetworkType,
      initial: {
        privateKey,
        password,
      },
    });
  }

  public static async createExisting({
    client,
    pluginManager,
    resourceType,
    name,
    dataPath,
  }: ExistingWalletResourceOptions): Promise<WalletResource> {
    const {
      name: baseName,
      names: [networkName],
    } = compoundName.extract(name);

    const network = await getNetwork$({ networkName, pluginManager })
      .pipe(take(1))
      .toPromise();
    const readClient = updateClient({ networkName, network, client });
    const clientNetworkType = getClientNetworkType(networkName);

    const walletPath = this.getWalletPath(dataPath);
    const { address } = await fs.readJSON(walletPath);

    return new WalletResource({
      client,
      readClient,
      pluginManager,
      resourceType,
      name,
      baseName,
      networkName,
      address,
      dataPath,
      walletPath,
      clientNetworkType,
    });
  }

  private static getWalletPath(dataPath: string): string {
    return path.resolve(dataPath, WALLET_PATH);
  }

  public readonly resource$: Observable<Wallet>;
  private readonly client: WalletClient;
  private mutableReadClient: ReadWalletClient;
  private readonly resourceType: WalletResourceType;
  private readonly name: string;
  private readonly baseName: string;
  private readonly networkName: string;
  private readonly networkType: NetworkType;
  private readonly address: string;
  private readonly dataPath: string;
  private readonly walletPath: string;
  private readonly clientNetworkType: ClientNetworkType;
  private mutableInitial: InitialOptions | undefined;
  private mutableDeleted: boolean;
  private mutableNeoBalance: string | undefined;
  private mutableGasBalance: string | undefined;
  private mutableBalance: ReadonlyArray<Coin>;
  private readonly network$: Observable<Network | undefined>;

  public constructor({
    client,
    readClient,
    pluginManager,
    resourceType,
    name,
    baseName,
    networkName,
    address,
    dataPath,
    walletPath,
    clientNetworkType,
    initial,
  }: WalletResourceOptions) {
    this.client = client;
    this.mutableReadClient = readClient;
    this.resourceType = resourceType;
    this.name = name;
    this.baseName = baseName;
    this.networkName = networkName;
    this.address = address;
    this.dataPath = dataPath;
    this.walletPath = walletPath;
    this.clientNetworkType = clientNetworkType;
    this.mutableInitial = initial;

    if (networkName === NetworkType.Main) {
      this.networkType = NetworkType.Main;
    } else if (networkName === NetworkType.Test) {
      this.networkType = NetworkType.Test;
    } else {
      this.networkType = NetworkType.Private;
    }

    this.mutableDeleted = false;
    this.mutableBalance = [];

    this.network$ = getNetwork$({ pluginManager, networkName });
    this.resource$ = combineLatest(this.network$, timer(0, 5000)).pipe(
      concatMap(async (value) => {
        await this.update(value[0]);

        return this.toResource();
      }),
      shareReplay(1),
    );
  }

  public async create(): Promise<void> {
    if (this.mutableInitial === undefined) {
      throw new Error('Something went wrong.');
    }
    const { privateKey, password } = this.mutableInitial;
    await this.client.providers.file.keystore.addAccount({
      network: this.clientNetworkType,
      name: this.baseName,
      privateKey,
      password,
    });

    this.mutableInitial = undefined;
    await fs.ensureDir(path.dirname(this.walletPath));
    await fs.writeJSON(this.walletPath, { address: this.address });
  }

  public async delete(): Promise<void> {
    this.mutableDeleted = true;
    await this.client.providers.file.keystore.deleteAccount(this.walletID);
    await fs.remove(this.dataPath);
  }

  public get walletID(): {
    readonly network: ClientNetworkType;
    readonly address: string;
  } {
    return {
      network: this.clientNetworkType,
      address: this.address,
    };
  }

  public get wallet(): LocalWallet {
    return this.client.providers.file.keystore.getWallet(this.walletID);
  }

  public get unlocked(): boolean {
    return this.wallet.type === 'unlocked';
  }

  public async unlock({ password }: { readonly password: string }): Promise<void> {
    await this.client.providers.file.keystore.unlockWallet({
      id: this.walletID,
      password,
    });
  }

  public async lock(): Promise<void> {
    await this.client.providers.file.keystore.lockWallet(this.walletID);
  }

  public get wif(): string | undefined {
    if (this.wallet.type === 'locked') {
      return undefined;
    }

    return privateKeyToWIF(this.wallet.privateKey);
  }

  public getDebug(): DescribeTable {
    const table: ReadonlyArray<[string, string]> = [['Data Path', this.dataPath], ['Wallet Path', this.walletPath]];

    return table.concat(
      Object.entries(this.toResource()).map<[string, string]>(([key, val]) => {
        if (val === undefined) {
          return [key, 'null'];
        }

        return [key, typeof val === 'string' ? val : JSON.stringify(val, undefined, 2)];
      }),
    );
  }

  private toResource(): Wallet {
    return {
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name: this.name,
      baseName: this.baseName,
      state: this.unlocked ? 'started' : 'stopped',
      network: this.networkName,
      accountID: {
        network: this.networkName,
        address: this.address,
      },

      address: this.address,
      unlocked: this.unlocked,
      neoBalance: this.mutableNeoBalance === undefined ? 'Unknown' : this.mutableNeoBalance,
      gasBalance: this.mutableGasBalance === undefined ? 'Unknown' : this.mutableGasBalance,
      wif: this.wif,
      nep2: this.wallet.nep2,
      publicKey: this.wallet.account.publicKey,
      scriptHash: this.wallet.account.scriptHash,
      balance: this.mutableBalance,
    };
  }

  private async update(network?: Network): Promise<void> {
    if (network !== undefined && network.nodes.some((node) => node.ready)) {
      this.mutableReadClient = updateClient({
        networkName: this.networkName,
        network,
        client: this.client,
      });

      try {
        const account = await this.mutableReadClient.getAccount(this.address);

        let neoBalance = '0';
        let gasBalance = '0';
        this.mutableBalance = await Promise.all(
          Object.entries(account.balances).map<Promise<{ assetName: string; asset: string; amount: string }>>(
            async ([assetHash, amount]): Promise<{ assetName: string; asset: string; amount: string }> => {
              const asset = await this.mutableReadClient.getAsset(assetHash);
              let { name } = asset;
              if (asset.hash === common.NEO_ASSET_HASH) {
                name = 'NEO';
                neoBalance = amount.toString();
              }
              if (asset.hash === common.GAS_ASSET_HASH) {
                name = 'GAS';
                gasBalance = amount.toString();
              }

              return {
                assetName: name,
                asset: assetHash,
                amount: amount.toString(),
              };
            },
          ),
        );

        this.mutableNeoBalance = neoBalance;
        this.mutableGasBalance = gasBalance;
      } catch (error) {
        this.resourceType.plugin.monitor.withData({ [labels.NEO_ADDRESS]: this.address }).logError({
          name: 'neo_wallet_resource_update_wallet',
          message: `Failed to update wallet ${this.address}`,
          error,
        });
      }
    }
  }
}
