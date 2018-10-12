import { normalizePath } from '@neo-one/utils';
import appRootDir from 'app-root-dir';
import * as path from 'path';

export const testDirectoryPath = (directory: string) =>
  normalizePath(
    path.resolve(
      appRootDir.get(),
      'packages',
      'neo-one-typescript-concatenator',
      'src',
      '__data__',
      'test-directories',
      directory,
      'index.ts',
    ),
  );
