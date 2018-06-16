import { Monitor } from '@neo-one/monitor';
import { Binary, DescribeTable } from '@neo-one/server-plugin';
import { labels, utils } from '@neo-one/utils';
import { concat, defer, Observable, of as _of, timer } from 'rxjs';
import { concatMap, map, shareReplay } from 'rxjs/operators';
import { NodeSettings } from '../types';

export interface Node {
  readonly name: string;
  readonly live: boolean;
  readonly ready: boolean;
  readonly rpcAddress: string;
  readonly tcpAddress: string;
  readonly telemetryAddress: string;
}

export interface NodeStatus {
  readonly rpcAddress: string;
  readonly tcpAddress: string;
  readonly telemetryAddress: string;
}

export abstract class NodeAdapter {
  public readonly name: string;
  public readonly node$: Observable<Node>;
  protected readonly binary: Binary;
  protected readonly dataPath: string;
  protected readonly monitor: Monitor;
  protected mutableSettings: NodeSettings;

  public constructor({
    monitor,
    name,
    binary,
    dataPath,
    settings,
  }: {
    readonly monitor: Monitor;
    readonly name: string;
    readonly binary: Binary;
    readonly dataPath: string;
    readonly settings: NodeSettings;
  }) {
    this.monitor = monitor;
    this.name = name;
    this.binary = binary;
    this.dataPath = dataPath;

    this.mutableSettings = settings;

    const { rpcAddress, tcpAddress, telemetryAddress } = this.getNodeStatus();
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
            const [ready, live] = await Promise.all([this.isReady(5000), this.isLive(5000)]);

            return { ready, live };
          }),
        ),
        map(({ ready, live }) => {
          const config = this.getNodeStatus();

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

  public getDebug(): DescribeTable {
    return [
      ['Data Path', this.dataPath],
      [
        'Settings',
        {
          type: 'describe',
          table: [
            ['Type', this.mutableSettings.type],
            [
              'Is Test Net',
              this.mutableSettings.isTestNet === undefined ? "'null'" : JSON.stringify(this.mutableSettings.isTestNet),
            ],
            [
              'Seconds Per Block',
              this.mutableSettings.secondsPerBlock === undefined
                ? "'null'"
                : JSON.stringify(this.mutableSettings.secondsPerBlock),
            ],
            [
              'Standby Validators',
              this.mutableSettings.standbyValidators === undefined
                ? "'null'"
                : JSON.stringify(this.mutableSettings.standbyValidators, undefined, 2),
            ],
            [
              'Address',
              this.mutableSettings.address === undefined ? "'null'" : JSON.stringify(this.mutableSettings.address),
            ],
            ['RPC Port', JSON.stringify(this.mutableSettings.rpcPort)],
            ['Listen TCP Port', JSON.stringify(this.mutableSettings.listenTCPPort)],
            ['Telemetry Port', JSON.stringify(this.mutableSettings.telemetryPort)],
            ['Consensus Enabled', this.mutableSettings.consensus.enabled ? 'Yes' : 'No'],
            ['Consensus Private Key', this.mutableSettings.consensus.options.privateKey],
            ['Seeds', JSON.stringify(this.mutableSettings.seeds, undefined, 2)],
            ['RPC Endpoints', JSON.stringify(this.mutableSettings.rpcEndpoints, undefined, 2)],
          ],
        },
      ],
    ];
  }

  public async create(): Promise<void> {
    await this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(async () => this.createInternal(), {
      name: 'neo_node_adapter_create',
      message: `Created node ${this.name}`,
      error: `Failed to create node ${this.name}`,
    });
  }

  public async update(settings: NodeSettings): Promise<void> {
    await this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        await this.updateInternal(settings);
        this.mutableSettings = settings;
      },
      {
        name: 'neo_node_adapter_update',
        message: `Updated node ${this.name}`,
        error: `Failed to update node ${this.name}`,
      },
    );
  }

  public async start(): Promise<void> {
    await this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        await this.startInternal();
      },
      {
        name: 'neo_node_adapter_start',
        message: `Started node ${this.name}`,
        error: `Failed to start node ${this.name}`,
      },
    );
  }

  public async stop(): Promise<void> {
    await this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        await this.stopInternal();
      },
      {
        name: 'neo_node_adapter_stop',
        message: `Stopped node ${this.name}`,
        error: `Failed to stop node ${this.name}`,
      },
    );
  }

  public abstract getNodeStatus(): NodeStatus;
  public abstract async isLive(_timeoutMS: number): Promise<boolean>;
  public abstract async isReady(_timeoutMS: number): Promise<boolean>;

  public async live(timeoutSeconds: number): Promise<void> {
    const start = utils.nowSeconds();
    // tslint:disable-next-line no-loop-statement
    while (utils.nowSeconds() - start < timeoutSeconds) {
      const isLive = await this.isLive(5000);
      if (isLive) {
        return;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, (timeoutSeconds / 10) * 1000));
    }
  }

  protected abstract async createInternal(): Promise<void>;
  protected abstract async updateInternal(_settings: NodeSettings): Promise<void>;
  protected abstract async startInternal(): Promise<void>;
  protected abstract async stopInternal(): Promise<void>;
}
