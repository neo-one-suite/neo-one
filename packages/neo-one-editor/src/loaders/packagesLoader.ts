// tslint:disable no-array-mutation promise-function-async
import * as fs from 'fs-extra';
// tslint:disable-next-line match-default-export-name
import glob from 'glob';
import _ from 'lodash';
import path from 'path';
import webpack from 'webpack';

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

export function packagesLoader(this: webpack.loader.LoaderContext) {
  try {
    compile(this);
  } catch (e) {
    // tslint:disable-next-line no-console
    console.error(e, e.stack);
    throw e;
  }
}

const compile = (loader: webpack.loader.LoaderContext): void => {
  const callback = loader.async();
  if (callback) {
    getPackagesExports(loader)
      .then((result) => callback(undefined, result))
      .catch(callback);
  }
};

const getPackagesExports = async (loader: webpack.loader.LoaderContext): Promise<string> => {
  const packages = await getPackages(loader);

  return `module.exports = ${JSON.stringify(packages)};`;
};

export const getPackages = async (loader: webpack.loader.LoaderContext) => {
  const packageDirs = INCLUDE_PACKAGES;
  const packagePaths = packageDirs.map((dir) => path.resolve(PACKAGES_DIR, dir));
  const packageFilesList = await Promise.all(
    packagePaths.map(async (packagePath) => {
      const hasDist = await fs.pathExists(path.resolve(packagePath, 'dist'));

      return getPackageFiles(
        loader,
        packagePath,
        path.join('@neo-one', packagePath.slice(PACKAGE_DIR_PREFIX.length)),
        (file) =>
          file.includes('__') ||
          file.includes('node_modules') ||
          (hasDist && file.includes('src')) ||
          file.includes('.md') ||
          file.includes('package-deps.json') ||
          file.includes('.log') ||
          file.includes('gulpfile.js') ||
          file.includes('tsconfig'),
      );
    }),
  );

  return _.fromPairs(_.flatten(packageFilesList).filter((value) => value[1] !== undefined));
};

const getPackageFiles = async (
  loader: webpack.loader.LoaderContext,
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
        loader.addDependency(file);

        return [path.join('/', 'node_modules', outputPackageDir, file.slice(packageDir.length)), content];
      } catch (error) {
        if (error.code !== 'EISDIR') {
          throw error;
        }

        return undefined;
      }
    }),
  );

  // tslint:disable-next-line: strict-type-predicates
  return result.filter((value) => value != undefined) as ReadonlyArray<[string, string | undefined]>;
};
