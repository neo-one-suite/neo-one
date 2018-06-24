import Storage from '@google-cloud/storage';
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
}

const METADATA_NAME = 'metadata';
const MAX_SIZE = 1_000_000_000;

export class GCloudProvider extends Provider {
  private readonly environment: Environment;
  private readonly options: Options;

  public constructor({ environment, options }: { readonly environment: Environment; readonly options: Options }) {
    super();
    this.environment = environment;
    this.options = options;
  }

  public async canRestore(): Promise<boolean> {
    const { projectID, bucket, prefix } = this.options;
    const storage = Storage({ projectId: projectID });
    const result = await storage
      .bucket(bucket)
      .file(path.resolve(prefix, METADATA_NAME))
      .exists();

    return result[0];
  }

  public async restore(monitorIn: Monitor): Promise<void> {
    const monitor = monitorIn.at('gcloud_provider');
    const { projectID, bucket, prefix, writeBytesPerSecond } = this.options;
    const { dataPath, tmpPath } = this.environment;

    const storage = Storage({ projectId: projectID });

    const [files] = await monitor.captureSpanLog(async () => storage.bucket(bucket).getFiles({ prefix }), {
      name: 'neo_restore_list_files',
    });

    const fileAndPaths = files.filter((file) => path.basename(file.name) !== METADATA_NAME).map((file) => ({
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
    const { projectID, bucket, prefix } = this.options;
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
      if (currentSize > MAX_SIZE) {
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

    const storage = Storage({ projectId: projectID });
    // tslint:disable-next-line no-loop-statement
    for (const [idx, fileList] of mutableFileLists.entries()) {
      await monitor.withData({ part: idx }).captureSpanLog(
        async () =>
          upload({
            dataPath,
            write: storage
              .bucket(bucket)
              .file(path.resolve(prefix, `storage_part_${idx}.db.tar.gz`))
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
          .file(path.resolve(prefix, METADATA_NAME))
          .save(''),
      { name: 'neo_backup_push' },
    );
  }
}
