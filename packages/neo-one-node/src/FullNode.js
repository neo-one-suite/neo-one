/* @flow */
import {
  type BackupRestoreEnvironment,
  type BackupRestoreOptions,
  backup,
  restore,
} from '@neo-one/node-data-backup';
import type { Subscription } from 'rxjs/Subscription';

import path from 'path';

import fullNode$, { type FullNodeOptions } from './fullNode$';
import getDataPath from './getDataPath';

export default class FullNode {
  _options: FullNodeOptions;
  _onError: ?(error: Error) => void;
  _subscription: ?Subscription;

  constructor(options: FullNodeOptions, onError?: (error: Error) => void) {
    this._options = options;
    this._onError = onError;
    this._subscription = null;
  }

  get dataPath(): string {
    return getDataPath(this._options.environment.dataPath);
  }

  start(): void {
    if (this._subscription == null) {
      let observer;
      if (this._onError != null) {
        const onError = this._onError;
        observer = ({
          error: onError,
          complete: () => onError(new Error('Unexpected end')),
        }: $FlowFixMe);
      }
      this._subscription = fullNode$(this._options).subscribe(observer);
    }
  }

  stop(): void {
    if (this._subscription != null) {
      this._subscription.unsubscribe();
      this._subscription = null;
    }
  }

  async backup(options: BackupRestoreOptions): Promise<void> {
    if (this._subscription != null) {
      throw new Error('Cannot backup while running.');
    }

    await backup({
      monitor: this._options.monitor,
      environment: this._getBackupEnvironment(),
      options,
    });
  }

  async restore(options: BackupRestoreOptions): Promise<void> {
    if (this._subscription != null) {
      throw new Error('Cannot backup while running.');
    }

    await restore({
      monitor: this._options.monitor,
      environment: this._getBackupEnvironment(),
      options,
    });
  }

  _getBackupEnvironment(): BackupRestoreEnvironment {
    const dataPath = getDataPath(this._options.environment.dataPath);
    return {
      dataPath,
      tmpPath: path.resolve(this._options.environment.dataPath, 'tmp'),
      readyPath: path.resolve(this._options.environment.dataPath, 'data.ready'),
    };
  }
}
