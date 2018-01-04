/* @flow */
import type { Log } from '@neo-one/utils';
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
  _log: Log;
  _environment: Environment;
  _options: Options;

  constructor({
    log,
    environment,
    options,
  }: {|
    log: Log,
    environment: Environment,
    options: Options,
  |}) {
    super();
    this._log = log;
    this._environment = environment;
    this._options = options;
  }

  async restore(): Promise<void> {
    const { projectID, bucket, file, writeBytesPerSecond } = this._options;
    const { dataPath, tmpPath } = this._environment;
    const downloadPath = path.resolve(tmpPath, 'storage.db.tar.gz');

    const storage = new Storage({ projectId: projectID });
    this._log({ event: 'DATA_BACKUP_GCLOUD_PROVIDER_RESTORE_DOWNLOAD' });
    try {
      await storage
        .bucket(bucket)
        .file(file)
        .download({ destination: downloadPath });
      this._log({
        event: 'DATA_BACKUP_GCLOUD_PROVIDER_RESTORE_DOWNLOAD_SUCCESS',
      });
    } catch (error) {
      this._log({
        event: 'DATA_BACKUP_GCLOUD_PROVIDER_RESTORE_DOWNLOAD_ERROR',
        error,
      });
      throw error;
    }

    this._log({ event: 'DATA_BACKUP_GCLOUD_PROVIDER_RESTORE_EXTRACT' });
    try {
      await extract({
        downloadPath,
        dataPath,
        writeBytesPerSecond,
      });
      this._log({
        event: 'DATA_BACKUP_GCLOUD_PROVIDER_RESTORE_EXTRACT_SUCCESS',
      });
    } catch (error) {
      this._log({
        event: 'DATA_BACKUP_GCLOUD_PROVIDER_RESTORE_EXTRACT_ERROR',
        error,
      });
      throw error;
    }
  }

  async backup(): Promise<void> {
    const { projectID, bucket, file } = this._options;
    const { dataPath } = this._environment;

    const storage = new Storage({ projectId: projectID });

    this._log({ event: 'DATA_BACKUP_GCLOUD_PROVIDER_BACKUP' });
    try {
      await upload({
        dataPath,
        write: storage
          .bucket(bucket)
          .file(file)
          .createWriteStream(),
      });
      this._log({ event: 'DATA_BACKUP_GCLOUD_PROVIDER_BACKUP_SUCCESS' });
    } catch (error) {
      this._log({ event: 'DATA_BACKUP_GCLOUD_PROVIDER_BACKUP_ERROR', error });
      throw error;
    }
  }
}
