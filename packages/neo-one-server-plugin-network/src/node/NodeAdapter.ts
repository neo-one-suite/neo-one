import { serverLogger } from '@neo-one/logger';
import { Binary, DescribeTable } from '@neo-one/server-plugin';
import { Labels, utils } from '@neo-one/utils';
import { concat, Observable, of as _of, timer } from 'rxjs';
import { concatMap, shareReplay } from 'rxjs/operators';
import { NodeSettings } from '../types';

const logger = serverLogger.child({ component: 'node_adapter' });

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
  protected mutableSettings: NodeSettings;

  public constructor({
    name,
    binary,
    dataPath,
    settings,
  }: {
    readonly name: string;
    readonly binary: Binary;
    readonly dataPath: string;
    readonly settings: NodeSettings;
  }) {
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
      timer(0, 500).pipe(
        concatMap(async () => {
          const config = this.getNodeStatus();
          const [ready, live] = await Promise.all([this.isReady(), this.isLive()]);

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
      ['Data Path', this.dataPath] as const,
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
      ] as const,
    ];
  }

  public async create(): Promise<void> {
    const logData = { title: 'neo_node_adapter_create', [Labels.NODE_NAME]: this.name };
    try {
      await this.createInternal();
      logger.info(logData, `Created node ${this.name}`);
    } catch (error) {
      logger.error({ ...logData, error }, `Failed to create node ${this.name}`);
      throw error;
    }
  }

  public async update(settings: NodeSettings): Promise<void> {
    const logData = { title: 'neo_node_adapter_update', [Labels.NODE_NAME]: this.name };
    try {
      await this.updateInternal(settings);
      this.mutableSettings = settings;
      logger.info(logData, `Updated node ${this.name}`);
    } catch (error) {
      logger.error({ ...logData, error }, `Failed to update node ${this.name}`);
      throw error;
    }
  }

  public async start(): Promise<void> {
    const logData = { title: 'neo_node_adapter_start', [Labels.NODE_NAME]: this.name };
    try {
      await this.startInternal();
      logger.info(logData, `Started node ${this.name}`);
    } catch (error) {
      logger.error({ ...logData, error: error.message }, `Failed to start node ${this.name}`);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    const logData = { title: 'neo_node_adapter_stop', [Labels.NODE_NAME]: this.name };
    try {
      await this.stopInternal();
      logger.info(logData, `Stopped node ${this.name}`);
    } catch (error) {
      logger.error({ ...logData, error: error.message }, `Failed to stop node ${this.name}`);
      throw error;
    }
  }

  public abstract getNodeStatus(): NodeStatus;

  public async live(timeoutSeconds: number): Promise<void> {
    const start = utils.nowSeconds();
    // tslint:disable-next-line no-loop-statement
    while (utils.nowSeconds() - start < timeoutSeconds) {
      const isLive = await this.isLive();
      if (isLive) {
        return;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`Node ${this.name} did not start.`);
  }

  public async ready(timeoutSeconds: number): Promise<void> {
    const start = utils.nowSeconds();
    // tslint:disable-next-line no-loop-statement
    while (utils.nowSeconds() - start < timeoutSeconds) {
      const isLive = await this.isReady();
      if (isLive) {
        return;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`Node ${this.name} is not ready.`);
  }

  protected abstract async isLive(): Promise<boolean>;
  protected abstract async isReady(): Promise<boolean>;
  protected abstract async createInternal(): Promise<void>;
  protected abstract async updateInternal(_settings: NodeSettings): Promise<void>;
  protected abstract async startInternal(): Promise<void>;
  protected abstract async stopInternal(): Promise<void>;
}
