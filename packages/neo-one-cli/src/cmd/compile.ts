import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';
import { createTasks } from '../compile';

export const command = 'compile';
export const describe = 'Compiles a project and outputs code to a local directory.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('outDir')
    .describe('outDir', 'Output code directory.')
    .string('path')
    .describe('path', 'Contract directory.')
    .boolean('json')
    .describe('json', 'Output the contract with the JSON format.')
    .boolean('nef')
    .describe('nef', 'Output the contract with the Nef file format.')
    .boolean('debug')
    .describe('debug', 'Output additional debug information.')
    .boolean('opcodes')
    .describe('opcodes', 'Output the AVM in a human readable format for debugging (requires --debug).')
    .string('configPath')
    .describe('configPath', 'Optional path to the config file if not in root of project directory.');

export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (_cmd, config) => {
    const configOptions = config.contracts;
    const path = argv.path ? argv.path : configOptions.path;
    const outDir = argv.outDir ? argv.outDir : configOptions.outDir;
    const opcodes = argv.opcodes ? argv.opcodes : configOptions.opcodes;
    const debugIn = argv.debug ? argv.debug : configOptions.debug;
    const options = {
      json: argv.json ? argv.json : configOptions.json,
      nef: argv.nef ? argv.nef : configOptions.nef,
      debug: opcodes || debugIn,
      opcodes,
    };
    if (options.opcodes && !options.debug) {
      throw new Error('`opcodes` flag may only be specified alongside the `debug` flag.');
    }
    await createTasks(path, outDir, {
      json: options.json ? options.json : !options.nef,
      nef: options.nef ? options.nef : false,
      debug: options.debug ? options.debug : false,
      opcodes: options.opcodes ? options.opcodes : false,
    }).run();
  }, argv.configPath);
};
