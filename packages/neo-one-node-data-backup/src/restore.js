/* @flow */
import type { Log } from '@neo-one/utils';

import fs from 'fs-extra';
import path from 'path';

import type { Environment, Options } from './types';

import getProvider from './getProvider';

export default async ({
  log,
  environment,
  options,
}: {|
  log: Log,
  environment: Environment,
  options: Options,
|}) => {
  const { dataPath, tmpPath, readyPath } = environment;
  try {
    // eslint-disable-next-line
    await fs.access(readyPath, fs.constants.R_OK | fs.constants.W_OK);
    log({ event: 'DATA_BACKUP_RESTORE_EXISTS' });
    return;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log({
        event: 'DATA_BACKUP_RESTORE_READY_PATH_ERROR',
        error,
      });
      throw error;
    }
  }

  const provider = getProvider({ log, environment, options });
  if (provider == null) {
    log({ event: 'DATA_BACKUP_RESTORE_SKIP_RESTORE_NO_PROVIDER' });
    return;
  }

  await Promise.all([fs.remove(dataPath), fs.remove(tmpPath)]);
  await Promise.all([
    fs.ensureDir(tmpPath),
    fs.ensureDir(path.dirname(readyPath)),
    fs.ensureDir(dataPath),
  ]);

  await provider.restore();

  await fs.remove(tmpPath);

  await fs.writeFile(readyPath, 'ready');
  log({ event: 'DATA_BACKUP_RESTORE_COMPLETE' });
};
