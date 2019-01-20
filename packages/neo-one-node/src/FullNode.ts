import { backup, BackupRestoreEnvironment, BackupRestoreOptions, restore } from '@neo-one/node-data-backup';
import { finalize } from '@neo-one/utils';
import * as path from 'path';
import { Subscription } from 'rxjs';
import { fullNode$, FullNodeOptions } from './fullNode$';
import { getDataPath } from './getDataPath';

export class FullNode {
  private readonly options: FullNodeOptions;
  private readonly onError: ((error: Error) => void) | undefined;
  private mutableSubscription: Subscription | undefined;

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

  public async stop(): Promise<void> {
    if (this.mutableSubscription !== undefined) {
      this.mutableSubscription.unsubscribe();
      this.mutableSubscription = undefined;
      await finalize.wait();
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

  private getBackupEnvironment(): BackupRestoreEnvironment {
    const dataPath = getDataPath(this.options.environment.dataPath);

    return {
      dataPath,
      tmpPath: path.resolve(this.options.environment.dataPath, 'tmp'),
      readyPath: path.resolve(this.options.environment.dataPath, 'data.ready'),
    };
  }
}
