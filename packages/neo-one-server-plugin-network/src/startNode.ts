import { serverLogger } from '@neo-one/logger';
import { CLIArgs } from '@neo-one/server-plugin';
import { createFullNode } from './createFullNode';
import { createNEOONENodeConfig } from './node';

export const startNode = ({ vorpal, shutdown, mutableShutdownFuncs }: CLIArgs) => {
  vorpal
    .command('start node <dataPath>', `Starts a full node`)
    .option('-c, --chain <chain>', 'Path of a chain.acc file to bootstrap the node')
    .option('-d --dump <dump>', 'Path to dump a chain.acc file to')
    .action(async (args) => {
      const { dataPath, options: cliOptions } = args;

      const nodeConfig = createNEOONENodeConfig({ dataPath });

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
        chainFile,
        dumpChainFile,
        onError: (error) => {
          serverLogger.error(
            {
              title: 'neo_node_uncaught_error',
              error,
            },
            'Uncaught node error, shutting down.',
          );

          shutdown({ exitCode: 1, error });
        },
      });

      await node.start();
      const stop = node.stop.bind(node);
      mutableShutdownFuncs.push(stop);
    });
};
