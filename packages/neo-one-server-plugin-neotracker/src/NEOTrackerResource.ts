import { Monitor } from '@neo-one/monitor';
import { DescribeTable, killProcess } from '@neo-one/server-plugin';
import { OmitStrict } from '@neo-one/utils';
import fetch from 'cross-fetch';
import execa from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';
import { concat, Observable, of, timer } from 'rxjs';
import { concatMap, shareReplay } from 'rxjs/operators';
import { NetworkType } from './constants';
import { NEOTracker, NEOTrackerResourceType } from './NEOTrackerResourceType';

interface NEOTrackerResourceOptions {
  readonly resourceType: NEOTrackerResourceType;
  readonly name: string;
  readonly dataPath: string;
  readonly neotrackerPath: string;
  readonly dbPath: string;
  readonly network: NetworkType;
  readonly rpcURL: string;
  readonly port: number;
  readonly metricsPort: number;
}

interface NewNEOTrackerResourceOptions {
  readonly resourceType: NEOTrackerResourceType;
  readonly name: string;
  readonly dataPath: string;
  readonly network: NetworkType;
  readonly rpcURL: string;
  readonly port: number;
  readonly metricsPort: number;
}

interface ExistingNEOTrackerResourceOptions {
  readonly resourceType: NEOTrackerResourceType;
  readonly name: string;
  readonly dataPath: string;
}

const DB_PATH = 'db.sqlite';
const NEOTRACKER_PATH = 'neotracker.json';

export class NEOTrackerResource {
  public static async createNew({
    resourceType,
    name,
    dataPath,
    network,
    rpcURL,
    port,
    metricsPort,
  }: NewNEOTrackerResourceOptions): Promise<NEOTrackerResource> {
    const neotrackerPath = this.getNEOTrackerPath(dataPath);
    const dbPath = this.getDBPath(dataPath);

    return new NEOTrackerResource({
      resourceType,
      name,
      dataPath,
      neotrackerPath,
      dbPath,
      network,
      rpcURL,
      port,
      metricsPort,
    });
  }

  public static async createExisting({
    resourceType,
    name,
    dataPath,
  }: ExistingNEOTrackerResourceOptions): Promise<NEOTrackerResource> {
    const neotrackerPath = this.getNEOTrackerPath(dataPath);
    const dbPath = this.getDBPath(dataPath);
    const { network, rpcURL, port, metricsPort } = await fs.readJSON(neotrackerPath);

    return new NEOTrackerResource({
      resourceType,
      name,
      dataPath,
      neotrackerPath,
      dbPath,
      network,
      rpcURL,
      port,
      metricsPort,
    });
  }

  private static getNEOTrackerPath(dataPath: string): string {
    return path.resolve(dataPath, NEOTRACKER_PATH);
  }

  private static getDBPath(dataPath: string): string {
    return path.resolve(dataPath, DB_PATH);
  }

  public readonly resource$: Observable<NEOTracker>;
  private readonly resourceType: NEOTrackerResourceType;
  private readonly name: string;
  private readonly dataPath: string;
  private readonly neotrackerPath: string;
  private readonly dbPath: string;
  private readonly network: NetworkType;
  private readonly rpcURL: string;
  private readonly port: number;
  private readonly metricsPort: number;
  private mutableProcess: execa.ExecaChildProcess | undefined;
  private mutableRestarts = 3;

  public constructor({
    resourceType,
    name,
    network,
    rpcURL,
    port,
    dataPath,
    neotrackerPath,
    dbPath,
    metricsPort,
  }: NEOTrackerResourceOptions) {
    this.resourceType = resourceType;
    this.name = name;
    this.dataPath = dataPath;
    this.neotrackerPath = neotrackerPath;
    this.dbPath = dbPath;
    this.network = network;
    this.rpcURL = rpcURL;
    this.port = port;
    this.metricsPort = metricsPort;

    this.resource$ = concat(
      of({
        ...this.toResource(),
        live: false,
      }),
      timer(0, 500).pipe(
        concatMap(async () => {
          const live = await this.isLive();

          return {
            ...this.toResource(),
            live,
          };
        }),
      ),
    ).pipe(shareReplay(1));
  }

  public async create(): Promise<void> {
    await fs.ensureDir(path.dirname(this.neotrackerPath));
    await fs.writeJSON(this.neotrackerPath, {
      network: this.network,
      rpcURL: this.rpcURL,
      port: this.port,
      metricsPort: this.metricsPort,
    });
  }

  public async delete(): Promise<void> {
    await fs.remove(this.dataPath);
  }

  public async start(): Promise<void> {
    if (this.mutableProcess === undefined) {
      const child = execa(
        'neotracker',
        [
          '--network',
          this.network,
          '--rpc-url',
          this.rpcURL,
          '--db-file',
          this.dbPath,
          '--port',
          `${this.port}`,
          '--metrics-port',
          `${this.metricsPort}`,
        ],
        {
          // @ts-ignore
          windowsHide: true,
          stdio: 'pipe',
          localDir: __dirname,
        },
      );

      this.mutableProcess = child;

      const restart = () => {
        if (this.mutableRestarts > 0) {
          this.mutableRestarts -= 1;
          this.start().catch(() => {
            // do nothing
          });
        }
      };

      child.stdout.on('data', (value: Buffer) => {
        this.monitor.log({
          name: 'neotracker_stdout',
          message: value.toString('utf8'),
        });
      });

      child.stderr.on('data', (value: Buffer) => {
        this.monitor.log({
          name: 'neotracker_stderr',
          message: value.toString('utf8'),
        });
      });

      // tslint:disable-next-line no-floating-promises
      child
        .then(() => {
          this.monitor.log({
            name: 'neo_neotracker_exit',
            message: 'Child process exited',
          });

          this.mutableProcess = undefined;

          restart();
        })
        .catch((error: execa.ExecaError) => {
          this.monitor.logError({
            name: 'neo_neotracker_error',
            message: `Child process exited with an error. ${error.message}\n${error.stdout}\n${error.stderr}`,
            error,
          });

          this.mutableProcess = undefined;
        });
    }
  }

  public async stop(): Promise<void> {
    this.mutableRestarts = 3;
    const child = this.mutableProcess;
    this.mutableProcess = undefined;
    if (child !== undefined) {
      await killProcess(child.pid);
    }
  }

  public getDebug(): DescribeTable {
    const table: ReadonlyArray<readonly [string, string]> = [['Data Path', this.dataPath] as const];

    return table.concat(
      Object.entries(this.toResource())
        .filter(([, val]) => typeof val !== 'function')
        .map<readonly [string, string]>(
          ([key, val]) => [key, typeof val === 'string' ? val : JSON.stringify(val, undefined, 2)] as const,
        ),
    );
  }

  private async isLive(): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${this.port}/healthcheck`);

      return response.ok;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') {
        this.monitor.withData({ [this.monitor.labels.HTTP_PATH]: 'healthcheck' }).logError({
          name: 'http_client_request',
          message: 'NEO Tracker health check failed.',
          error,
        });
      }

      return false;
    }
  }

  private get monitor(): Monitor {
    return this.resourceType.plugin.monitor;
  }

  private readonly reset = async () => {
    await this.stop();
    await fs.remove(this.dbPath);
    await this.start();
  };

  private toResource(): OmitStrict<NEOTracker, 'live'> {
    return {
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name: this.name,
      baseName: this.name,
      state: 'started',
      neotrackerPath: this.neotrackerPath,
      dbPath: this.dbPath,
      network: this.network,
      rpcURL: this.rpcURL,
      port: this.port,
      metricsPort: this.metricsPort,
      reset: this.reset,
      url: `http://localhost:${this.port}`,
    };
  }
}
