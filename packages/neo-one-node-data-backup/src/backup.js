/* @flow */
import type { Log } from '@neo-one/utils';

import fs from 'fs-extra';

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
  const provider = getProvider({ log, environment, options });
  if (provider == null) {
    log({ event: 'DATA_BACKUP_SKIP_BACKUP_NO_PROVIDER' });
    return;
  }

  await fs.remove(environment.tmpPath);
  await fs.ensureDir(environment.tmpPath);

  await provider.backup();

  await fs.remove(environment.tmpPath);

  log({ event: 'DATA_BACKUP_BACKUP_COMPLETE' });
};
