import { ServerManager } from '@neo-one/server-client';
import { CLIArgs, name, VERSION } from '@neo-one/server-plugin';
import { combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { setupServer } from './common';

export const checkServer = (args: CLIArgs) => {
  const { vorpal } = args;
  vorpal
    .command('check server', `Checks that the ${name.title} server is running. Primarily used for CI.`)
    .action(async () => {
      const { serverConfig, shutdown } = setupServer('check-server', args);

      const [dataPath, port] = await combineLatest(
        serverConfig.config$.pipe(map((conf) => conf.paths.data)),
        serverConfig.config$.pipe(map((conf) => conf.server.port)),
      )
        .pipe(take(1))
        .toPromise();

      const manager = new ServerManager({ dataPath, serverVersion: VERSION });
      const pid = await manager.checkAlive(port);

      const alive = pid !== undefined;
      vorpal.activeCommand.log(JSON.stringify(alive));
      shutdown({ exitCode: 0 });
    });
};
