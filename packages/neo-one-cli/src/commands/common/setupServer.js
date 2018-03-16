/* @flow */
import type { CLIArgs } from '@neo-one/server-plugin';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { createServerConfig } from '@neo-one/server-client';
import { distinctUntilChanged, map } from 'rxjs/operators';

export default (
  name: string,
  { monitor, shutdown, logConfig$, shutdownFuncs, serverArgs, paths }: CLIArgs,
) => {
  const serverConfig = createServerConfig({
    paths,
    serverPort: serverArgs.serverPort,
    minPort: serverArgs.minPort,
  });

  const logSubscription = combineLatest(
    serverConfig.config$.pipe(
      map(config => config.paths.log),
      distinctUntilChanged(),
    ),
    serverConfig.config$.pipe(
      map(config => config.log),
      distinctUntilChanged(),
    ),
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

  return {
    monitor: monitor.at('server'),
    shutdownFuncs,
    shutdown,
    serverConfig,
  };
};
