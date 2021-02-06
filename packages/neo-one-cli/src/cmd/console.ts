import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';
import { startConsole } from '../console';

const defaultNetworks: readonly string[] = ['local'];

export const command = 'console';
export const describe = 'Starts a REPL with project contracts and client APIs available.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .array('networks')
    .describe('networks', 'Networks to initialize before starting the REPL.')
    .default('networks', defaultNetworks)
    .string('configPath')
    .describe('configPath', 'Optional path to the config file if not in root of project directory.');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (_cmd, config) => startConsole(config, argv.networks), argv.configPath);
};
