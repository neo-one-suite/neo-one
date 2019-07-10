import { nodeLogger } from '@neo-one/logger';
import * as fs from 'fs-extra';
import { getProvider } from './getProvider';
import { Environment, Options } from './types';

const logger = nodeLogger.child({ component: 'data-backup' });

export const backup = async ({
  environment,
  options,
}: {
  readonly environment: Environment;
  readonly options: Options;
}) => {
  const provider = getProvider({ environment, options });
  if (provider === undefined) {
    logger.info({ title: 'node_backup_skip_no_provider' }, 'Skipping backup due to no provider');

    return;
  }

  await fs.remove(environment.tmpPath);
  await fs.ensureDir(environment.tmpPath);

  await provider.backup();

  await fs.remove(environment.tmpPath);
  logger.info({ component: 'neo_backup_execute' });
};
