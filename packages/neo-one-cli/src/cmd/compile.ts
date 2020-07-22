import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';
import { createTasks } from '../compile';

export const command = 'compile';
export const describe = 'Compiles a project and outputs code to a local directory.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('outDir')
    .describe('outDir', 'Output code directory')
    .string('path')
    .describe('path', 'Contract directory')
    .boolean('json')
    .describe('json', 'Output the contract with the JSON format')
    .default('json', true)
    .boolean('avm')
    .describe('avm', 'Output the contract with the AVM format')
    .default('avm', false)
    .boolean('debug')
    .describe('debug', 'Output additional debug information')
    .default('debug', false)
    .boolean('opcodes')
    .describe('opcodes', 'Output the AVM in a human readable format for debugging, requires --debug')
    .default('opcodes', false);

export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (_cmd, config) => {
    await createTasks(
      argv.path ? argv.path : config.contracts.path,
      argv.outDir ? argv.outDir : config.contracts.outDir,
      {
        json: argv.json ? argv.json : !argv.avm,
        avm: argv.avm,
        debug: argv.debug,
        opcodes: argv.debug ? argv.opcodes : false,
      },
    ).run();
  });
};
