import { createServerConfig } from '@neo-one/server-client';
import { CLIArgs } from '@neo-one/server-plugin';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export const setupServer = (
  name: string,
  { monitor, shutdown, logConfig$, mutableShutdownFuncs, serverArgs, paths }: CLIArgs,
) => {
  const { dir: _dir, ...serverArgsWithoutDir } = serverArgs;
  const serverConfig = createServerConfig({
    paths,
    ...serverArgsWithoutDir,
  });

  const logSubscription = combineLatest([
    serverConfig.config$.pipe(
      map((config) => config.paths.log),
      distinctUntilChanged(),
    ),
    serverConfig.config$.pipe(
      map((config) => config.log),
      distinctUntilChanged(),
    ),
  ])
    .pipe(
      map(([path, config]) => ({
        name,
        path,
        level: config.level,
      })),
    )
    .subscribe(logConfig$);
  mutableShutdownFuncs.push(() => logSubscription.unsubscribe());

  return {
    monitor: monitor.at('server'),
    mutableShutdownFuncs,
    shutdown,
    serverConfig,
  };
};
