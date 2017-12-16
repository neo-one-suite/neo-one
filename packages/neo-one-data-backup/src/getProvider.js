/* @flow */
import type { Log } from '@neo-one/utils';

import type { Environment, Options } from './types';
import { GCloudProvider, MegaProvider, MultiProvider } from './provider';

export default ({
  log,
  options,
  environment,
}: {|
  log: Log,
  options: Options,
  environment: Environment,
|}) => {
  const { gcloud, mega } = options;
  let provider;
  if (gcloud != null) {
    log({ event: 'LEVELDOWN_BACKUP_GCLOUD_PROVIDER' });
    provider = new GCloudProvider({
      log,
      environment,
      options: gcloud,
    });
  }

  if (mega != null) {
    log({ event: 'LEVELDOWN_BACKUP_MEGA_PROVIDER' });
    const megaProvider = new MegaProvider({
      log,
      environment,
      options: mega,
    });
    if (provider == null) {
      provider = megaProvider;
    } else {
      provider = new MultiProvider({
        primary: provider,
        other: [megaProvider],
        environment,
      });
    }
  }

  if (provider == null) {
    log({ event: 'LEVELDOWN_BACKUP_NO_PROVIDER' });
  }

  return provider;
};
