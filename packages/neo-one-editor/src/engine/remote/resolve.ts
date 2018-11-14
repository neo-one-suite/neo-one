import { FileSystem } from '@neo-one/local-browser';
import _ from 'lodash';
import * as path from 'path';
// tslint:disable-next-line match-default-export-name
import resv from 'resolve';

interface Options {
  readonly module: string;
  readonly from: string;
  readonly fs: FileSystem;
  readonly emptyModulePath: string;
  readonly files?: Set<string>;
}

interface Shims {
  readonly [key: string]: string;
}

export const resolve = ({ module: mod, from, emptyModulePath, fs, files = new Set() }: Options): string => {
  const base = path.dirname(from);
  const paths = getNodeModulesPaths(base).map((nodeModulePath) => path.dirname(nodeModulePath));
  const shims = loadShims(paths, emptyModulePath, fs);
  const absoluteModule = path.join(base, mod);
  const transformedID =
    (shims[mod] as string | undefined) !== undefined
      ? shims[mod]
      : (shims[absoluteModule] as string | undefined) !== undefined
      ? shims[absoluteModule]
      : mod;
  const resolved = resv.sync(transformedID, buildResolveOptions(base, fs, files));

  return (shims[resolved] as string | undefined) === undefined ? resolved : shims[resolved];
};

const loadShims = (pathsIn: ReadonlyArray<string>, emptyModulePath: string, fs: FileSystem): Shims => {
  const mutablePaths = [...pathsIn];
  let currentPath = mutablePaths.shift();
  // tslint:disable-next-line no-loop-statement
  while (currentPath !== undefined) {
    const pkgPath = path.join(currentPath, 'package.json');
    try {
      const data = fs.readFileSync(pkgPath);

      return findShimsInPackage(data, currentPath, emptyModulePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    currentPath = mutablePaths.shift();
  }

  return {};
};

const findShimsInPackage = (pkgJSON: string, currentPath: string, emptyModulePath: string): Shims => {
  // tslint:disable-next-line no-any
  const pkg = JSON.parse(pkgJSON);
  const replacements = pkg.browser;
  if (replacements == undefined) {
    return {};
  }

  if (typeof replacements === 'string') {
    const key = path.join(currentPath, pkg.main == undefined ? 'index.js' : pkg.main);

    return { [key]: path.join(currentPath, replacements) };
  }

  // tslint:disable-next-line no-any
  return Object.entries(replacements).reduce<{ [key: string]: string }>((acc, [keyIn, val]: any) => {
    let value: string | boolean;
    if (val === false) {
      value = emptyModulePath;
    } else if (val[0] === '.') {
      value = path.join(currentPath, val);
    } else {
      value = val;
    }

    let key = keyIn;
    if (key[0] === '/' || key[0] === '.') {
      key = path.join(currentPath, key);
    }

    return {
      ...acc,
      [key]: value,
    };
  }, {});
};

const buildResolveOptions = (basedir: string, fs: FileSystem, files: Set<string>) => ({
  basedir,
  readFileSync: (file: string) => fs.readFileSync(file),
  // tslint:disable-next-line no-any
  packageFilter: (pkg: any) => {
    const replacements = pkg.browser;
    if (replacements == undefined) {
      return pkg;
    }

    if (typeof replacements === 'string') {
      // tslint:disable-next-line no-object-mutation
      pkg.main = replacements;

      return pkg;
    }

    let replaceMain = replacements[pkg.main];
    if (replaceMain === undefined) {
      replaceMain = replacements['./index.js'];
    }
    if (replaceMain === undefined) {
      replaceMain = replacements[`./${pkg.main}`];
    }

    if (replaceMain !== undefined) {
      // tslint:disable-next-line no-object-mutation
      pkg.main = replaceMain;
    }

    return pkg;
  },
  // tslint:disable-next-line no-any
  pathFilter: (pkg: any, _resolvedPath: string, relativePathIn: string) => {
    let relativePath = relativePathIn;
    if (relativePath[0] !== '.') {
      relativePath = `./${relativePath}`;
    }

    const replacements = pkg.browser;
    if (replacements === undefined) {
      return undefined;
    }

    let mappedPath = replacements[relativePath];
    if (mappedPath === undefined && path.extname(relativePath) === '') {
      mappedPath = replacements[`${relativePath}.js`];
      if (mappedPath === undefined) {
        mappedPath = replacements[`${relativePath}.json`];
      }
    }

    return mappedPath;
  },
  isFile: (file: string) => {
    if (!file.endsWith('.json') && files.has(file)) {
      return true;
    }

    try {
      const stat = fs.statSync(file);

      return stat.isFile();
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  },
  isDirectory: (dir: string) => {
    try {
      const stat = fs.statSync(dir);

      return stat.isDirectory();
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  },
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
});

export const getNodeModulesPaths = (start: string) => {
  const mutableParts = start.startsWith('/') ? start.slice(1).split('/') : start.split('/');

  return _.reverse(
    mutableParts.reduce<ReadonlyArray<string>>(
      (acc, part, i) => {
        if (part === 'node_modules') {
          return acc;
        }

        return acc.concat(`/${path.join(...mutableParts.slice(0, i + 1).concat(['node_modules']))}`);
      },
      ['/node_modules'],
    ),
  );
};
