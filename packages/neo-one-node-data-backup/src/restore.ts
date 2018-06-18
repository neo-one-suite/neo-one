import { Monitor } from '@neo-one/monitor';
import fs from 'fs-extra';
import path from 'path';
import { getProvider } from './getProvider';
import { Environment, Options } from './types';

export const restore = async ({
  monitor: monitorIn,
  environment,
  options,
}: {
  readonly monitor: Monitor;
  readonly environment: Environment;
  readonly options: Options;
}) => {
  const monitor = monitorIn.at('node_data_restore');
  const { dataPath, tmpPath, readyPath } = environment;
  try {
    // tslint:disable-next-line no-bitwise
    await fs.access(readyPath, fs.constants.R_OK | fs.constants.W_OK);
    monitor.log({
      name: 'neo_restore_skip_exists',
      message: 'Skipping restore beause it already exists',
    });

    return;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      monitor.logError({
        name: 'neo_restore_skip_exists',
        message: 'Encountered error checking for existing restore.',
        error,
      });

      throw error;
    }
  }

  const provider = getProvider({ environment, options });
  if (provider === undefined) {
    monitor.log({
      name: 'neo_restore_skip_no_provider',
      message: 'Skipping restore due to no provider',
    });

    return;
  }

  await monitor.captureSpanLog<Promise<void>>(
    async (span) => {
      await Promise.all([fs.remove(dataPath), fs.remove(tmpPath)]);
      await Promise.all([fs.ensureDir(tmpPath), fs.ensureDir(path.dirname(readyPath)), fs.ensureDir(dataPath)]);
      await provider.restore(span);
      await fs.remove(tmpPath);
      await fs.writeFile(readyPath, 'ready');
    },
    {
      name: 'neo_restore_execute',
      trace: true,
    },
  );
};
