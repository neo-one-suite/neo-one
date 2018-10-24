import { normalizePath } from '@neo-one/utils';
import * as appRootDir from 'app-root-dir';
import * as path from 'path';

export const testDirectoryPath = (directory: string) =>
  normalizePath(
    path.resolve(
      appRootDir.get(),
      'packages',
      'neo-one-typescript-concatenator',
      'src',
      '__data__',
      'directories',
      directory,
      'index.ts',
    ),
  );

export const outDirectoryPath = (directory: string) =>
  normalizePath(
    path.resolve(
      appRootDir.get(),
      'packages',
      'neo-one-typescript-concatenator',
      'src',
      '__data__',
      'expected',
      `${directory}.ts`,
    ),
  );
