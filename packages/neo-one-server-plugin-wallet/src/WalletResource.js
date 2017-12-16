/* @flow */
// flowlint untyped-import:off
import BigNumber from 'bignumber.js';
import { type DescribeTable, compoundName } from '@neo-one/server-common';
import {
  type Network,
  type NetworkType,
  constants as networkConstants,
} from '@neo-one/server-plugin-network';
import type { Observable } from 'rxjs/Observable';
import type { Log, PluginManager } from '@neo-one/server';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { concatMap, map, shareReplay, take } from 'rxjs/operators';
import fs from 'fs-extra';
import mainClient, { Client, testClient } from '@neo-one/client';
import path from 'path';
import { of as _of } from 'rxjs/observable/of';
import { timer } from 'rxjs/observable/timer';
import { utils } from '@neo-one/utils';

import type WalletResourceType, { Coin, Wallet } from './WalletResourceType';

const getNetworkType = ({
  networkName,
  network,
}: {|
  networkName: string,
  network?: ?Network,
|}): NetworkType => {
  if (network == null) {
    if (networkName === networkConstants.NETWORK_NAME.MAIN) {
      return networkConstants.NETWORK_TYPE.MAIN;
    } else if (networkName === networkConstants.NETWORK_NAME.TEST) {
      return networkConstants.NETWORK_TYPE.TEST;
    }

    return networkConstants.NETWORK_TYPE.PRIVATE;
  }

  return network.type;
};

const makeClient = ({
  networkName,
  network,
}: {|
  networkName: string,
  network?: ?Network,
|}): {| client: Client, ready: boolean |} => {
  const networkType = getNetworkType({ networkName, network });
  const returnNotReadyClient = () => {
    if (networkType === networkConstants.NETWORK_TYPE.MAIN) {
      return { client: mainClient, ready: true };
    } else if (networkType === networkConstants.NETWORK_TYPE.TEST) {
      return { client: testClient, ready: true };
    }

    return { client: mainClient, ready: false };
  };

  if (network == null) {
    if (networkType === networkConstants.NETWORK_TYPE.PRIVATE) {
      throw new Error(`Private network ${networkName} does not exist.`);
    }
    return returnNotReadyClient();
  }

  if (network.state === 'started') {
    const readyNode = network.nodes.find(node => node.ready);
    if (readyNode == null) {
      return returnNotReadyClient();
    }

    let type = 'main';
    if (network.type === networkConstants.NETWORK_TYPE.TEST) {
      type = 'test';
    }

    return {
      client: new Client({
        url: readyNode.rpcAddress,
        type,
      }),
      ready: true,
    };
  }

  return returnNotReadyClient();
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

type WalletResourceOptions = {|
  pluginManager: PluginManager,
  resourceType: WalletResourceType,
  name: string,
  baseName: string,
  networkName: string,
  networkType: NetworkType,
  networkExists: boolean,
  address: string,
  privateKey?: string,
  nep2?: string,
  publicKey: string,
  scriptHash: string,
  dataPath: string,
  walletPath: string,
|};

type NewWalletResourceOptions = {|
  pluginManager: PluginManager,
  resourceType: WalletResourceType,
  name: string,
  privateKey?: string,
  password?: string,
  dataPath: string,
|};

type ExistingWalletResourceOptions = {|
  pluginManager: PluginManager,
  resourceType: WalletResourceType,
  name: string,
  dataPath: string,
|};

type SavedWallet = {|
  address: string,
  privateKey?: string,
  nep2?: string,
  publicKey: string,
  scriptHash: string,
|};

const WALLET_PATH = 'wallet.json';

export default class WalletResource {
  _resourceType: WalletResourceType;
  _name: string;
  _baseName: string;
  _networkName: string;
  _networkType: NetworkType;
  _networkExists: boolean;
  _address: string;
  _privateKey: ?string;
  _nep2: ?string;
  _publicKey: string;
  _scriptHash: string;
  _dataPath: string;
  _walletPath: string;

  _deleted: boolean;
  _neoBalance: ?BigNumber;
  _gasBalance: ?BigNumber;
  _balance: Array<Coin>;

  _network$: Observable<?Network>;
  resource$: Observable<Wallet>;

  constructor({
    pluginManager,
    resourceType,
    name,
    baseName,
    networkName,
    networkType,
    networkExists,
    address,
    privateKey,
    nep2,
    publicKey,
    scriptHash,
    dataPath,
    walletPath,
  }: WalletResourceOptions) {
    this._resourceType = resourceType;
    this._name = name;
    this._baseName = baseName;
    this._networkName = networkName;
    this._networkType = networkType;
    this._networkExists = networkExists;
    this._address = address;
    this._privateKey = privateKey;
    this._nep2 = nep2;
    this._publicKey = publicKey;
    this._scriptHash = scriptHash;
    this._dataPath = dataPath;
    this._walletPath = walletPath;

    this._deleted = false;
    this._neoBalance = null;
    this._gasBalance = null;
    this._balance = [];

    this._network$ = getNetwork$({ pluginManager, networkName });
    let timer$ = timer(0, 5000);
    if (networkExists) {
      timer$ = _of(null);
    }

    this.resource$ = combineLatest(this._network$, timer$).pipe(
      concatMap(async value => {
        await this._update(value[0]);
        return this._toResource();
      }),
      shareReplay(1),
    );
  }

  static async createNew({
    pluginManager,
    resourceType,
    name,
    privateKey: privateKeyIn,
    password,
    dataPath,
  }: NewWalletResourceOptions): Promise<WalletResource> {
    const { name: baseName, names: [networkName] } = compoundName.extract(name);

    const network = await getNetwork$({
      pluginManager,
      networkName,
    })
      .pipe(take(1))
      .toPromise();
    const networkType = getNetworkType({ networkName, network });
    const { client } = makeClient({
      networkName,
      network,
    });

    let privateKey =
      privateKeyIn == null ? client.createPrivateKey() : privateKeyIn;
    const publicKey = client.privateKeyToPublicKey(privateKey);
    const scriptHash = client.publicKeyToScriptHash(publicKey);
    const address = client.scriptHashToAddress(scriptHash);

    let nep2;
    if (networkType === networkConstants.NETWORK_TYPE.MAIN) {
      if (password == null) {
        throw new Error('Password is required for MainNet wallets.');
      }
      nep2 = await client.encryptNEP2({
        privateKey,
        password,
      });
      privateKey = undefined;
    }

    const walletPath = this._getWalletPath(dataPath);
    const walletResource = new WalletResource({
      pluginManager,
      resourceType,
      name,
      baseName,
      networkName,
      networkType,
      networkExists: network != null,
      address,
      privateKey,
      nep2,
      publicKey,
      scriptHash,
      dataPath,
      walletPath,
    });

    await fs.ensureDir(path.dirname(walletPath));
    await walletResource._save({ throwError: true });

    return walletResource;
  }

  static async createExisting({
    pluginManager,
    resourceType,
    name,
    dataPath,
  }: ExistingWalletResourceOptions): Promise<WalletResource> {
    const { name: baseName, names: [networkName] } = compoundName.extract(name);

    const network = await getNetwork$({
      pluginManager,
      networkName,
    })
      .pipe(take(1))
      .toPromise();
    const networkType = getNetworkType({ networkName, network });

    const walletPath = this._getWalletPath(dataPath);
    const savedWallet = await this._loadSavedWallet(
      resourceType.plugin.log,
      walletPath,
    );

    return new WalletResource({
      pluginManager,
      resourceType,
      name,
      baseName,
      networkName,
      networkType,
      networkExists: network != null,
      address: savedWallet.address,
      privateKey: savedWallet.privateKey,
      nep2: savedWallet.nep2,
      publicKey: savedWallet.publicKey,
      scriptHash: savedWallet.scriptHash,
      dataPath,
      walletPath,
    });
  }

  async delete(): Promise<void> {
    this._deleted = true;
    await fs.remove(this._dataPath);
  }

  async _update(network?: Network): Promise<void> {
    // eslint-disable-next-line
    const { client, ready } = makeClient({
      networkName: this._networkName,
      network,
    });
    if (ready) {
      // TODO: Updates
    }
  }

  async _save(optionsIn?: {| throwError?: boolean |}): Promise<void> {
    if (this._deleted) {
      return;
    }

    const { throwError } = optionsIn || {};
    const savedWallet = this._getSavedWallet();
    try {
      await fs.writeFile(this._walletPath, JSON.stringify(savedWallet));
    } catch (error) {
      if (throwError) {
        throw error;
      }
    }
  }

  _getSavedWallet(): SavedWallet {
    return {
      address: this._address,
      privateKey:
        this._networkType === networkConstants.NETWORK_TYPE.MAIN ||
        this._privateKey == null
          ? undefined
          : this._privateKey,
      nep2: this._nep2 == null ? undefined : this._nep2,
      publicKey: this._publicKey,
      scriptHash: this._scriptHash,
    };
  }

  get unlocked(): boolean {
    return this._privateKey != null;
  }

  async unlock({ password }: {| password: string |}): Promise<void> {
    const client = await this.getClient();
    const nep2 = this._nep2;
    if (nep2 == null) {
      throw new Error('Wallet does not have an encrypted key');
    }

    this._privateKey = await client.decryptNEP2({
      encryptedKey: nep2,
      password,
    });
  }

  lock(): void {
    if (this._nep2 != null) {
      this._privateKey = null;
    }
  }

  async getClient(): Promise<Client> {
    const network = await this._network$.pipe(take(1)).toPromise();
    const { client } = makeClient({
      networkName: this._networkName,
      network,
    });
    return client;
  }

  _toResource(): Wallet {
    return {
      plugin: this._resourceType.plugin.name,
      resourceType: this._resourceType.name,
      name: this._name,
      baseName: this._baseName,
      state: this.unlocked ? 'started' : 'stopped',
      network: this._networkName,
      address: this._address,
      unlocked: this.unlocked,
      neoBalance:
        this._neoBalance == null ? 'Unknown' : this._neoBalance.toString(),
      gasBalance:
        this._gasBalance == null ? 'Unknown' : this._gasBalance.toString(),
      privateKey: this._privateKey,
      nep2: this._nep2,
      publicKey: this._publicKey,
      scriptHash: this._scriptHash,
      balance: this._balance,
    };
  }

  static async _loadSavedWallet(
    log: Log,
    walletPath: string,
  ): Promise<SavedWallet> {
    try {
      const savedWallet = await fs.readFile(walletPath, 'utf8');
      return JSON.parse(savedWallet);
    } catch (error) {
      log({
        event: 'WALLET_RESOURCE_LOAD_SAVED_WALLET_ERROR',
        error,
      });
      throw error;
    }
  }

  static _getWalletPath(dataPath: string): string {
    return path.resolve(dataPath, WALLET_PATH);
  }

  getDebug(): DescribeTable {
    return [
      ['Data Path', this._dataPath],
      ['Wallet Path', this._walletPath],
    ].concat(
      // flowlint-next-line unclear-type:off
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
