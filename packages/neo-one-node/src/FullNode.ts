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

  public constructor(options: FullNodeOptions, onError?: ((error: Error) => void)) {
    this.options = options;
    this.onError = onError;
  }

  public get dataPath(): string {
    return getDataPath(this.options.environment.dataPath);
  }

  public start(): void {
    if (this.mutableSubscription === undefined) {
      let observer;
      if (this.onError !== undefined) {
        const onError = this.onError;
        observer = {
          error: onError,
          complete: () => onError(new Error('Unexpected end')),
        };
      }
      this.mutableSubscription = fullNode$(this.options).subscribe(observer);
    }
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
