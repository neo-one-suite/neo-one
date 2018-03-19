/* @flow */
import type { Monitor } from '@neo-one/monitor';

import fs from 'fs-extra';

import type { Environment, Options } from './types';

import getProvider from './getProvider';

export default async ({
  monitor: monitorIn,
  environment,
  options,
}: {|
  monitor: Monitor,
  environment: Environment,
  options: Options,
|}) => {
  const monitor = monitorIn.at('data_backup');
  const provider = getProvider({ environment, options });
  if (provider == null) {
    monitor.log({
      name: 'skip_no_provider',
      message: 'Skipping backup due to no provider',
    });
    return;
  }

  await monitor.captureSpanLog(
    async span => {
      await fs.remove(environment.tmpPath);
      await fs.ensureDir(environment.tmpPath);

      await provider.backup(span);

      await fs.remove(environment.tmpPath);
    },
    {
      name: 'backup',
      help: 'Duration taken for backup',
    },
  );
};
