import { globalStats, startTracing } from '@neo-one/client-switch';
import { Blockchain } from '@neo-one/node-blockchain';
import { Settings } from '@neo-one/node-core';
import { backup, BackupRestoreOptions, restore } from '@neo-one/node-data-backup';
import { rpcServer$, RPCServerEnvironment, RPCServerOptions } from '@neo-one/node-http-rpc';
import { Network, NetworkEnvironment, NetworkOptions } from '@neo-one/node-network';
import { dumpChain, loadChain } from '@neo-one/node-offline';
import { Node, NodeEnvironment, NodeOptions } from '@neo-one/node-protocol';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import { finalize, neverComplete } from '@neo-one/utils';
import { JaegerTraceExporter } from '@opencensus/exporter-jaeger';
import { PrometheusStatsExporter } from '@opencensus/exporter-prometheus';
import { AbstractLevelDOWN } from 'abstract-leveldown';
import LevelDOWN, { LevelDownOpenOptions } from 'leveldown';
import LevelUp from 'levelup';
import * as cron from 'node-cron';
import * as path from 'path';
import { concat, defer, EMPTY, Observable, Observer, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap, take } from 'rxjs/operators';
import { getDataPath } from './getDataPath';

export interface BackupEnvironment {
  readonly tmpPath?: string;
  readonly readyPath?: string;
}

export interface BackupOptions {
  readonly provider: BackupRestoreOptions;
  readonly restore?: boolean;
  readonly cronSchedule?: string;
}

interface TelemetryEnvironment {
  readonly port: number;
}

interface TracingEnvironment {
  readonly port: number;
}

export interface BaseEnvironment {
  readonly dataPath: string;
  readonly chainFile?: string;
  readonly dumpChainFile?: string;
  readonly haltOnSync?: boolean;
  readonly levelDownOptions?: LevelDownOpenOptions;
  readonly telemetry?: TelemetryEnvironment;
  readonly tracing?: TracingEnvironment;
}

export interface Environment extends BaseEnvironment {
  readonly rpc: RPCServerEnvironment;
  readonly node?: NodeEnvironment;
  readonly network?: NetworkEnvironment;
  readonly backup?: BackupEnvironment;
}

export interface Options {
  readonly node?: NodeOptions;
  readonly network?: NetworkOptions;
  readonly rpc?: RPCServerOptions;
  readonly backup?: BackupOptions;
}

export interface FullNodeOptions {
  readonly settings: Settings;
  readonly environment: Environment;
  readonly options$: Observable<Options>;
  readonly leveldown?: AbstractLevelDOWN;
}

export const fullNode$ = ({
  settings,
  environment,
  options$,
  leveldown: customLeveldown,
}: // tslint:disable-next-line no-any
FullNodeOptions): Observable<any> => {
  const dataPath = getDataPath(environment.dataPath);

  const { backup: backupEnv = {} } = environment;
  const backupEnvironment = {
    dataPath,
    tmpPath: backupEnv.tmpPath === undefined ? path.resolve(environment.dataPath, 'tmp') : backupEnv.tmpPath,
    readyPath:
      backupEnv.readyPath === undefined ? path.resolve(environment.dataPath, 'data.ready') : backupEnv.readyPath,
  };

  const restore$ = defer(async () => options$.pipe(take(1)).toPromise()).pipe(
    switchMap((options) => {
      const backupOptions = options.backup;
      if (backupOptions !== undefined && backupOptions.restore) {
        return defer(async () =>
          restore({
            environment: backupEnvironment,
            options: backupOptions.provider,
          }),
        );
      }

      return EMPTY;
    }),
  );

  const node$ = defer(async () => {
    if (environment.telemetry !== undefined) {
      const exporter = new PrometheusStatsExporter({
        port: environment.telemetry.port,
        startServer: true,
      });

      globalStats.registerExporter(exporter);
      finalize(() => {
        exporter.stopServer();
        globalStats.unregisterExporter(exporter);
      });
    }

    if (environment.tracing !== undefined) {
      const exporter = new JaegerTraceExporter({
        serviceName: 'NEO-ONE',
        host: 'localhost',
        port: environment.tracing.port,
        bufferTimeout: 100,
      });

      const stopTracing = startTracing(exporter);
      finalize(stopTracing);
    }

    let levelDown = customLeveldown;
    if (levelDown === undefined) {
      const levelDownToOpen = LevelDOWN(dataPath);
      const { levelDownOptions } = environment;
      if (levelDownOptions !== undefined) {
        await new Promise<void>((resolve, reject) => {
          levelDownToOpen.open(levelDownOptions, (err: Error | undefined) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
      levelDown = levelDownToOpen;
      finalize(
        async () =>
          new Promise<void>((resolve) => {
            levelDownToOpen.close(() => {
              resolve();
            });
          }),
      );
    }

    const storage = levelupStorage({
      db: LevelUp(levelDown),
      context: { messageMagic: settings.messageMagic },
    });

    const blockchain = await Blockchain.create({
      settings,
      storage,
      vm,
    });

    if (environment.chainFile !== undefined) {
      await loadChain({
        chain: { format: 'raw', path: environment.chainFile },
        blockchain,
      });
    }

    if (environment.dumpChainFile !== undefined) {
      await dumpChain({
        path: environment.dumpChainFile,
        blockchain,
      });
    }

    return { blockchain, storage };
  }).pipe(
    neverComplete(),
    finalize(async (result) => {
      if (result !== undefined) {
        await result.blockchain.stop();
        await result.storage.close();
      }
    }),
    distinctUntilChanged((a, b) => a.blockchain === b.blockchain),
    switchMap(({ blockchain }) => {
      const node = new Node({
        blockchain,
        environment: environment.node,
        options$: options$.pipe(
          map(({ node: nodeOptions = {} }) => nodeOptions),
          distinctUntilChanged(),
        ),
        createNetwork: (options) =>
          new Network({
            environment: environment.network,
            options$: options$.pipe(
              map(({ network: networkOptions = {} }) => networkOptions),
              distinctUntilChanged(),
            ),
            ...options,
          }),
      });

      return node.start$().pipe(map(() => ({ blockchain, node })));
    }),
    distinctUntilChanged((a, b) => a.blockchain === b.blockchain && a.node === b.node),
    switchMap(({ node, blockchain }) =>
      rpcServer$({
        blockchain,
        node,
        environment: environment.rpc,
        options$: options$.pipe(
          map(({ rpc = {} }) => rpc),
          distinctUntilChanged(),
        ),
      }),
    ),
  );

  const start$ = options$.pipe(
    map((options) => options.backup),
    distinctUntilChanged(),
    switchMap((backupOptionsIn) => {
      const backupOptions = backupOptionsIn;
      if (backupOptions === undefined || backupOptions.cronSchedule === undefined) {
        return node$;
      }

      const { cronSchedule } = backupOptions;

      return new Observable((observer: Observer<{ type: 'start' } | { type: 'backup' }>) => {
        observer.next({ type: 'start' });
        const task = cron.schedule(cronSchedule, () => observer.next({ type: 'backup' }));

        task.start();

        return {
          unsubscribe: () => {
            task.destroy();
          },
        };
      }).pipe(
        switchMap(({ type }) => {
          if (type === 'start') {
            return node$;
          }

          // Give some time to shutdown
          return timer(5000).pipe(
            switchMap(() =>
              defer(async () => {
                await backup({
                  environment: backupEnvironment,
                  options: backupOptions.provider,
                });
              }),
            ),

            switchMap(() => node$),
          );
        }),
      );
    }),
  );

  return concat(restore$, start$);
};
