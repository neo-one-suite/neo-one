// tslint:disable no-array-mutation
import { join } from '../path';
import { normalizePath } from './keyValueFileSystem';
import { FileSystem } from './types';

const ensureDirSingle = (fs: FileSystem, dir: string) => {
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

export const ensureDir = (fs: FileSystem, dirIn: string) => {
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
        const content = fs.readFileSync(path);
        yield { path, content };
      }
    }
    next = mutableQueue.shift();
  }
}
