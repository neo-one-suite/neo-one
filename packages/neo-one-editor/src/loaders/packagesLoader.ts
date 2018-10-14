// tslint:disable no-array-mutation promise-function-async
import { utils } from '@neo-one/utils';
import * as fs from 'fs-extra';
// tslint:disable-next-line match-default-export-name
import glob from 'glob';
import _ from 'lodash';
import * as path from 'path';
import webpack from 'webpack';

const INCLUDE_PACKAGE_PREFIXES: ReadonlyArray<string> = [
  'neo-one-client',
  'neo-one-local',
  'neo-one-monitor',
  'neo-one-node',
  'neo-one-react',
  'neo-one-smart-contract',
  'neo-one-ts-utils',
  'neo-one-types',
  'neo-one-utils',
  'neo-one-worker',
];
const PACKAGES_DIR = path.resolve(__dirname, '..', '..', '..');
const PACKAGE_DIR_PREFIX = path.join(PACKAGES_DIR, 'neo-one-');

// tslint:disable-next-line export-name
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
  const [packages, reakitPackages] = await Promise.all([getPackages(loader), getReakitPackages(loader)]);

  return `module.exports = ${JSON.stringify({ ...packages, reakitPackages })};`;
};

const getPackages = async (loader: webpack.loader.LoaderContext) => {
  const packageDirsUnfiltered = await fs.readdir(PACKAGES_DIR);
  const packageDirs = packageDirsUnfiltered.filter((dir) =>
    INCLUDE_PACKAGE_PREFIXES.some((prefix) => dir.startsWith(prefix)),
  );
  const packagePaths = packageDirs.map((dir) => path.resolve(PACKAGES_DIR, dir));
  const packageFilesList = await Promise.all(
    packagePaths.map((packagePath) =>
      getPackageFiles(
        loader,
        packagePath,
        path.join('@neo-one', packagePath.slice(PACKAGE_DIR_PREFIX.length)),
        (file) => file.includes('__') || file.includes('node_modules'),
      ),
    ),
  );

  return _.fromPairs(_.flatMap(packageFilesList).filter((value) => value[1] !== undefined));
};

const getReakitPackages = async (loader: webpack.loader.LoaderContext) => {
  const reakitDir = path.resolve(__dirname, '..', '..', '..', '..', 'node_modules', 'reakit');
  const packageDir = path.resolve(reakitDir, 'ts');
  const [packageJSON, packageFiles] = await Promise.all([
    fs.readFile(path.resolve(reakitDir, 'package.json'), 'utf8'),
    getPackageFiles(loader, packageDir, 'reakit/ts'),
  ]);

  return {
    ..._.fromPairs(packageFiles),
    ['/node_modules/reakit/package.json']: packageJSON,
  };
};

const getPackageFiles = async (
  loader: webpack.loader.LoaderContext,
  packageDir: string,
  outputPackageDir: string,
  omitFile = (_file: string) => false,
): Promise<ReadonlyArray<[string, string | undefined]>> => {
  loader.addContextDependency(packageDir);
  const filesPromise = new Promise<ReadonlyArray<string>>((resolve, reject) =>
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
