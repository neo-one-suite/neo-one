/* @flow */
import {
  type PluginManager,
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type ResourceAdapterReady,
} from '@neo-one/server';
import type { Observable } from 'rxjs/Observable';
import { type Progress } from '@neo-one/server-common';

import WalletResourceAdapter, {
  type WalletResourceAdapterInitOptions,
} from './WalletResourceAdapter';
import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from './WalletResourceType';
import type { WalletClient } from './types';

export default class MasterWalletResourceAdapter {
  _client: WalletClient;
  _pluginManager: PluginManager;
  _resourceType: WalletResourceType;

  constructor({
    client,
    pluginManager,
    resourceType,
  }: {|
    client: WalletClient,
    pluginManager: PluginManager,
    resourceType: WalletResourceType,
  |}) {
    this._client = client;
    this._pluginManager = pluginManager;
    this._resourceType = resourceType;
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
    name,
    dataPath,
  }: ResourceAdapterOptions): WalletResourceAdapterInitOptions {
    return {
      client: this._client,
      pluginManager: this._pluginManager,
      name,
      dataPath,
      resourceType: this._resourceType,
    };
  }
}
