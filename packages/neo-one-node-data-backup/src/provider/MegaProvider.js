/* @flow */
import { File, Storage } from 'megajs';
import type { Monitor } from '@neo-one/monitor';

import fs from 'fs';
import path from 'path';

import type { Environment } from '../types';
import Provider from './Provider';

import extract from './extract';
import upload from './upload';

export type Options = {|
  download?: {|
    id: string,
    key: string,
    writeBytesPerSecond: number,
  |},
  upload?: {|
    email: string,
    password: string,
    file: string,
  |},
|};

export default class MegaProvider extends Provider {
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
    const { download } = this._options;
    if (download == null) {
      return false;
    }

    const { id, key } = download;
    const file = new File({ downloadID: id, key });
    return new Promise(resolve => {
      file.loadAttributes(err => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async restore(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.withLabels({
      provider: 'mega_provider',
    });
    const { download } = this._options;
    if (download == null) {
      return;
    }

    const { id, key, writeBytesPerSecond } = download;
    const { dataPath, tmpPath } = this._environment;
    const downloadPath = path.resolve(tmpPath, 'storage.db.tar.gz');

    await monitor.captureSpan(
      span =>
        span.captureLogSingle(
          () =>
            new Promise((resolve, reject) => {
              const read = new File({
                downloadID: id,
                key,
              }).download();
              const write = fs.createWriteStream(downloadPath);

              let done = false;
              const cleanup = () => {
                done = true;
              };

              const onDone = () => {
                if (!done) {
                  cleanup();
                  resolve();
                }
              };

              const onError = (error: Error) => {
                if (!done) {
                  cleanup();
                  reject(error);
                }
              };

              read.once('error', onError);
              write.once('error', onError);
              write.once('finish', onDone);

              read.pipe(write);
            }),
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
    const monitor = monitorIn.withLabels({
      provider: 'mega_provider',
    });
    const { upload: uploadOptions } = this._options;
    if (uploadOptions == null) {
      return;
    }
    const { email, password, file } = uploadOptions;
    const { dataPath } = this._environment;

    await monitor.captureSpan(
      span =>
        span.captureLogSingle(
          async () => {
            const storage = new Storage({
              email,
              password,
              autologin: false,
            });
            await new Promise((resolve, reject) =>
              storage.login(innerErr => {
                if (innerErr) {
                  reject(innerErr);
                } else {
                  resolve();
                }
              }),
            );
            await upload({
              dataPath,
              write: storage.upload(file),
            });
          },
          {
            name: 'backup_push',
            message: 'Backup pushed.',
            error: 'Failed to push backup.',
          },
        ),
      {
        name: 'backup_push',
        help: 'Push backup duration',
      },
    );
  }
}
