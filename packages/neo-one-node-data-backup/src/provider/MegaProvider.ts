import { Monitor } from '@neo-one/monitor';
import * as fs from 'fs';
import * as path from 'path';
import { Environment } from '../types';
import { extract } from './extract';
import { Provider } from './Provider';
import { upload } from './upload';

export interface Options {
  readonly download?: {
    readonly id: string;
    readonly key: string;
    readonly writeBytesPerSecond: number;
  };

  readonly upload?: {
    readonly email: string;
    readonly password: string;
    readonly file: string;
  };
}

export class MegaProvider extends Provider {
  private readonly environment: Environment;
  private readonly options: Options;

  public constructor({ environment, options }: { readonly environment: Environment; readonly options: Options }) {
    super();
    this.environment = environment;
    this.options = options;
  }

  public async canRestore(): Promise<boolean> {
    const { download } = this.options;
    if (download === undefined) {
      return false;
    }

    const { id, key } = download;
    const mega = await this.getMega();
    const file = new mega.File({ downloadID: id, key });

    return new Promise<boolean>((resolve) => {
      file.loadAttributes((err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  public async restore(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.at('mega_provider');
    const { download } = this.options;
    if (download === undefined) {
      return;
    }

    const { id, key, writeBytesPerSecond } = download;
    const { dataPath, tmpPath } = this.environment;
    const downloadPath = path.resolve(tmpPath, 'storage.db.tar.gz');

    await monitor.captureSpanLog(
      async () => {
        const mega = await this.getMega();

        return new Promise<void>((resolve, reject) => {
          const read = new mega.File({
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
        });
      },
      {
        name: 'neo_restore_download',
      },
    );

    await monitor.captureSpanLog(
      async () =>
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

  public async backup(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.at('mega_provider');
    const { upload: uploadOptions } = this.options;
    if (uploadOptions === undefined) {
      return;
    }
    const { email, password, file } = uploadOptions;
    const { dataPath } = this.environment;

    await monitor.captureSpanLog(
      async () => {
        const mega = await this.getMega();
        const storage = new mega.Storage({
          email,
          password,
          autologin: false,
        });

        await new Promise<void>((resolve, reject) =>
          storage.login((innerErr) => {
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
          fileList: ['.'],
        });
      },
      {
        name: 'neo_backup_push',
      },
    );
  }

  private async getMega() {
    return import('megajs');
  }
}
