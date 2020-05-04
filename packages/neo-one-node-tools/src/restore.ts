import { Storage } from '@google-cloud/storage';
import execa from 'execa';
import fs from 'fs-extra';
import nodePath from 'path';

interface RestoreOptions {
  readonly path: string;
  readonly bucket: string;
  readonly folder: string;
}

const runRestore = ({ path, bucket, folder }: RestoreOptions) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

  return execa('gsutil', ['-m', 'rsync', '-r', `gs://${bucket}/${folder}`, path], {
    shell: true,
    stdio: 'inherit',
  });
};

const getLocalMTime = async (path: string) => {
  let stats: fs.Stats;
  try {
    stats = await fs.stat(nodePath.join(path, 'LOG'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Date(0);
    }

    throw error;
  }

  if (!stats.isFile()) {
    return new Date(0);
  }

  return stats.mtime;
};

const getCloudMTime = async (bucket: string, folder: string) => {
  const storage = new Storage();

  const [metadata] = await storage.bucket(bucket).file(nodePath.join(folder, 'LOG')).getMetadata();

  return new Date(metadata.updated);
};

export const restore = async ({ path, bucket, folder }: RestoreOptions) => {
  const [localMTime, cloudMTime] = await Promise.all([getLocalMTime(path), getCloudMTime(bucket, folder)]);

  if (localMTime.getTime() >= cloudMTime.getTime()) {
    // tslint:disable-next-line: no-console
    console.log('skipping restore, local files more synced');

    return undefined;
  }

  return () => runRestore({ path, bucket, folder });
};
