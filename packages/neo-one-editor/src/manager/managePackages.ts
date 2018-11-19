import { PouchDBFileSystem } from '@neo-one/local-browser';
import { AsyncQueue, mergeScanLatest, retryBackoff, utils } from '@neo-one/utils';
import { Disposable } from '@neo-one/worker';
import fetch from 'cross-fetch';
import _ from 'lodash';
import * as nodePath from 'path';
import { concat, defer } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

interface DependencyInfo {
  readonly name: string;
  readonly version: string;
  readonly dependencies: ResolvedDependencies;
}

interface ResolvedDependencies {
  readonly [name: string]: DependencyInfo;
}

class FetchError extends Error {
  public constructor(public readonly url: string, public readonly status: number, public readonly statusText: string) {
    super(`Fetch for ${url} failed with status ${status}: ${statusText}`);
  }
}

const API_URL = process.env.NEO_ONE_API_URL;
const RESOLVE_URL = `${API_URL}resolve`;

const getPackageUrl = (name: string, version: string) =>
  `${API_URL}pkg?name=${encodeURIComponent(name)}&version=${version}`;

const headers = {
  'Content-Type': 'application/json',
};

const handlePackage = async (
  fs: PouchDBFileSystem,
  queue: AsyncQueue,
  pkgPath: string,
  name: string,
  version: string,
) => {
  const packageJSON = nodePath.join(pkgPath, 'node_modules', name, 'package.json');
  if (fs.files.has(packageJSON)) {
    return;
  }

  const files: { [path: string]: string } = await queue.execute(`${name}@${version}`, async () => {
    const url = getPackageUrl(name, version);

    const response = await fetch(url, {
      mode: 'no-cors',
    });
    if (!response.ok) {
      throw new FetchError(url, response.status, response.statusText);
    }

    return response.json();
  });

  await Promise.all(
    Object.entries(files)
      .filter(([path]) => path !== '/package.json')
      .map(async ([path, contents]) => fs.writeFile(nodePath.join(pkgPath, 'node_modules', name, path), contents)),
  );

  await fs.writeFile(packageJSON, files['/package.json']);
};

const handleDependency = async (
  fs: PouchDBFileSystem,
  queue: AsyncQueue,
  { name, version, dependencies }: DependencyInfo,
  pkgPath = '/',
) => {
  await Promise.all([
    handlePackage(fs, queue, pkgPath, name, version),
    handleDependencies(fs, queue, dependencies, nodePath.join(pkgPath, 'node_modules', name)),
  ]);
};

const handleDependencies = async (
  fs: PouchDBFileSystem,
  queue: AsyncQueue,
  dependencies: ResolvedDependencies,
  pkgPath = '/',
) => {
  await Promise.all(Object.values(dependencies).map(async (depInfo) => handleDependency(fs, queue, depInfo, pkgPath)));
};

export const managePackages = (fs: PouchDBFileSystem): Disposable => {
  const queue = new AsyncQueue();
  const subscription = concat(
    defer(async () => {
      try {
        return fs.readFileSync('/package.json');
      } catch {
        return '';
      }
    }),
    fs.changes$.pipe(
      filter((change) => change.id === '/package.json'),
      map((change) => (change.doc === undefined ? undefined : change.doc.content)),
      filter(utils.notNull),
    ),
  )
    .pipe(
      map((content) => {
        try {
          return JSON.parse(content);
        } catch {
          return undefined;
        }
      }),
      filter(utils.notNull),
      debounceTime(1000),
      map((packageJSON) => packageJSON.dependencies),
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      mergeScanLatest(async (_acc, dependencies) => {
        const resolvedDependencies: ResolvedDependencies = await fetch(RESOLVE_URL, {
          method: 'POST',
          body: JSON.stringify(dependencies),
          mode: 'no-cors',
          headers,
        }).then(async (res) => {
          if (!res.ok) {
            throw new FetchError(RESOLVE_URL, res.status, res.statusText);
          }

          return res.json();
        });

        await handleDependencies(fs, queue, resolvedDependencies);
      }),
      retryBackoff(1000),
    )
    .subscribe();

  return {
    dispose: () => {
      subscription.unsubscribe();
    },
  };
};
