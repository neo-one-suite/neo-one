import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { createTasks } from '../build';
import { start } from '../common';

export const command = 'build';
export const describe = 'Builds the project and deploys it to the local development network.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .boolean('reset')
    .describe('reset', 'Reset the local project.')
    .default('reset', false)
    .string('configPath')
    .describe('configPath', 'Optional path to the config file if not in the root of project directory.');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (cmd, config) => {
    await createTasks(cmd, config, argv.reset).run();
  }, argv.configPath);
};
