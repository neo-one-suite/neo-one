import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';
import { createTasks } from '../compile';

export const command = 'compile';
export const describe = 'compile a project and output code to a local directory';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('outDir')
    .describe('outDir', 'output code directory')
    .default('outDir', './')
    .string('path')
    .describe('path', 'contract directory');

export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (_cmd, config) => {
    await createTasks(argv.path ? argv.path : config.contracts.path, argv.outDir).run();
  });
};
