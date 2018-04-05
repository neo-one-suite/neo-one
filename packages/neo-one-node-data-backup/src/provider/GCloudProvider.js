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
    const monitor = monitorIn.at('gcloud_provider');
    const { projectID, bucket, file, writeBytesPerSecond } = this._options;
    const { dataPath, tmpPath } = this._environment;
    const downloadPath = path.resolve(tmpPath, 'storage.db.tar.gz');

    const storage = new Storage({ projectId: projectID });
    await monitor.captureSpanLog(
      () =>
        storage
          .bucket(bucket)
          .file(file)
          .download({ destination: downloadPath, validation: true }),
      {
        name: 'neo_restore_download',
      },
    );

    await monitor.captureSpanLog(
      () =>
        extract({
          downloadPath,
          dataPath,
          writeBytesPerSecond,
        }),
      {
        name: 'neo_restore_extract',
      },
    );
  }

  async backup(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.at('gcloud_provider');
    const { projectID, bucket, file } = this._options;
    const { dataPath } = this._environment;

    const storage = new Storage({ projectId: projectID });

    await monitor.captureSpanLog(
      () =>
        upload({
          dataPath,
          write: storage
            .bucket(bucket)
            .file(file)
            .createWriteStream({ validation: true }),
        }),
      {
        name: 'neo_backup_push',
      },
    );
  }
}
