/* @flow */
import type { CLIArgs } from '@neo-one/server-plugin';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { createServerConfig } from '@neo-one/server-client';
import { distinct, map } from 'rxjs/operators';

export default (
  name: string,
  { log, shutdown, logConfig$, shutdownFuncs }: CLIArgs,
) => {
  const serverConfig = createServerConfig({ log });

  const logSubscription = combineLatest(
    serverConfig.config$.pipe(map(config => config.paths.log), distinct()),
    serverConfig.config$.pipe(map(config => config.log), distinct()),
  )
    .pipe(
      map(([path, config]) => ({
        name,
        path,
        level: config.level,
        maxSize: config.maxSize,
        maxFiles: config.maxFiles,
      })),
    )
    .subscribe(logConfig$);
  shutdownFuncs.push(() => logSubscription.unsubscribe());

  return { log, shutdownFuncs, shutdown, serverConfig };
};
