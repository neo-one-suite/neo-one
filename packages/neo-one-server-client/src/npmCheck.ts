import { getEscapedNPMName } from '@neo-one/utils-node';
import fetch from 'cross-fetch';
import * as fs from 'fs-extra';

export interface NPMCache {
  readonly version: string;
  readonly date: number;
}

const askNPM = async (pkg: string): Promise<string | undefined> => {
  const NPM_REGISTRY_URL = 'https://registry.yarnpkg.com';
  const escapedName = getEscapedNPMName(pkg);
  const url = `${NPM_REGISTRY_URL}/${escapedName}`;

  const res = await fetch(url);
  if (res.ok) {
    try {
      const json = await res.json();

      return json['dist-tags'].latest;
    } catch {
      // ignore errors...
    }
  }

  return undefined;
};

const promiseTimeout = async (delay: number): Promise<undefined> =>
  new Promise<undefined>((resolve) => {
    setTimeout(() => resolve(undefined), delay);
  });

const writeCache = async (file: string, cache: NPMCache) => {
  await fs.writeFile(file, JSON.stringify(cache));
};

const triggerCacheUpdate = async (pkg: string, cachePath: string, timeout: number): Promise<void> => {
  const latestVersion = await Promise.race([askNPM(pkg), promiseTimeout(timeout)]);
  if (latestVersion !== undefined) {
    await writeCache(cachePath, {
      version: latestVersion,
      date: Date.now(),
    });
  }
};

const readCache = async (file: string) => {
  try {
    const contents = await fs.readFile(file, 'utf8');

    return JSON.parse(contents);
  } catch {
    // ignore errors
  }

  return undefined;
};

export const npmCheck = async (
  pkg: string,
  cachePath: string,
  timeout: number,
  checkDelaySec: number,
): Promise<string | undefined> => {
  const cached = await readCache(cachePath);

  if (cached === undefined || (cached !== undefined && Date.now() > cached.date + checkDelaySec)) {
    triggerCacheUpdate(pkg, cachePath, timeout).catch(() => {
      /* do nothing */
    });
  }

  return cached === undefined ? undefined : cached.version;
};
