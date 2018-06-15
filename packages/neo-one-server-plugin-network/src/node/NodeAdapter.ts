import { Monitor } from '@neo-one/monitor';
import { Binary, DescribeTable, PortAllocator } from '@neo-one/server-plugin';
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

export class NodeAdapter {
  public readonly name: string;
  public readonly node$: Observable<Node>;
  protected readonly binary: Binary;
  protected readonly dataPath: string;
  protected readonly monitor: Monitor;
  protected mutableSettings: NodeSettings;
  private readonly portAllocator: PortAllocator;

  public constructor({
    monitor,
    name,
    binary,
    dataPath,
    portAllocator,
    settings,
  }: {
    readonly monitor: Monitor;
    readonly name: string;
    readonly binary: Binary;
    readonly dataPath: string;
    readonly portAllocator: PortAllocator;
    readonly settings: NodeSettings;
  }) {
    this.monitor = monitor;
    this.name = name;
    this.binary = binary;
    this.dataPath = dataPath;
    this.portAllocator = portAllocator;

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
              // tslint:disable-next-line strict-type-predicates quotemark
              this.mutableSettings.isTestNet === undefined ? "'null'" : JSON.stringify(this.mutableSettings.isTestNet),
            ],

            [
              'Seconds Per Block',
              this.mutableSettings.secondsPerBlock === undefined
                ? // tslint:disable-next-line quotemark
                  "'null'"
                : JSON.stringify(this.mutableSettings.secondsPerBlock),
            ],

            [
              'Standby Validators',
              this.mutableSettings.standbyValidators === undefined
                ? // tslint:disable-next-line quotemark
                  "'null'"
                : JSON.stringify(this.mutableSettings.standbyValidators, undefined, 2),
            ],

            [
              'Address',
              // tslint:disable-next-line quotemark
              this.mutableSettings.address === undefined ? "'null'" : JSON.stringify(this.mutableSettings.address),
            ],
            [
              'RPC Port',
              // tslint:disable-next-line strict-type-predicates quotemark
              this.mutableSettings.rpcPort === undefined ? "'null'" : JSON.stringify(this.mutableSettings.rpcPort),
            ],

            [
              'Listen TCP Port',
              // tslint:disable-next-line strict-type-predicates
              this.mutableSettings.listenTCPPort === undefined
                ? // tslint:disable-next-line quotemark
                  "'null'"
                : JSON.stringify(this.mutableSettings.listenTCPPort),
            ],

            [
              'Telemetry Port',
              // tslint:disable-next-line strict-type-predicates
              this.mutableSettings.telemetryPort === undefined
                ? // tslint:disable-next-line quotemark
                  "'null'"
                : JSON.stringify(this.mutableSettings.telemetryPort),
            ],

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
    await this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(async () => this.create(), {
      name: 'neo_node_adapter_create',
      message: `Created node ${this.name}`,
      error: `Failed to create node ${this.name}`,
    });
  }

  public async update(settings: NodeSettings): Promise<void> {
    this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        // tslint:disable-next-line no-floating-promises
        await this.update(settings);
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
    this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        // tslint:disable-next-line no-floating-promises
        await this.start();
      },
      {
        name: 'neo_node_adapter_start',
        message: `Started node ${this.name}`,
        error: `Failed to start node ${this.name}`,
      },
    );
  }

  public async stop(): Promise<void> {
    this.monitor.withData({ [labels.NODE_NAME]: this.name }).captureLog(
      async () => {
        // tslint:disable-next-line no-floating-promises
        await this.stop();
      },
      {
        name: 'neo_node_adapter_stop',
        message: `Stopped node ${this.name}`,
        error: `Failed to stop node ${this.name}`,
      },
    );
  }

  public getNodeStatus(): NodeStatus {
    throw new Error('Not Implemented');
  }

  // tslint:disable-next-line no-unused
  public async isLive(timeoutMS: number): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  // tslint:disable-next-line no-unused
  public async isReady(timeoutMS: number): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  private async live(timeoutSeconds: number): Promise<void> {
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

  private async createInternal(): Promise<void> {
    throw new Error('Not Implemented');
  }

  // tslint:disable-next-line no-unused
  private async updateInternal(settings: NodeSettings): Promise<void> {
    throw new Error('Not Implemented');
  }

  private async startInternal(): Promise<void> {
    throw new Error('Not Implemented');
  }

  private async stopInternal(): Promise<void> {
    throw new Error('Not Implemented');
  }
}
