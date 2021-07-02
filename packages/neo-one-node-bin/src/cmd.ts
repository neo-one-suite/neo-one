import { nodeLogger } from '@neo-one/logger';
import { FullNode } from '@neo-one/node';
import { createStart, Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { getOptions } from './getOptions';

const start = createStart(nodeLogger);

export const command = 'neo-one-node';
export const describe = 'Start a NEO•ONE node.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.string('chain-file').boolean('readStart').string('dump-chain-file').boolean('writeStart');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async () => {
    const options = getOptions();
    const fullNode = new FullNode({
      options,
      readStart: argv.readStart,
      chainFile: argv['chain-file'],
      dumpChainFile: argv['dump-chain-file'],
      writeStart: argv.writeStart,
    });
    await fullNode.start();

    return async () => {
      await fullNode.stop();
    };
  });
};
