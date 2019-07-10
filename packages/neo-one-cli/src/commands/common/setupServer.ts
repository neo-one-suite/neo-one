import { createServerConfig } from '@neo-one/server-client';
import { CLIArgs } from '@neo-one/server-plugin';

export const setupServer = ({ shutdown, mutableShutdownFuncs, serverArgs, paths }: CLIArgs) => {
  const { dir: _dir, ...serverArgsWithoutDir } = serverArgs;
  const serverConfig = createServerConfig({
    paths,
    ...serverArgsWithoutDir,
  });

  return {
    mutableShutdownFuncs,
    shutdown,
    serverConfig,
  };
};
