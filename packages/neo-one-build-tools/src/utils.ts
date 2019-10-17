// tslint:disable:match-default-export-name no-any
import fs from 'fs-extra';
import gulpFilter from 'gulp-filter';
// @ts-ignore
// import jsonTransform from 'gulp-json-transform';
import gulpIf from 'gulp-if';
import gulpRename from 'gulp-rename';
import gulpReplace from 'gulp-replace';
import _ from 'lodash';
import path from 'path';
import pkg from '../package.json';
import { Format, MAIN_FORMAT } from './formats';

export const DIST = 'lib';
const RXJS_IMPORT = 'rxjs';

const getName = (format: Format, name: string) => (format.name === '' ? name : `${name}-${format.name}`);

export const getPackageJSON = async () => {
  const root = process.cwd();

  // tslint:disable-next-line: no-any
  let packageJSON: any = {};
  try {
    packageJSON = await fs.readJSON(path.join(root, 'package.json'));
  } catch {
    throw new Error(`error locating package.json in ${root}`);
  }

  return packageJSON;
};

export const getBin = (format: Format, baseBin: _.Dictionary<string>) => {
  if (format.name !== '') {
    return undefined;
  }

  return baseBin;
};

export const flattenSource = gulpRename((name) => {
  if (name.dirname === undefined) {
    return;
  }
  // tslint:disable-next-line: no-object-mutation
  name.dirname = name.dirname
    .split(path.sep)
    .filter((dir) => dir !== 'src')
    .join(path.sep);
});

export const flattenBin = gulpRename((name) => {
  if (name.dirname === undefined) {
    return;
  }
  // tslint:disable-next-line: no-object-mutation
  name.dirname = name.dirname
    .split(path.sep)
    .filter((dir) => dir !== 'bin')
    .join(path.sep);
});

export const replaceRXJSImport = (format: Format) =>
  gulpReplace(`${RXJS_IMPORT}/internal`, `${RXJS_IMPORT}/${format.module === 'esm' ? '_esm2015/' : ''}internal`);
export const replaceInternalSources = gulpReplace(
  /import\("(?:..\/)*neo-one-([^\)]*)\/src"\)/g,
  'import("@neo-one/$1")',
);
export const replaceBNTypeImport = gulpReplace(
  /import\("@neo-one\/build-tools\/types\/bn.js"\).BN/g,
  'import("bn.js")',
);
export const replaceBNImport = gulpReplace("import { BN } from 'bn.js';", "import BN from 'bn.js';");
export const replaceStatic = gulpReplace('../static', './static');
export const replaceCmd = gulpReplace('../cmd', './cmd');
export const filterJS = (condition: boolean) => gulpIf(condition, gulpFilter(['**', '!**/*.js']));

const CLIENT_PACKAGES = new Set([
  '@neo-one/client',
  '@neo-one/client-common',
  '@neo-one/client-core',
  '@neo-one/developer-tools',
  '@neo-one/utils',
  '@neo-one/client-switch',
  '@neo-one/node-vm',
  '@neo-one/client-full-common',
  '@neo-one/node-core',
]);
const CLIENT_FULL_PACKAGES = new Set(
  [...CLIENT_PACKAGES].concat(['@neo-one/client-full', '@neo-one/client-full-core']),
);

export const DEP_MAPPING: any = {
  esnext: {
    esm: {
      '@reactivex/ix-es2015-cjs': '@reactivex/ix-esnext-esm',
    },
    cjs: {
      '@reactivex/ix-es2015-cjs': '@reactivex/ix-esnext-cjs',
    },
  },
  es2017: {
    esm: {
      '@reactivex/ix-es2015-cjs': '@reactivex/ix-es2015-esm',
    },
    cjs: {},
  },
};

export const mapDep = (format: Format, depName: string): string => {
  if (depName.match(/^@neo-one\/.*/) && !format.browser) {
    return getName(format, depName);
  }

  if (DEP_MAPPING[format.target][format.module][depName] !== undefined) {
    return DEP_MAPPING[format.target][format.module][depName];
  }

  if (format.browser && CLIENT_FULL_PACKAGES.has(depName)) {
    return `${depName}-browserify`;
  }

  return depName;
};

// tslint:disable-next-line: arrow-return-shorthand
const transformBasePackageJSON = (format: Format, orig: any) => {
  const bin = getBin(format, orig.bin);

  return {
    name: format.name === '' ? orig.name : `${orig.name}-${format.name}`,
    version: orig.version,
    author: pkg.author,
    description: orig.description,
    license: pkg.license,
    homepage: pkg.homepage,
    repository: pkg.repository,
    bugs: pkg.bugs,
    keywords: pkg.keywords,
    bin,
    dependencies:
      orig.dependencies === undefined
        ? undefined
        : _.fromPairs(
            Object.entries(orig.dependencies)
              .filter(([depName]) => depName !== '@neo-one/developer-tools-frame')
              .map(([depName, version]) => [mapDep(format, depName), version]),
          ),
    publishConfig: {
      access: 'public',
    },
    engines: pkg.engines,
  };
};

export const transformSrcPackageJSON = (format: Format, orig: any /*file: any*/) => ({
  ...transformBasePackageJSON(format, orig),
  main: 'index.js',
  module: format.module === 'esm' ? 'index.js' : undefined,
  types: 'index.d.ts',
  sideEffects: false,
});

const transformSmartContractPackageJSON = (format: Format, orig: any /*file: any*/) => ({
  ...transformBasePackageJSON(format, orig),
  main: orig.main.startsWith('./src/') ? orig.main.slice('./src/'.length) : orig.main,
  include:
    orig.include === undefined ? undefined : orig.include.map((filepath: string) => filepath.slice(0, 'src/'.length)),
});

const transformBrowserPackageJSON = (format: Format, orig: any /*file: any*/) => ({
  ...transformSrcPackageJSON(format, orig /*file*/),
  browser: 'index.browser.js',
});

const transformPackageJSON = (format: Format, orig: any /*file: any*/) =>
  orig.smartContract !== undefined
    ? transformSmartContractPackageJSON(format, orig /*file*/)
    : orig.browser !== undefined
    ? transformBrowserPackageJSON(format, orig /*file*/)
    : transformSrcPackageJSON(format, orig /*file*/);

// tslint:disable-next-line: arrow-return-shorthand
export const transformPackage = (format: Format, orig: any) => {
  // jsonTransform((orig: any, file: any) => transformPackageJSON(format, orig /*file*/));

  return transformPackageJSON(format, orig);
};

export const getInternalDependencies = (pkgJSON: any) => {
  const dependencies = pkgJSON.dependencies === undefined ? [] : pkgJSON.dependencies;

  return Object.keys(dependencies).filter((dep) => dep.match(/^@neo-one\/.*/));
};

const quoted = (value: string, quote: string): string => `${quote}${value}${quote}`;
export const gulpReplaceModule = (format: Format, internalDeps: readonly string[], stream: any, quote = "'") =>
  Object.entries<string>(DEP_MAPPING[format.target][format.module])
    .concat(format === MAIN_FORMAT ? [] : internalDeps.map((p) => [quoted(p, quote), quoted(mapDep(format, p), quote)]))
    .reduce((streamIn, [moduleName, replaceName]) => streamIn.pipe(gulpReplace(moduleName, replaceName)), stream);

export const gulpReplaceBin = (binName: string, quote = '"') =>
  gulpReplace(quoted(binName, quote), quoted('../lib/index.js', quote));
