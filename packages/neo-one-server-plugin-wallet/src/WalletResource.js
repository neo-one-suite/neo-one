/* @flow */
import {
  type DescribeTable,
  type PluginManager,
  compoundName,
} from '@neo-one/server-plugin';
import {
  type Network,
  type NetworkType,
  constants as networkConstants,
} from '@neo-one/server-plugin-network';
import type { Observable } from 'rxjs/Observable';
import {
  type LocalWallet,
  type NetworkType as ClientNetworkType,
  createPrivateKey,
  networks,
  privateKeyToAddress,
  privateKeyToWIF,
  createReadClient,
} from '@neo-one/client';
import { common } from '@neo-one/client-core';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { concatMap, map, shareReplay, take } from 'rxjs/operators';
import fs from 'fs-extra';
import path from 'path';
import { timer } from 'rxjs/observable/timer';
import { labels, utils } from '@neo-one/utils';

import { NetworkRequiredError } from './errors';
import type { ReadWalletClient, WalletClient } from './types';
import type WalletResourceType, { Coin, Wallet } from './WalletResourceType';

import { getClientNetworkType } from './utils';

const getRPCURL = (network?: ?Network): ?string => {
  if (network == null) {
    return null;
  }

  if (network.state === 'started') {
    const readyNode = network.nodes.find(node => node.ready);
    if (readyNode != null) {
      return readyNode.rpcAddress;
    }
  }

  return network.nodes[0].rpcAddress;
};

const updateClient = ({
  networkName,
  network,
  client,
}: {|
  networkName: string,
  network?: ?Network,
  client: WalletClient,
|}): ReadWalletClient => {
  let rpcURL = getRPCURL(network);
  if (rpcURL == null) {
    if (networkName === networkConstants.NETWORK_NAME.MAIN) {
      rpcURL = networks.MAIN_URL;
    } else if (networkName === networkConstants.NETWORK_NAME.TEST) {
      rpcURL = networks.TEST_URL;
    }
  }

  if (rpcURL == null) {
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
}: {|
  networkName: string,
  pluginManager: PluginManager,
|}): Observable<?Network> => {
  const network$ = pluginManager
    .getResourcesManager({
      plugin: networkConstants.PLUGIN,
      resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
    })
    .getResource$({
      name: networkName,
      options: {},
    });

  return network$.pipe(
    map(network => (network == null ? network : (network: $FlowFixMe))),
  );
};

type InitialOptions = {|
  privateKey: string,
  password?: string,
|};

type WalletResourceOptions = {|
  client: WalletClient,
  readClient: ReadWalletClient,
  pluginManager: PluginManager,
  resourceType: WalletResourceType,
  name: string,
  baseName: string,
  networkName: string,
  address: string,
  dataPath: string,
  walletPath: string,
  clientNetworkType: ClientNetworkType,
  initial?: InitialOptions,
|};

type NewWalletResourceOptions = {|
  client: WalletClient,
  pluginManager: PluginManager,
  resourceType: WalletResourceType,
  name: string,
  privateKey?: string,
  password?: string,
  dataPath: string,
|};

type ExistingWalletResourceOptions = {|
  client: WalletClient,
  pluginManager: PluginManager,
  resourceType: WalletResourceType,
  name: string,
  dataPath: string,
|};

const WALLET_PATH = 'wallet.json';

export default class WalletResource {
  _client: WalletClient;
  _readClient: ReadWalletClient;
  _resourceType: WalletResourceType;
  _name: string;
  _baseName: string;
  _networkName: string;
  _networkType: NetworkType;
  _address: string;
  _dataPath: string;
  _walletPath: string;
  _clientNetworkType: ClientNetworkType;
  _initial: ?InitialOptions;

  _deleted: boolean;
  _neoBalance: ?string;
  _gasBalance: ?string;
  _balance: Array<Coin>;

  _network$: Observable<?Network>;
  resource$: Observable<Wallet>;

  constructor({
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
    this._client = client;
    this._readClient = readClient;
    this._resourceType = resourceType;
    this._name = name;
    this._baseName = baseName;
    this._networkName = networkName;
    this._address = address;
    this._dataPath = dataPath;
    this._walletPath = walletPath;
    this._clientNetworkType = clientNetworkType;
    this._initial = initial;

    if (networkName === networkConstants.NETWORK_NAME.MAIN) {
      this._networkType = networkConstants.NETWORK_TYPE.MAIN;
    } else if (networkName === networkConstants.NETWORK_NAME.TEST) {
      this._networkType = networkConstants.NETWORK_TYPE.TEST;
    } else {
      this._networkType = networkConstants.NETWORK_TYPE.PRIVATE;
    }

    this._deleted = false;
    this._neoBalance = null;
    this._gasBalance = null;
    this._balance = [];

    this._network$ = getNetwork$({ pluginManager, networkName });
    this.resource$ = combineLatest(this._network$, timer(0, 5000)).pipe(
      concatMap(async value => {
        await this._update(value[0]);
        return this._toResource();
      }),
      shareReplay(1),
    );
  }

  static async createNew({
    client,
    pluginManager,
    resourceType,
    name,
    privateKey: privateKeyIn,
    password,
    dataPath,
  }: NewWalletResourceOptions): Promise<WalletResource> {
    const { name: baseName, names: [networkName] } = compoundName.extract(name);

    const network = await getNetwork$({ networkName, pluginManager })
      .pipe(take(1))
      .toPromise();
    if (
      network == null &&
      !(
        networkName === networkConstants.NETWORK_NAME.MAIN ||
        networkName === networkConstants.NETWORK_NAME.TEST
      )
    ) {
      throw new NetworkRequiredError();
    }

    const readClient = updateClient({ networkName, network, client });
    const clientNetworkType = getClientNetworkType(networkName);
    const privateKey = privateKeyIn == null ? createPrivateKey() : privateKeyIn;
    const address = privateKeyToAddress(privateKey);

    const walletPath = this._getWalletPath(dataPath);

    const walletResource = new WalletResource({
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

    return walletResource;
  }

  static async createExisting({
    client,
    pluginManager,
    resourceType,
    name,
    dataPath,
  }: ExistingWalletResourceOptions): Promise<WalletResource> {
    const { name: baseName, names: [networkName] } = compoundName.extract(name);

    const network = await getNetwork$({ networkName, pluginManager })
      .pipe(take(1))
      .toPromise();
    const readClient = updateClient({ networkName, network, client });
    const clientNetworkType = getClientNetworkType(networkName);

    const walletPath = this._getWalletPath(dataPath);
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

  async create(): Promise<void> {
    if (this._initial == null) {
      throw new Error('Something went wrong.');
    }
    const { privateKey, password } = this._initial;
    await this._client.providers.file.keystore.addAccount({
      network: this._clientNetworkType,
      name: this._baseName,
      privateKey,
      password,
    });
    this._initial = null;
    await fs.ensureDir(path.dirname(this._walletPath));
    await fs.writeJSON(this._walletPath, { address: this._address });
  }

  async delete(): Promise<void> {
    this._deleted = true;
    await this._client.providers.file.keystore.deleteAccount(this.walletID);
    await fs.remove(this._dataPath);
  }

  async _update(network?: ?Network): Promise<void> {
    if (network != null && network.nodes.some(node => node.ready)) {
      this._readClient = updateClient({
        networkName: this._networkName,
        network,
        client: this._client,
      });

      try {
        const account = await this._readClient.getAccount(this._address);

        let neoBalance = '0';
        let gasBalance = '0';
        this._balance = await Promise.all(
          utils.entries(account.balances).map(async ([assetHash, amount]) => {
            const asset = await this._readClient.getAsset(assetHash);
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
          }),
        );
        this._neoBalance = neoBalance;
        this._gasBalance = gasBalance;
      } catch (error) {
        this._resourceType.plugin.monitor
          .withData({ [labels.NEO_ADDRESS]: this._address })
          .logError({
            name: 'neo_wallet_resource_update_wallet',
            message: `Failed to update wallet ${this._address}`,
            error,
          });
      }
    }
  }

  get walletID(): {|
    network: ClientNetworkType,
    address: string,
  |} {
    return {
      network: this._clientNetworkType,
      address: this._address,
    };
  }

  get wallet(): LocalWallet {
    return this._client.providers.file.keystore.getWallet(this.walletID);
  }

  get unlocked(): boolean {
    return this.wallet.type === 'unlocked';
  }

  async unlock({ password }: {| password: string |}): Promise<void> {
    await this._client.providers.file.keystore.unlockWallet({
      id: this.walletID,
      password,
    });
  }

  lock(): void {
    this._client.providers.file.keystore.lockWallet(this.walletID);
  }

  get wif(): ?string {
    if (this.wallet.privateKey == null) {
      return null;
    }
    return privateKeyToWIF(this.wallet.privateKey);
  }

  _toResource(): Wallet {
    return {
      plugin: this._resourceType.plugin.name,
      resourceType: this._resourceType.name,
      name: this._name,
      baseName: this._baseName,
      state: this.unlocked ? 'started' : 'stopped',
      network: this._networkName,
      accountID: {
        network: this._networkName,
        address: this._address,
      },
      address: this._address,
      unlocked: this.unlocked,
      neoBalance: this._neoBalance == null ? 'Unknown' : this._neoBalance,
      gasBalance: this._gasBalance == null ? 'Unknown' : this._gasBalance,
      wif: this.wif,
      nep2: this.wallet.nep2,
      publicKey: this.wallet.account.publicKey,
      scriptHash: this.wallet.account.scriptHash,
      balance: this._balance,
    };
  }

  static _getWalletPath(dataPath: string): string {
    return path.resolve(dataPath, WALLET_PATH);
  }

  getDebug(): DescribeTable {
    return [
      ['Data Path', this._dataPath],
      ['Wallet Path', this._walletPath],
    ].concat(
      utils.entries((this._toResource(): Object)).map(([key, val]) => {
        if (val == null) {
          return [key, 'null'];
        }
        return [
          key,
          typeof val === 'string' ? val : JSON.stringify(val, null, 2),
        ];
      }),
    );
  }
}
