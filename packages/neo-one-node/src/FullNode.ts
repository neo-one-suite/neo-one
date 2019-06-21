import { backup, BackupRestoreEnvironment, BackupRestoreOptions, restore } from '@neo-one/node-data-backup';
import { finalize } from '@neo-one/utils';
import fetch from 'cross-fetch';
import * as path from 'path';
import { interval, Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { fullNode$, FullNodeOptions } from './fullNode$';
import { getDataPath } from './getDataPath';

export class FullNode {
  private readonly options: FullNodeOptions;
  private readonly onError: ((error: Error) => void) | undefined;
  private mutableSubscription: Subscription | undefined;
  private mutableWatcher: Subscription | undefined;

  public constructor(options: FullNodeOptions, onError?: (error: Error) => void) {
    this.options = options;
    this.onError = onError;
  }

  public get dataPath(): string {
    return getDataPath(this.options.environment.dataPath);
  }

  public async start(): Promise<void> {
    if (this.mutableSubscription === undefined) {
      let resolved = false;

      return new Promise<void>((resolve, reject) => {
        const handleError = (error: Error) => {
          if (resolved) {
            if (this.onError !== undefined) {
              this.onError(error);
            }
          } else {
            resolved = true;
            reject(error);
          }
        };

        if (this.options.environment.haltOnSync) {
          const port = this.getRPCPort();

          this.mutableWatcher = interval(5000)
            .pipe(
              switchMap(async () => {
                try {
                  const response = await fetch(`http://localhost:${port}/ready_health_check`);
                  if (response.status === 200) {
                    await this.stop(true);
                  }
                } catch {
                  // do nothing
                }
              }),
            )
            .subscribe();
        }
        this.mutableSubscription = fullNode$(this.options).subscribe({
          next: () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          },
          error: handleError,
          complete: () => {
            handleError(new Error('Unexpected end'));
          },
        });
      });
    }

    return Promise.resolve();
  }

  public async stop(halted?: boolean): Promise<void> {
    if (this.mutableWatcher !== undefined) {
      this.mutableWatcher.unsubscribe();
      this.mutableWatcher = undefined;
    }

    if (this.mutableSubscription !== undefined) {
      this.mutableSubscription.unsubscribe();
      this.mutableSubscription = undefined;
      await finalize.wait();
    }

    if (halted) {
      const options = await this.options.options$.pipe(take(1)).toPromise();
      const backupOptions = options.backup !== undefined ? options.backup.provider : undefined;
      if (backupOptions !== undefined) {
        await this.backup(backupOptions);
      }
    }
  }

  public async backup(options: BackupRestoreOptions): Promise<void> {
    if (this.mutableSubscription !== undefined) {
      throw new Error('Cannot backup while running.');
    }

    await backup({
      monitor: this.options.monitor,
      environment: this.getBackupEnvironment(),
      options,
    });
  }

  public async restore(options: BackupRestoreOptions): Promise<void> {
    if (this.mutableSubscription !== undefined) {
      throw new Error('Cannot backup while running.');
    }

    await restore({
      monitor: this.options.monitor,
      environment: this.getBackupEnvironment(),
      options,
    });
  }

  private getRPCPort(): number {
    const rpcOptions = this.options.environment.rpc;

    return rpcOptions.http !== undefined
      ? rpcOptions.http.port
      : rpcOptions.https !== undefined
      ? rpcOptions.https.port
      : 8080;
  }

  private getBackupEnvironment(): BackupRestoreEnvironment {
    const dataPath = getDataPath(this.options.environment.dataPath);

    return {
      dataPath,
      tmpPath: path.resolve(this.options.environment.dataPath, 'tmp'),
      readyPath: path.resolve(this.options.environment.dataPath, 'data.ready'),
    };
  }
}
