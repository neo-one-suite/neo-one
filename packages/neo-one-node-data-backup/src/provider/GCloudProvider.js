/* @flow */
import type { Monitor } from '@neo-one/monitor';
import Storage from '@google-cloud/storage';

import path from 'path';

import type { Environment } from '../types';
import Provider from './Provider';

import extract from './extract';
import upload from './upload';

export type Options = {|
  projectID: string,
  bucket: string,
  file: string,
  writeBytesPerSecond: number,
|};

export default class GCloudProvider extends Provider {
  _environment: Environment;
  _options: Options;

  constructor({
    environment,
    options,
  }: {|
    environment: Environment,
    options: Options,
  |}) {
    super();
    this._environment = environment;
    this._options = options;
  }

  async canRestore(): Promise<boolean> {
    const { projectID, bucket, file } = this._options;
    const storage = new Storage({ projectId: projectID });
    const result = await storage
      .bucket(bucket)
      .file(file)
      .exists();
    return result[0];
  }

  async restore(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.withLabels({ provider: 'gcloud_provider' });
    const { projectID, bucket, file, writeBytesPerSecond } = this._options;
    const { dataPath, tmpPath } = this._environment;
    const downloadPath = path.resolve(tmpPath, 'storage.db.tar.gz');

    const storage = new Storage({ projectId: projectID });
    await monitor.captureSpan(
      span =>
        span.captureLogSingle(
          () =>
            storage
              .bucket(bucket)
              .file(file)
              .download({ destination: downloadPath, validation: true }),
          {
            name: 'restore_download',
            message: 'Backup downloaded',
            error: 'Failed to download backup.',
          },
        ),
      {
        name: 'restore_download',
        help: 'Restore from backup duration',
      },
    );

    await monitor.captureSpan(
      span =>
        span.captureLogSingle(
          () =>
            extract({
              downloadPath,
              dataPath,
              writeBytesPerSecond,
            }),
          {
            name: 'restore_extract',
            message: 'Backup extracted',
            error: 'Failed to extract backup',
          },
        ),
      {
        name: 'restore_extract',
        help: 'Extract backup duration',
      },
    );
  }

  async backup(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.withLabels({ provider: 'gcloud_provider' });
    const { projectID, bucket, file } = this._options;
    const { dataPath } = this._environment;

    const storage = new Storage({ projectId: projectID });

    await monitor.captureSpan(
      span =>
        span.captureLogSingle(
          () =>
            upload({
              dataPath,
              write: storage
                .bucket(bucket)
                .file(file)
                .createWriteStream({ validation: true }),
            }),
          {
            name: 'backup_push',
            message: 'Backup pushed',
            error: 'Failed to push backup',
          },
        ),
      {
        name: 'backup_push',
        help: 'Push backup duration',
      },
    );
  }
}
