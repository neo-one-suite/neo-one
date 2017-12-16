/* @flow */
import type { Binary, DescribeTable } from '@neo-one/server-common';
import type { Log, PortAllocator } from '@neo-one/server';
import type { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import type { Subject } from 'rxjs/Subject';

import { defer } from 'rxjs/observable/defer';
import { logInvoke } from '@neo-one/server-common';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { timer } from 'rxjs/observable/timer';

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
  _update$: Subject<void>;
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

    this._update$ = new ReplaySubject(1);
    this.node$ = this._update$.pipe(
      switchMap(() => defer(() => this._getNodeStatus())),
      switchMap(config =>
        timer(0, 5000).pipe(
          switchMap(() =>
            defer(async () => {
              const [ready, live] = await Promise.all([
                this._isReady(),
                this._isLive(),
              ]);
              return { ready, live };
            }),
          ),
          map(({ ready, live }) => ({
            name: this.name,
            ready,
            live,
            rpcAddress: config.rpcAddress,
            tcpAddress: config.tcpAddress,
          })),
        ),
      ),
      shareReplay(1),
    );
    this._update$.next();
  }

  async create(): Promise<void> {
    await logInvoke(
      this._log,
      'NODE_ADAPTER_CREATE',
      { name: this.name },
      async () => {
        await this._create();
        this._update$.next();
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
        this._update$.next();
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
        this._update$.next();
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
        this._update$.next();
      },
    );
  }

  // eslint-disable-next-line
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

  async _getNodeStatus(): Promise<NodeStatus> {
    throw new Error('Not Implemented');
  }

  async _isLive(): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  async _isReady(): Promise<boolean> {
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
