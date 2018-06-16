import { Settings } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { Blockchain } from '@neo-one/node-blockchain';
import { backup, BackupRestoreOptions, restore } from '@neo-one/node-data-backup';
import { dumpChain, loadChain } from '@neo-one/node-offline';
import { Node, NodeEnvironment, NodeOptions } from '@neo-one/node-protocol';
import { rpcServer$, RPCServerEnvironment, RPCServerOptions } from '@neo-one/node-rpc';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import { finalize, neverComplete } from '@neo-one/utils';
// tslint:disable-next-line no-implicit-dependencies
import { AbstractLevelDOWN } from 'abstract-leveldown';
import LevelDOWN, { LevelDownOpenOptions } from 'leveldown';
import LevelUp from 'levelup';
import cron from 'node-cron';
import path from 'path';
import { concat, defer, Observable, Observer, timer } from 'rxjs';
import { concatMap, distinctUntilChanged, map, switchMap, take } from 'rxjs/operators';
import { getDataPath } from './getDataPath';

interface BackupEnvironment {
  readonly tmpPath?: string;
  readonly readyPath?: string;
}

interface BackupOptions {
  readonly restore: boolean;
  readonly backup?: {
    readonly cronSchedule: string;
  };

  readonly options: BackupRestoreOptions;
}

interface TelemetryEnvironment {
  readonly port: number;
}
export interface Environment {
  readonly dataPath: string;
  readonly rpc: RPCServerEnvironment;
  readonly levelDownOptions?: LevelDownOpenOptions;

  readonly node?: NodeEnvironment;
  readonly backup?: BackupEnvironment;
  readonly telemetry?: TelemetryEnvironment;
}
export interface Options {
  readonly node?: NodeOptions;
  readonly rpc?: RPCServerOptions;
  readonly backup?: BackupOptions;
}
export interface FullNodeOptions {
  readonly monitor: Monitor;
  readonly settings: Settings;
  readonly environment: Environment;
  readonly options$: Observable<Options>;
  readonly leveldown?: AbstractLevelDOWN;
  readonly chainFile?: string;
  readonly dumpChainFile?: string;
}

export const fullNode$ = ({
  monitor,
  settings,
  environment,
  options$,
  leveldown: customLeveldown,
  chainFile,
  dumpChainFile,
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

  const restore$ = defer(async () => {
    const options = await options$.pipe(take(1)).toPromise();
    if (options.backup !== undefined && options.backup.restore) {
      await restore({
        monitor,
        environment: backupEnvironment,
        options: options.backup.options,
      });
    }
  });

  const node$ = defer(async () => {
    if (environment.telemetry !== undefined) {
      monitor.serveMetrics(environment.telemetry.port);
    }

    const storage = levelupStorage({
      db: LevelUp(customLeveldown === undefined ? LevelDOWN(dataPath, environment.levelDownOptions) : customLeveldown),

      context: { messageMagic: settings.messageMagic },
    });

    const blockchain = await Blockchain.create({
      settings,
      storage,
      vm,
      monitor,
    });

    if (chainFile !== undefined) {
      await loadChain({
        chain: { format: 'raw', path: chainFile },
        blockchain,
      });
    }

    if (dumpChainFile !== undefined) {
      await dumpChain({
        path: dumpChainFile,
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
    switchMap(({ blockchain }) => {
      const node = new Node({
        monitor,
        blockchain,
        environment: environment.node,
        options$: options$.pipe(
          map(({ node: nodeOptions = {} }) => nodeOptions),
          distinctUntilChanged(),
        ),
      });

      return node.start$().pipe(map(() => ({ blockchain, node })));
    }),
    concatMap(({ node, blockchain }) =>
      rpcServer$({
        monitor,
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
      if (backupOptions === undefined || backupOptions.backup === undefined) {
        return node$;
      }

      const { cronSchedule } = backupOptions.backup;

      return Observable.create((observer: Observer<{ type: 'start' } | { type: 'backup' }>) => {
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
                  monitor,
                  environment: backupEnvironment,
                  options: backupOptions.options,
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
