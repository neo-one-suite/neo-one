// tslint:disable no-any
import { Monitor } from '@neo-one/monitor';
import { retryBackoff } from '@neo-one/utils';
import fetch from 'cross-fetch';
// @ts-ignore
import detective from 'detective';
import _ from 'lodash';
import LRU from 'lru-cache';
import * as nodePath from 'path';
import { defer } from 'rxjs';
import * as tar from 'tar';
import { EmptyBodyError, FetchError, MissingPackageJSONError } from './errors';
import { getEscapedName } from './utils';

const REGISTRY = 'https://registry.npmjs.org/';

const getTarballURL = (name: string, version: string) => {
  const escapedName = getEscapedName(name);

  return `${REGISTRY}${escapedName}/-/${escapedName}-${version}.tgz`;
};

const getPath = (path: string) =>
  nodePath.sep +
  path
    .split(nodePath.sep)
    .slice(1)
    .join(nodePath.sep);

interface Files {
  readonly [path: string]: Buffer | undefined;
}
interface MutableFiles {
  // tslint:disable-next-line readonly-keyword
  [path: string]: Buffer;
}

const extractPackage = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new FetchError(url, response.status, response.statusText);
  }

  if (response.body === null) {
    throw new EmptyBodyError(url);
  }

  const body = response.body;

  return new Promise<Files>((resolve, reject) => {
    const parse = new (tar.Parse as any)({});

    const mutableResult: MutableFiles = {};
    parse.on('entry', (entry: any) => {
      const mutableChunks: Buffer[] = [];

      switch (entry.type) {
        case 'File':
        case 'OldFile':
        case 'ContiguousFile':
          entry.on('error', (error: Error) => {
            reject(error);
          });

          entry.on('end', () => {
            mutableResult[getPath(entry.path)] = Buffer.concat(mutableChunks);
          });

          entry.on('data', (chunk: Buffer) => {
            mutableChunks.push(chunk);
          });
          break;
        default:
          entry.resume();
      }
    });

    (body as any).on('error', (error: Error) => {
      reject(error);
    });

    parse.on('error', (error: Error) => {
      reject(error);
    });
    parse.on('end', () => {
      resolve(mutableResult);
    });

    (body as any).pipe(parse);
  });
};

interface Result {
  readonly [path: string]: string;
}

interface MutableResult {
  // tslint:disable-next-line readonly-keyword
  [path: string]: string;
}

interface Mapping {
  readonly [path: string]: string | boolean | undefined;
}

const resolveJavaScriptFilePath = (files: Files, filePath: string) => {
  if (files[filePath] !== undefined) {
    return filePath;
  }

  const indexFilePath = nodePath.join(filePath, 'index.js');
  if (files[indexFilePath] !== undefined) {
    return indexFilePath;
  }

  return filePath.endsWith('.js') || filePath.endsWith('.ts') ? filePath : `${filePath}.js`;
};

const resolveJavaScriptFiles = (files: Files, filePathIn: string, mapping: Mapping, mutableResult: MutableResult) => {
  const filePath = resolveJavaScriptFilePath(files, filePathIn);

  const mappedPath = mapping[filePath];
  if (typeof mappedPath === 'boolean') {
    return;
  }

  const resolvedPath = mappedPath === undefined ? filePath : mappedPath;
  if ((mutableResult[resolvedPath] as string | undefined) !== undefined) {
    return;
  }

  const file = files[resolvedPath];
  if (file !== undefined) {
    const content = file.toString('utf8');
    mutableResult[resolvedPath] = content;
    const dtsFilePath = nodePath.join(nodePath.dirname(resolvedPath), `${nodePath.basename(resolvedPath, '.js')}.d.ts`);
    const dtsFile = files[dtsFilePath];
    if (dtsFile !== undefined) {
      mutableResult[dtsFilePath] = dtsFile.toString('utf8');
    }

    let requires: ReadonlyArray<string | number> | undefined;
    try {
      requires = detective(content);
    } catch {
      // do nothing
    }

    if (requires !== undefined) {
      requires
        .filter((req): req is string => typeof req === 'string')
        .filter((req) => req.startsWith('.'))
        .map((req) => nodePath.resolve(nodePath.dirname(resolvedPath), req))
        .forEach((req) => {
          resolveJavaScriptFiles(files, req, mapping, mutableResult);
        });
    }
  }
};

const getAdditionalStarts = (files: Files, start: string, packageJSON: any) => {
  const otherEntryPaths = new Set(
    Object.values(packageJSON)
      .filter((value) => typeof value === 'string')
      .map((file: any) => resolveJavaScriptFilePath(files, nodePath.resolve('/', file))),
  );

  return Object.keys(files)
    .filter(
      (file) =>
        file !== start &&
        ((nodePath.basename(file) === 'index.js' &&
          !nodePath
            .dirname(file)
            .slice(1)
            .includes('/')) ||
          (!file.slice(1).includes('/') && file.endsWith('.js'))) &&
        nodePath.dirname(file) !== '/src',
    )
    .map((file) => resolveJavaScriptFilePath(files, file))
    .filter((file) => !otherEntryPaths.has(file));
};

const getFilesWithExtensions = (files: Files, extensions: ReadonlyArray<string>) =>
  _.fromPairs(
    Object.entries(files)
      .filter(([key]) => extensions.some((ext) => key.endsWith(ext)))
      .map(([key, val]) => [key, (val as Buffer).toString('utf8')]),
  );

const getDTS = (files: Files) => getFilesWithExtensions(files, ['.d.ts']);

const resolvePackageWorker = async (name: string, version: string, monitor?: Monitor): Promise<Result> => {
  const url = getTarballURL(name, version);
  const files = await defer(async () => extractPackage(url))
    .pipe(
      retryBackoff({
        initialInterval: 250,
        maxRetries: 10,
        maxInterval: 2500,
        onError: (error) => {
          if (monitor !== undefined) {
            monitor.logError({
              name: 'resolve_package_extract_package_error',
              error,
            });
          }
        },
      }),
    )
    .toPromise();
  const packageJSONBuffer = files['/package.json'];
  if (packageJSONBuffer === undefined) {
    throw new MissingPackageJSONError(name, version);
  }

  const packageJSONContent = packageJSONBuffer.toString('utf8');
  const packageJSON = JSON.parse(packageJSONContent);
  let start = packageJSON.main;
  let mapping: Mapping = {};
  if (packageJSON.browser !== undefined) {
    if (typeof packageJSON.browser === 'object') {
      mapping = packageJSON.browser;
    } else {
      start = packageJSON.browser;
    }
  }

  if (start === undefined || start === '') {
    start = './index.js';
  }

  start = nodePath.resolve('/', start);

  if (files[resolveJavaScriptFilePath(files, start)] === undefined && files['/index.d.ts'] !== undefined) {
    start = '/index.d.ts';
  }

  mapping = _.fromPairs(
    Object.entries(mapping).map(([key, value]) => [
      nodePath.resolve('/', key),
      value === undefined ? value : typeof value === 'boolean' ? value : nodePath.resolve('/', value),
    ]),
  );

  let mutableResult: MutableResult = {};
  if (start.endsWith('.d.ts')) {
    mutableResult = getDTS(files);
  } else {
    resolveJavaScriptFiles(files, start, mapping, mutableResult);

    getAdditionalStarts(files, start, packageJSON).forEach((additionalStart) => {
      resolveJavaScriptFiles(files, additionalStart, mapping, mutableResult);
    });

    const types = packageJSON.types === undefined ? packageJSON.typings : packageJSON.types;
    if (types !== undefined) {
      const resolvedTypes = nodePath.resolve('/', types);
      if ((mutableResult[resolvedTypes] as string | undefined) === undefined) {
        const extensions = resolvedTypes.endsWith('.d.ts') ? ['.d.ts'] : ['.ts', '.tsx'];
        mutableResult = { ...mutableResult, ...getFilesWithExtensions(files, extensions) };
      }
    }
  }

  mutableResult['/package.json'] = packageJSONContent;

  return mutableResult;
};

const cache = LRU<string, Promise<Result>>({
  max: 1000,
});

export const resolvePackage = async (name: string, version: string, monitor?: Monitor) => {
  const key = `${name}@${version}`;
  const pkg = cache.get(key);
  if (pkg !== undefined) {
    return pkg;
  }

  const result = resolvePackageWorker(name, version, monitor);
  result.catch((error) => {
    if (monitor !== undefined) {
      monitor.logError({
        name: 'resolve_package_final_error',
        error,
      });
    }

    cache.del(key);
  });
  cache.set(key, result);

  return result;
};
