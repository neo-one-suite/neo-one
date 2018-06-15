import Storage from '@google-cloud/storage';
import { Monitor } from '@neo-one/monitor';
import path from 'path';
import { Environment } from '../types';
import { extract } from './extract';
import { Provider } from './Provider';
import { upload } from './upload';

export interface Options {
  readonly projectID: string;
  readonly bucket: string;
  readonly file: string;
  readonly writeBytesPerSecond: number;
}

export class GCloudProvider extends Provider {
  private readonly environment: Environment;
  private readonly options: Options;

  public constructor({ environment, options }: { readonly environment: Environment; readonly options: Options }) {
    super();
    this.environment = environment;
    this.options = options;
  }

  public async canRestore(): Promise<boolean> {
    const { projectID, bucket, file } = this.options;
    const storage = Storage({ projectId: projectID });
    const result = await storage
      .bucket(bucket)
      .file(file)
      .exists();

    return result[0];
  }

  public async restore(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.at('gcloud_provider');
    const { projectID, bucket, file, writeBytesPerSecond } = this.options;
    const { dataPath, tmpPath } = this.environment;
    const downloadPath = path.resolve(tmpPath, 'storage.db.tar.gz');

    const storage = Storage({ projectId: projectID });
    await monitor.captureSpanLog(
      async () =>
        storage
          .bucket(bucket)
          .file(file)
          .download({ destination: downloadPath, validation: true }),
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
    const monitor = monitorIn.at('gcloud_provider');
    const { projectID, bucket, file } = this.options;
    const { dataPath } = this.environment;

    const storage = Storage({ projectId: projectID });

    await monitor.captureSpanLog(
      async () =>
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
