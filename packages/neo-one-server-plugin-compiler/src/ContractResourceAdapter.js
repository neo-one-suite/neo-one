/* @flow */
// flowlint untyped-import:off
import type { ABI } from '@neo-one/client';
import {
  type Binary,
  type DescribeTable,
  type Progress,
  type ResourceAdapterReady,
} from '@neo-one/server-plugin';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import type { Subject } from 'rxjs/Subject';

import { concat } from 'rxjs/observable/concat';
import { concatAll, shareReplay, switchMap } from 'rxjs/operators';
import { defer } from 'rxjs/observable/defer';
import fs from 'fs-extra';
import { of as _of } from 'rxjs/observable/of';
import path from 'path';

import { ABIRequiredError } from './errors';
import type ContractResourceType, {
  Contract,
  ContractResourceOptions,
} from './ContractResourceType';

import compileSmartContract from './compileSmartContract';

const ABI_PATH = 'abi.json';
const AVM_PATH = 'sc.avm';
const CONFIG_PATH = 'sc.json';

export type ContractResourceAdapterInitOptions = {|
  name: string,
  dataPath: string,
  binary: Binary,
  resourceType: ContractResourceType,
|};

export type ContractResourceAdapterStaticOptions = {|
  ...ContractResourceAdapterInitOptions,
  avmPath: string,
  abiPath: string,
  configPath: string,
|};

export type ContractResourceAdapterOptions = {|
  ...ContractResourceAdapterStaticOptions,
  script: string,
  abi: ABI,
  hasStorage: boolean,
  hasDynamicInvoke: boolean,
|};

export default class ContractResourceAdapter {
  _name: string;
  _dataPath: string;
  _binary: Binary;
  _resourceType: ContractResourceType;
  _avmPath: string;
  _abiPath: string;
  _configPath: string;
  _script: string;
  _abi: ABI;
  _hasStorage: boolean;
  _hasDynamicInvoke: boolean;

  _update$: Subject<void>;

  resource$: Observable<Contract>;

  constructor({
    name,
    dataPath,
    binary,
    resourceType,
    avmPath,
    abiPath,
    configPath,
    script,
    abi,
    hasStorage,
    hasDynamicInvoke,
  }: ContractResourceAdapterOptions) {
    this._name = name;
    this._dataPath = dataPath;
    this._binary = binary;
    this._resourceType = resourceType;
    this._avmPath = avmPath;
    this._abiPath = abiPath;
    this._configPath = configPath;
    this._script = script;
    this._abi = abi;
    this._hasStorage = hasStorage;
    this._hasDynamicInvoke = hasDynamicInvoke;

    this._update$ = new ReplaySubject(1);
    this.resource$ = this._update$.pipe(
      switchMap(() =>
        _of({
          plugin: this._resourceType.plugin.name,
          resourceType: this._resourceType.name,
          name: this._name,
          baseName: this._name,
          state: 'stopped',
          avmPath: this._avmPath,
          script: this._script,
          abi: this._abi,
          hasStorage: this._hasStorage,
          hasDynamicInvoke: this._hasDynamicInvoke,
        }),
      ),
      shareReplay(1),
    );
    this._update$.next();
  }

  static async init(
    options: ContractResourceAdapterInitOptions,
  ): Promise<ContractResourceAdapter> {
    const staticOptions = this._getStaticOptions(options);
    const [abi, script, { hasStorage, hasDynamicInvoke }] = await Promise.all([
      fs.readJSON(staticOptions.abiPath),
      fs.readFile(staticOptions.avmPath, 'utf8'),
      fs.readJSON(staticOptions.configPath),
    ]);

    return new this({
      name: staticOptions.name,
      binary: staticOptions.binary,
      dataPath: staticOptions.dataPath,
      resourceType: staticOptions.resourceType,
      abiPath: staticOptions.abiPath,
      avmPath: staticOptions.avmPath,
      configPath: staticOptions.configPath,
      abi,
      script,
      hasStorage,
      hasDynamicInvoke,
    });
  }

  static _getStaticOptions(
    options: ContractResourceAdapterInitOptions,
  ): ContractResourceAdapterStaticOptions {
    return {
      name: options.name,
      binary: options.binary,
      dataPath: options.dataPath,
      resourceType: options.resourceType,
      abiPath: path.resolve(options.dataPath, ABI_PATH),
      avmPath: path.resolve(options.dataPath, AVM_PATH),
      configPath: path.resolve(options.dataPath, CONFIG_PATH),
    };
  }

  async destroy(): Promise<void> {
    // eslint-disable-next-line
  }

  static create$(
    adapterOptions: ContractResourceAdapterInitOptions,
    options: ContractResourceOptions,
  ): Observable<
    Progress | ResourceAdapterReady<Contract, ContractResourceOptions>,
  > {
    const staticOptions = this._getStaticOptions(adapterOptions);
    return concat(
      _of({
        type: 'progress',
        message: 'Creating data directory',
      }),
      defer(async () => {
        await fs.ensureDir(staticOptions.dataPath);
        return {
          type: 'progress',
          persist: true,
          message: 'Created data directory',
        };
      }),
      _of({
        type: 'progress',
        message: 'Compiling smart contract',
      }),
      defer(async () => {
        if (options.scPath == null) {
          throw new Error(
            'Something went wrong, smart contract path was null.',
          );
        }
        let { abi, hasStorage, hasDynamicInvoke } = await compileSmartContract({
          scPath: options.scPath,
          avmPath: staticOptions.avmPath,
          binary: staticOptions.binary,
        });
        if (abi == null) {
          // eslint-disable-next-line
          abi = options.abi;
        }

        if (abi == null) {
          throw new ABIRequiredError();
        }

        if (hasStorage == null) {
          // eslint-disable-next-line
          hasStorage = options.hasStorage;
        }

        if (hasDynamicInvoke == null) {
          // eslint-disable-next-line
          hasDynamicInvoke = options.hasDynamicInvoke;
        }

        const script = await fs.readFile(staticOptions.avmPath, 'utf8');

        return concat(
          _of({
            type: 'progress',
            persist: true,
            message: 'Compiled smart contract',
          }),
          _of({
            type: 'progress',
            message: 'Saving ABI and configuration',
          }),
          defer(async () => {
            await Promise.all([
              fs.writeJSON(staticOptions.abiPath, abi),
              fs.writeJSON(staticOptions.configPath, {
                hasDynamicInvoke,
                hasStorage,
              }),
            ]);

            return {
              type: 'progress',
              persist: true,
              message: 'Saved ABI and configuration',
            };
          }),
          _of({
            type: 'ready',
            resourceAdapter: new this({
              name: staticOptions.name,
              binary: staticOptions.binary,
              dataPath: staticOptions.dataPath,
              resourceType: staticOptions.resourceType,
              abiPath: staticOptions.abiPath,
              avmPath: staticOptions.avmPath,
              configPath: staticOptions.configPath,
              script,
              abi,
              hasStorage,
              hasDynamicInvoke,
            }),
          }),
        );
      }).pipe(concatAll()),
    );
  }

  // eslint-disable-next-line
  delete$(options: ContractResourceOptions): Observable<Progress> {
    return concat(
      defer(() =>
        _of({
          type: 'progress',
          message: 'Cleaning up local files',
        }),
      ),
      defer(async () => {
        try {
          await fs.remove(this._dataPath);
          return {
            type: 'progress',
            persist: true,
            message: 'Cleaned up local files',
          };
        } catch (error) {
          this._resourceType.plugin.log({
            event: 'NETWORK_RESOURCE_ADAPTER_DELETE_ERROR',
            error,
          });
          throw error;
        }
      }),
    );
  }

  // eslint-disable-next-line
  start$(options: ContractResourceOptions): Observable<Progress> {
    throw new Error('Cannot be started');
  }

  // eslint-disable-next-line
  stop$(options: ContractResourceOptions): Observable<Progress> {
    throw new Error('Cannot be stopped');
  }

  getDebug(): DescribeTable {
    return [
      ['Data Path', this._dataPath],
      ['AVM Path', this._avmPath],
      ['ABI Path', this._abiPath],
      ['Config Path', this._configPath],
      ['Storage', this._hasStorage ? 'Yes' : 'No'],
      ['Dynamic Invoke', this._hasDynamicInvoke ? 'Yes' : 'No'],
      ['ABI', JSON.stringify(this._abi, null, 2)],
    ];
  }
}
