import { CLIArgs } from '@neo-one/server-plugin';
import { createFullNode } from './createFullNode';
import { loadNEOONENodeOptions } from './node';

export const startNode = ({ vorpal, mutableShutdownFuncs }: CLIArgs) => {
  vorpal
    .command('start node <dataPath>', `Starts a full node`)
    .option('-c, --chain <chain>', 'Path of a chain.acc file to bootstrap the node')
    .option('-d --dump <dump>', 'Path to dump a chain.acc file to')
    .action(async (args) => {
      const { dataPath, options: cliOptions } = args;

      const options = await loadNEOONENodeOptions({ dataPath });

      let chainFile;
      if (cliOptions.chain != undefined) {
        chainFile = cliOptions.chain;
      }

      let dumpChainFile;
      if (cliOptions.dump != undefined) {
        dumpChainFile = cliOptions.dump;
      }

      const node = await createFullNode({
        options,
        chainFile,
        dumpChainFile,
      });

      await node.start();
      const stop = node.stop.bind(node);
      mutableShutdownFuncs.push(stop);
    });
};
