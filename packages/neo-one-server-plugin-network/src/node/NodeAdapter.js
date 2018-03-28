/* @flow */
import {
  type Binary,
  type DescribeTable,
  type PortAllocator,
} from '@neo-one/server-plugin';
import type { Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';

import { concat } from 'rxjs/observable/concat';
import { defer } from 'rxjs/observable/defer';
import { concatMap, map, shareReplay } from 'rxjs/operators';
import { of as _of } from 'rxjs/observable/of';
import { timer } from 'rxjs/observable/timer';
import { labels, utils } from '@neo-one/utils';

import type { NodeSettings } from '../types';

export type Node = {|
  name: string,
  live: boolean,
  ready: boolean,
  rpcAddress: string,
  tcpAddress: string,
  telemetryAddress: string,
|};

export type NodeStatus = {|
  rpcAddress: string,
  tcpAddress: string,
  telemetryAddress: string,
|};

export default class NodeAdapter {
  _monitor: Monitor;
  name: string;
  _binary: Binary;
  _dataPath: string;
  _portAllocator: PortAllocator;

  _settings: NodeSettings;
  node$: Observable<Node>;

  constructor({
    monitor,
    name,
    binary,
    dataPath,
    portAllocator,
    settings,
  }: {|
    monitor: Monitor,
    name: string,
    binary: Binary,
    dataPath: string,
    portAllocator: PortAllocator,
    settings: NodeSettings,
  |}) {
    this._monitor = monitor;
    this.name = name;
    this._binary = binary;
    this._dataPath = dataPath;
    this._portAllocator = portAllocator;

    this._settings = settings;

    const { rpcAddress, tcpAddress, telemetryAddress } = this._getNodeStatus();
    this.node$ = concat(
      _of({
        name: this.name,
        ready: false,
        live: false,
        rpcAddress,
        tcpAddress,
        telemetryAddress,
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
            telemetryAddress: config.telemetryAddress,
          };
        }),
      ),
    ).pipe(shareReplay(1));
  }

  async create(): Promise<void> {
    await this._monitor
      .withData({ [labels.NODE_NAME]: this.name })
      .captureLog(() => this._create(), {
        name: 'neo_node_adapter_create',
        message: `Created node ${this.name}`,
        error: `Failed to create node ${this.name}`,
      });
  }

  async update(settings: NodeSettings): Promise<void> {
    this._monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        await this._update(settings);
        this._settings = settings;
      },
      {
        name: 'neo_node_adapter_update',
        message: `Updated node ${this.name}`,
        error: `Failed to update node ${this.name}`,
      },
    );
  }

  async start(): Promise<void> {
    this._monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        await this._start();
      },
      {
        name: 'neo_node_adapter_start',
        message: `Started node ${this.name}`,
        error: `Failed to start node ${this.name}`,
      },
    );
  }

  async stop(): Promise<void> {
    this._monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        await this._stop();
      },
      {
        name: 'neo_node_adapter_stop',
        message: `Stopped node ${this.name}`,
        error: `Failed to stop node ${this.name}`,
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
              'Telemetry Port',
              this._settings.telemetryPort == null
                ? "'null'"
                : JSON.stringify(this._settings.telemetryPort),
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
