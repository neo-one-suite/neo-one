// tslint:disable no-array-mutation
import { join } from '../path';
import { normalizePath } from './keyValueFileSystem';
import { FileSystem, RemoteFileSystem, SubscribableFileSystem } from './types';

const ensureDirSingle = (fs: SubscribableFileSystem | FileSystem, dir: string) => {
  try {
    fs.mkdirSync(dir);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

export const pathExists = (fs: FileSystem, path: string) => {
  try {
    fs.statSync(path);

    return true;
  } catch {
    return false;
  }
};

export const ensureDir = (fs: SubscribableFileSystem | FileSystem, dirIn: string) => {
  const dir = normalizePath(dirIn);
  const parts = dir.split('/');
  let current = parts.shift();
  if (current === '') {
    current = parts.shift();
  }

  if (current === undefined) {
    return;
  }

  current = `/${current}`;

  // tslint:disable-next-line no-loop-statement
  while (true) {
    ensureDirSingle(fs, current);
    const next = parts.shift();
    if (next === undefined) {
      return;
    }
    current += `/${next}`;
  }
};

export function* traverseDirectory(fs: FileSystem, dir: string) {
  const mutableQueue = [dir];
  let next = mutableQueue.shift();
  // tslint:disable-next-line no-loop-statement
  while (next !== undefined) {
    const paths = fs.readdirSync(next);
    // tslint:disable-next-line no-loop-statement
    for (const filePath of paths) {
      const path = join(next, filePath);
      const stat = fs.statSync(path);
      if (stat.isDirectory()) {
        mutableQueue.push(path);
      } else if (stat.isFile()) {
        yield path;
      }
    }
    next = mutableQueue.shift();
  }
}

export const copyToRemote = async (fs: FileSystem, remote: RemoteFileSystem) => {
  async function copyWorker(pathIn: string): Promise<void> {
    if (pathIn !== '/') {
      await remote.mkdirSync(pathIn);
    }
    const paths = fs.readdirSync(pathIn);
    await Promise.all(
      paths.map(async (file) => {
        const path = `${pathIn === '/' ? '' : pathIn}/${file}`;
        const stat = fs.statSync(path);
        if (stat.isFile()) {
          const content = fs.readFileSync(path);
          const opts = fs.readFileOptsSync(path);
          await remote.writeFileSync(path, content, opts);
        } else if (stat.isDirectory()) {
          await copyWorker(path);
        }
      }),
    );
  }

  await copyWorker('/');
};
