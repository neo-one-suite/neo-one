import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';
import { createTasks } from '../compile';

export const command = 'compile';
export const describe = 'Compiles a project and outputs code to a local directory.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('outDir')
    .describe('outDir', 'output code directory')
    .string('path')
    .describe('path', 'Contract directory')
    .boolean('json')
    .describe('json', 'Output the contract with the JSON format')
    .boolean('avm')
    .describe('avm', 'Output the contract with the AVM format')
    .boolean('debug')
    .describe('debug', 'Output additional debug information')
    .boolean('opcodes')
    .describe('opcodes', 'Output the AVM in a human readable format for debugging, requires --debug');

export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (_cmd, config) => {
    const configOptions = config.contracts;
    const path = argv.path ? argv.path : configOptions.path;
    const outDir = argv.outDir ? argv.outDir : configOptions.outDir;
    const options = {
      json: argv.json ? argv.json : configOptions.json,
      avm: argv.avm ? argv.avm : configOptions.avm,
      debug: argv.debug ? argv.debug : configOptions.debug,
      opcodes: argv.opcodes ? argv.opcodes : configOptions.opcodes,
    };
    if (options.opcodes && !options.debug) {
      throw new Error('`opcodes` flag may only be specified alongside the `debug` flag');
    }
    await createTasks(
      path,
      outDir,
      // json: options.json ? options.json : !options.avm,
      // avm: options.avm ? options.avm : false,
      // debug: options.debug ? options.debug : false,
      // opcodes: options.opcodes ? options.opcodes : false,
    ).run();
  });
};
