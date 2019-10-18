// tslint:disable no-array-mutation promise-function-async
import { utils } from '@neo-one/utils';
import * as fs from 'fs-extra';
// tslint:disable-next-line match-default-export-name
import glob from 'glob';
import _ from 'lodash';
import * as path from 'path';

const INCLUDE_PACKAGES: readonly string[] = [
  'neo-one-client',
  'neo-one-client-common',
  'neo-one-client-core',
  'neo-one-client-switch',
  'neo-one-developer-tools',
  'neo-one-local',
  'neo-one-node-browser',
  'neo-one-local-browser',
  'neo-one-local-singleton',
  'neo-one-logger',
  'neo-one-node-blockchain',
  'neo-one-node-core',
  'neo-one-node-neo-settings',
  'neo-one-node-protocol',
  'neo-one-node-rpc-handler',
  'neo-one-node-storage-levelup',
  'neo-one-node-vm',
  'neo-one-smart-contract',
  'neo-one-smart-contract-compiler',
  'neo-one-smart-contract-lib',
  'neo-one-smart-contract-test-browser',
  'neo-one-smart-contract-test-common',
  'neo-one-ts-utils',
  'neo-one-typescript-concatenator',
  'neo-one-utils',
  'neo-one-worker',
];
const PACKAGES_DIR = path.resolve(__dirname, '..', '..', '..');
const PACKAGE_DIR_PREFIX = path.join(PACKAGES_DIR, 'neo-one-');

export const getPackages = async () => {
  const packageDirs = INCLUDE_PACKAGES;
  const packagePaths = packageDirs.map((dir) => path.resolve(PACKAGES_DIR, dir));
  const packageFilesList = await Promise.all(
    packagePaths.map(async (packagePath) => {
      const hasLib = await fs.pathExists(path.resolve(packagePath, 'lib'));

      return getPackageFiles(
        packagePath,
        path.join('@neo-one', packagePath.slice(PACKAGE_DIR_PREFIX.length)),
        (file) => file.includes('__') || file.includes('node_modules') || (hasLib && file.includes('src')),
      );
    }),
  );

  return _.fromPairs(_.flatten(packageFilesList).filter((value) => value[1] !== undefined));
};

const getPackageFiles = async (
  packageDir: string,
  outputPackageDir: string,
  omitFile = (_file: string) => false,
  // tslint:disable-next-line: readonly-array
): Promise<ReadonlyArray<[string, string | undefined]>> => {
  const filesPromise = new Promise<readonly string[]>((resolve, reject) =>
    glob(path.join(packageDir, '**', '*'), (err, found) => {
      if (err) {
        reject(err);
      } else {
        resolve(found);
      }
    }),
  );
  const files = await filesPromise;

  const result = await Promise.all(
    files.map<Promise<[string, string] | undefined>>(async (file) => {
      if (omitFile(file)) {
        return undefined;
      }

      try {
        const content = await fs.readFile(file, 'utf8');

        return [path.join('/', 'node_modules', outputPackageDir, file.slice(packageDir.length)), content];
      } catch (error) {
        if (error.code !== 'EISDIR') {
          throw error;
        }

        return undefined;
      }
    }),
  );

  return result.filter(utils.notNull);
};
