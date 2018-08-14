import Storage, { File } from '@google-cloud/storage';
import { Monitor } from '@neo-one/monitor';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Environment } from '../types';
import { extract } from './extract';
import { Provider } from './Provider';
import { upload } from './upload';

export interface Options {
  readonly projectID: string;
  readonly bucket: string;
  readonly prefix: string;
  readonly writeBytesPerSecond: number;
  readonly keepBackupCount?: number;
  readonly maxSizeBytes?: number;
}

const METADATA_NAME = 'metadata';
const MAX_SIZE = 1_000_000_000;
const KEEP_BACKUP_COUNT = 10;

const extractTime = (prefix: string, file: File) => parseInt(file.name.slice(prefix.length).split('/')[1], 10);

export class GCloudProvider extends Provider {
  private readonly environment: Environment;
  private readonly options: Options;

  public constructor({ environment, options }: { readonly environment: Environment; readonly options: Options }) {
    super();
    this.environment = environment;
    this.options = options;
  }

  public async canRestore(): Promise<boolean> {
    const { time } = await this.getLatestTime();

    return time !== undefined;
  }

  public async restore(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.at('gcloud_provider');
    const { prefix, writeBytesPerSecond } = this.options;
    const { dataPath, tmpPath } = this.environment;

    const { time, files } = await this.getLatestTime();
    if (time === undefined) {
      throw new Error('Cannot restore');
    }

    const filePrefix = [prefix, time].join('/');
    const fileAndPaths = files
      .filter((file) => file.name.startsWith(filePrefix) && path.basename(file.name) !== METADATA_NAME)
      .map((file) => ({
        file,
        filePath: path.resolve(tmpPath, path.basename(file.name)),
      }));

    // tslint:disable-next-line no-loop-statement
    for (const { file, filePath } of fileAndPaths) {
      await monitor
        .withData({ filePath })
        .captureSpanLog(async () => file.download({ destination: filePath, validation: true }), {
          name: 'neo_restore_download',
        });
    }

    await Promise.all(
      fileAndPaths.map(async ({ filePath }) =>
        monitor.withData({ filePath }).captureSpanLog(
          async () =>
            extract({
              downloadPath: filePath,
              dataPath,
              writeBytesPerSecond,
            }),
          { name: 'neo_restore_extract' },
        ),
      ),
    );
  }

  public async backup(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.at('gcloud_provider');
    const { bucket, prefix, keepBackupCount = KEEP_BACKUP_COUNT, maxSizeBytes = MAX_SIZE } = this.options;
    const { dataPath } = this.environment;

    const files = await fs.readdir(dataPath);
    const fileAndStats = await Promise.all(
      files.map(async (file) => {
        const stat = await fs.stat(path.resolve(dataPath, file));

        return { file, stat };
      }),
    );

    const mutableFileLists = [];
    let mutableCurrentFileList = [];
    let currentSize = 0;
    // tslint:disable-next-line no-loop-statement
    for (const { file, stat } of fileAndStats) {
      if (currentSize > maxSizeBytes) {
        mutableFileLists.push(mutableCurrentFileList);
        mutableCurrentFileList = [];
        currentSize = 0;
      }

      mutableCurrentFileList.push(file);
      currentSize += stat.size;
    }

    if (mutableCurrentFileList.length > 0) {
      mutableFileLists.push(mutableCurrentFileList);
    }

    const storage = await this.getStorage();
    const time = Math.round(Date.now() / 1000);
    // tslint:disable-next-line no-loop-statement
    for (const [idx, fileList] of mutableFileLists.entries()) {
      await monitor.withData({ part: idx }).captureSpanLog(
        async () =>
          upload({
            dataPath,
            write: storage
              .bucket(bucket)
              .file([prefix, `${time}`, `storage_part_${idx}.db.tar.gz`].join('/'))
              .createWriteStream({ validation: true }),
            fileList,
          }),
        { name: 'neo_backup_push' },
      );
    }

    await monitor.captureSpanLog<Promise<void>>(
      async () =>
        storage
          .bucket(bucket)
          .file([prefix, `${time}`, METADATA_NAME].join('/'))
          .save(''),
      { name: 'neo_backup_push' },
    );

    const [fileNames] = await monitor.captureSpanLog(async () => storage.bucket(bucket).getFiles({ prefix }), {
      name: 'neo_backup_list_files',
    });
    const times = [...new Set(fileNames.map((file) => extractTime(prefix, file)))];
    // tslint:disable-next-line no-array-mutation
    times.sort();

    const deleteTimes = times.slice(0, -keepBackupCount);
    await monitor.captureSpanLog<Promise<void[]>>(
      async () =>
        Promise.all(
          deleteTimes.map(async (deleteTime) =>
            storage.bucket(bucket).deleteFiles({ prefix: [prefix, `${deleteTime}`].join('/') }),
          ),
        ),
      { name: 'neo_backup_delete_old' },
    );
  }

  private async getLatestTime(): Promise<{
    readonly time: number | undefined;
    readonly files: ReadonlyArray<File>;
  }> {
    const { bucket, prefix } = this.options;

    const storage = await this.getStorage();
    const [files] = await storage.bucket(bucket).getFiles({ prefix });

    const metadataTimes = files
      .filter((file) => path.basename(file.name) === METADATA_NAME)
      .map((file) => extractTime(prefix, file));
    // tslint:disable-next-line no-array-mutation
    metadataTimes.sort();

    const time = metadataTimes[metadataTimes.length - 1] as number | undefined;

    return { time, files };
  }

  private async getStorage() {
    const storage = await import('@google-cloud/storage');

    // tslint:disable-next-line no-any
    return (storage as any).default({ projectId: this.options.projectID }) as Storage;
  }
}
