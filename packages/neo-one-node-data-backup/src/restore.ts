import { nodeLogger } from '@neo-one/logger';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getProvider } from './getProvider';
import { Environment, Options } from './types';

const logger = nodeLogger.child({ component: 'data_restore' });

export const restore = async ({
  environment,
  options,
}: {
  readonly environment: Environment;
  readonly options: Options;
}) => {
  const { dataPath, tmpPath, readyPath } = environment;
  try {
    // tslint:disable-next-line no-bitwise
    await fs.access(readyPath, fs.constants.R_OK | fs.constants.W_OK);
    logger.info({ title: 'neo_restore_skip_exists' }, 'Skipping restore because it already exists');

    return;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error({ title: 'neo_restore_skip_exists', error }, 'Encountered error checking for existing restore.');

      throw error;
    }
  }

  const provider = getProvider({ environment, options });
  if (provider === undefined) {
    logger.info({ title: 'neo_restore_skip_no_provider' }, 'Skipping restore due to no provider');

    return;
  }

  try {
    await Promise.all([fs.remove(dataPath), fs.remove(tmpPath)]);
    await Promise.all([fs.ensureDir(tmpPath), fs.ensureDir(path.dirname(readyPath)), fs.ensureDir(dataPath)]);
    await provider.restore();
    await fs.remove(tmpPath);
    await fs.writeFile(readyPath, 'ready');
    logger.info({ title: 'neo_restore_execute' });
  } catch (error) {
    logger.error({ title: 'neo_restore_execute', error });
    throw error;
  }
};
