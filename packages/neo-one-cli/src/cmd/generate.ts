import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';
import { createTasks } from '../generate';

export const command = 'generate';
export const describe = 'Compiles the contracts and generates common code.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('configPath')
    .describe('configPath', 'Optional path to the config file if not in root of project directory.');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (cmd, config) => {
    await createTasks(cmd, config).run();
  }, argv.configPath);
};
