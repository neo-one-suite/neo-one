/* @flow */
import {
  type Binary,
  type Log,
  type DescribeTable,
  type PortAllocator,
  logInvoke,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';

import { concat } from 'rxjs/observable/concat';
import { defer } from 'rxjs/observable/defer';
import { concatMap, map, shareReplay } from 'rxjs/operators';
import { of as _of } from 'rxjs/observable/of';
import { timer } from 'rxjs/observable/timer';
import { utils } from '@neo-one/utils';

import type { NodeSettings } from '../types';

export type Node = {|
  name: string,
  live: boolean,
  ready: boolean,
  rpcAddress: string,
  tcpAddress: string,
|};

export type NodeStatus = {|
  rpcAddress: string,
  tcpAddress: string,
|};

export default class NodeAdapter {
  _log: Log;
  name: string;
  _binary: Binary;
  _dataPath: string;
  _portAllocator: PortAllocator;

  _settings: NodeSettings;
  node$: Observable<Node>;

  constructor({
    log,
    name,
    binary,
    dataPath,
    portAllocator,
    settings,
  }: {|
    log: Log,
    name: string,
    binary: Binary,
    dataPath: string,
    portAllocator: PortAllocator,
    settings: NodeSettings,
  |}) {
    this._log = log;
    this.name = name;
    this._binary = binary;
    this._dataPath = dataPath;
    this._portAllocator = portAllocator;

    this._settings = settings;

    const { rpcAddress, tcpAddress } = this._getNodeStatus();
    this.node$ = concat(
      _of({
        name: this.name,
        ready: false,
        live: false,
        rpcAddress,
        tcpAddress,
      }),
      timer(0, 6000).pipe(
        concatMap(() =>
          defer(async () => {
            const [ready, live] = await Promise.all([
              this._isReady(5000),
              this._isLive(5000),
            ]);
            return { ready, live };
          }),
        ),
        map(({ ready, live }) => {
          const config = this._getNodeStatus();
          return {
            name: this.name,
            ready,
            live,
            rpcAddress: config.rpcAddress,
            tcpAddress: config.tcpAddress,
          };
        }),
      ),
    ).pipe(shareReplay(1));
  }

  async create(): Promise<void> {
    await logInvoke(
      this._log,
      'NODE_ADAPTER_CREATE',
      { name: this.name },
      async () => {
        await this._create();
      },
    );
  }

  async update(settings: NodeSettings): Promise<void> {
    await logInvoke(
      this._log,
      'NODE_ADAPTER_UPDATE',
      { name: this.name },
      async () => {
        await this._update(settings);
        this._settings = settings;
      },
    );
  }

  async start(): Promise<void> {
    await logInvoke(
      this._log,
      'NODE_ADAPTER_START',
      { name: this.name },
      async () => {
        await this._start();
      },
    );
  }

  async stop(): Promise<void> {
    await logInvoke(
      this._log,
      'NODE_ADAPTER_STOP',
      { name: this.name },
      async () => {
        await this._stop();
      },
    );
  }

  async live(timeoutSeconds: number): Promise<void> {
    const start = utils.nowSeconds();

    while (utils.nowSeconds() - start < timeoutSeconds) {
      // eslint-disable-next-line
      const isLive = await this._isLive(5000);
      if (isLive) {
        return;
      }

      // eslint-disable-next-line
      await new Promise(resolve =>
        setTimeout(() => resolve(), timeoutSeconds / 10 * 1000),
      );
    }
  }

  async _create(): Promise<void> {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  async _update(settings: NodeSettings): Promise<void> {
    throw new Error('Not Implemented');
  }

  async _start(): Promise<void> {
    throw new Error('Not Implemented');
  }

  async _stop(): Promise<void> {
    throw new Error('Not Implemented');
  }

  _getNodeStatus(): NodeStatus {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  async _isLive(timeoutMS: number): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  async _isReady(timeoutMS: number): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  getDebug(): DescribeTable {
    return [
      ['Data Path', this._dataPath],
      [
        'Settings',
        {
          type: 'describe',
          table: [
            ['Type', this._settings.type],
            [
              'Is Test Net',
              this._settings.isTestNet == null
                ? "'null'"
                : JSON.stringify(this._settings.isTestNet),
            ],
            [
              'Utility Token Amount',
              this._settings.utilityTokenAmount == null
                ? "'null'"
                : JSON.stringify(this._settings.utilityTokenAmount),
            ],
            [
              'Seconds Per Block',
              this._settings.secondsPerBlock == null
                ? "'null'"
                : JSON.stringify(this._settings.secondsPerBlock),
            ],
            [
              'Standby Validators',
              this._settings.standbyValidators == null
                ? "'null'"
                : JSON.stringify(this._settings.standbyValidators, null, 2),
            ],
            [
              'Address',
              this._settings.address == null
                ? "'null'"
                : JSON.stringify(this._settings.address),
            ],
            [
              'RPC Port',
              this._settings.rpcPort == null
                ? "'null'"
                : JSON.stringify(this._settings.rpcPort),
            ],
            [
              'Listen TCP Port',
              this._settings.listenTCPPort == null
                ? "'null'"
                : JSON.stringify(this._settings.listenTCPPort),
            ],
            [
              'Consensus Enabled',
              this._settings.consensus.enabled ? 'Yes' : 'No',
            ],
            [
              'Consensus Private Key',
              this._settings.consensus.options.privateKey,
            ],
            ['Seeds', JSON.stringify(this._settings.seeds, null, 2)],
            [
              'RPC Endpoints',
              JSON.stringify(this._settings.rpcEndpoints, null, 2),
            ],
          ],
        },
      ],
    ];
  }
}
