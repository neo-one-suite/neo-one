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
import type CompiledSmartContractResourceType, {
  CompiledSmartContract,
  CompiledSmartContractResourceOptions,
} from './CompiledSmartContractResourceType';

import compileSmartContract from './compileSmartContract';

const ABI_PATH = 'abi.json';
const AVM_PATH = 'sc.avm';

export type CompiledSmartContractResourceAdapterInitOptions = {|
  name: string,
  dataPath: string,
  binary: Binary,
  resourceType: CompiledSmartContractResourceType,
|};

export type CompiledSmartContractResourceAdapterStaticOptions = {|
  ...CompiledSmartContractResourceAdapterInitOptions,
  avmPath: string,
  abiPath: string,
|};

export type CompiledSmartContractResourceAdapterOptions = {|
  ...CompiledSmartContractResourceAdapterStaticOptions,
  abi: ABI,
|};

export default class CompiledSmartContractResourceAdapter {
  _name: string;
  _dataPath: string;
  _binary: Binary;
  _resourceType: CompiledSmartContractResourceType;
  _avmPath: string;
  _abiPath: string;
  _abi: ABI;

  _update$: Subject<void>;

  resource$: Observable<CompiledSmartContract>;

  constructor({
    name,
    dataPath,
    binary,
    resourceType,
    avmPath,
    abiPath,
    abi,
  }: CompiledSmartContractResourceAdapterOptions) {
    this._name = name;
    this._dataPath = dataPath;
    this._binary = binary;
    this._resourceType = resourceType;
    this._avmPath = avmPath;
    this._abiPath = abiPath;
    this._abi = abi;

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
          abi: this._abi,
        }),
      ),
      shareReplay(1),
    );
    this._update$.next();
  }

  static async init(
    options: CompiledSmartContractResourceAdapterInitOptions,
  ): Promise<CompiledSmartContractResourceAdapter> {
    const staticOptions = this._getStaticOptions(options);
    const abi = await fs.readJSON(staticOptions.abiPath);

    return new this({
      name: staticOptions.name,
      binary: staticOptions.binary,
      dataPath: staticOptions.dataPath,
      resourceType: staticOptions.resourceType,
      abiPath: staticOptions.abiPath,
      avmPath: staticOptions.avmPath,
      abi,
    });
  }

  static _getStaticOptions(
    options: CompiledSmartContractResourceAdapterInitOptions,
  ): CompiledSmartContractResourceAdapterStaticOptions {
    return {
      name: options.name,
      binary: options.binary,
      dataPath: options.dataPath,
      resourceType: options.resourceType,
      abiPath: path.resolve(options.dataPath, ABI_PATH),
      avmPath: path.resolve(options.dataPath, AVM_PATH),
    };
  }

  async destroy(): Promise<void> {
    // eslint-disable-next-line
  }

  static create$(
    adapterOptions: CompiledSmartContractResourceAdapterInitOptions,
    options: CompiledSmartContractResourceOptions,
  ): Observable<
    | Progress
    | ResourceAdapterReady<
        CompiledSmartContract,
        CompiledSmartContractResourceOptions,
      >,
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
        let abi = await compileSmartContract({
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

        return concat(
          _of({
            type: 'progress',
            persist: true,
            message: 'Compiled smart contract',
          }),
          _of({
            type: 'progress',
            message: 'Saving ABI',
          }),
          defer(async () => {
            await fs.writeJSON(staticOptions.abiPath, abi);

            return {
              type: 'progress',
              persist: true,
              message: 'Saved ABI',
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
              abi,
            }),
          }),
        );
      }).pipe(concatAll()),
    );
  }

  // eslint-disable-next-line
  delete$(options: CompiledSmartContractResourceOptions): Observable<Progress> {
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
  start$(options: CompiledSmartContractResourceOptions): Observable<Progress> {
    throw new Error('Cannot be started');
  }

  // eslint-disable-next-line
  stop$(options: CompiledSmartContractResourceOptions): Observable<Progress> {
    throw new Error('Cannot be stopped');
  }

  getDebug(): DescribeTable {
    return [
      ['Data Path', this._dataPath],
      ['AVM Path', this._avmPath],
      ['ABI Path', this._abiPath],
      ['ABI', JSON.stringify(this._abi, null, 2)],
    ];
  }
}
