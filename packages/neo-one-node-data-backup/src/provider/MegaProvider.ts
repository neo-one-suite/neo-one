import { nodeLogger } from '@neo-one/logger';
import * as fs from 'fs';
import * as path from 'path';
import { Environment } from '../types';
import { extract } from './extract';
import { Provider } from './Provider';
import { upload } from './upload';

const logger = nodeLogger.child({ component: 'mega_provider' });

export interface Options {
  readonly download?: {
    readonly id: string;
    readonly key: string;
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
    const file = new mega.File({ downloadId: id, key });

    return new Promise<boolean>((resolve) => {
      file.loadAttributes((err?: Error) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  public async restore(): Promise<void> {
    const { download } = this.options;
    if (download === undefined) {
      return;
    }

    const { id, key } = download;
    const { dataPath, tmpPath } = this.environment;
    const downloadPath = path.resolve(tmpPath, 'storage.db.tar.gz');

    try {
      const mega = await this.getMega();

      await new Promise<void>((resolve, reject) => {
        const read = new mega.File({
          downloadId: id,
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
      logger.info({ title: 'neo_restore_download' });
    } catch (error) {
      logger.error({ title: 'neo_restore_download', error });
      throw error;
    }

    try {
      await extract({ downloadPath, dataPath });
      logger.info({ title: 'neo_restore_extract' });
    } catch (error) {
      logger.error({ title: 'neo_restore_extract', error });
      throw error;
    }
  }

  public async backup(): Promise<void> {
    const { upload: uploadOptions } = this.options;
    if (uploadOptions === undefined) {
      return;
    }
    const { email, password, file } = uploadOptions;
    const { dataPath } = this.environment;

    try {
      const mega = await this.getMega();
      const storage = new mega.Storage({
        email,
        password,
        autologin: false,
      });

      await new Promise<void>((resolve, reject) =>
        storage.login((innerErr?: Error) => {
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
      logger.info({ title: 'neo_backup_push' });
    } catch (error) {
      logger.error({ title: 'neo_backup_push' }, error);
      throw error;
    }
  }

  private async getMega() {
    return import('megajs');
  }
}
