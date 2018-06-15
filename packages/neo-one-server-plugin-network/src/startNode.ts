import { CLIArgs } from '@neo-one/server-plugin';
import path from 'path';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { createFullNode } from './createFullNode';
import { createNEOONENodeConfig } from './node';

export const startNode = ({ vorpal, monitor, shutdown, shutdownFuncs, logConfig$ }: CLIArgs) => {
  vorpal
    .command('start node <dataPath>', `Starts a full node`)
    .option('-c, --chain <chain>', 'Path of a chain.acc file to bootstrap the node')
    .option('-d --dump <dump>', 'Path to dump a chain.acc file to')
    // tslint:disable-next-line no-any
    .action(async (args: any) => {
      const { dataPath, options: cliOptions } = args;

      const nodeConfig = createNEOONENodeConfig({ dataPath });

      const logPath = path.resolve(dataPath, 'log');
      const logSubscription = nodeConfig.config$
        .pipe(
          map((config) => config.log),
          distinctUntilChanged(),
          map((config) => ({
            name: 'node',
            path: logPath,
            level: config.level,
            maxSize: config.maxSize,
            maxFiles: config.maxFiles,
          })),
        )
        .subscribe(logConfig$);
      // tslint:disable-next-line no-array-mutation
      shutdownFuncs.push(() => logSubscription.unsubscribe());

      let chainFile;
      if (cliOptions.chain != undefined) {
        chainFile = cliOptions.chain;
      }

      let dumpChainFile;
      if (cliOptions.dump != undefined) {
        dumpChainFile = cliOptions.dump;
      }

      const node = await createFullNode({
        dataPath,
        nodeConfig,
        monitor,
        chainFile,
        dumpChainFile,
        onError: (error) => {
          monitor.logError({
            name: 'neo_node_uncaught_error',
            message: 'Uncaught node error, shutting down.',
            error,
          });

          shutdown({ exitCode: 1, error });
        },
      });

      node.start();
      // tslint:disable-next-line no-array-mutation
      shutdownFuncs.push(() => node.stop());
    });
};
