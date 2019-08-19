import yargs from 'yargs';
import { createTasks } from '../build';
import { start } from '../common';
import { Yarguments } from '../types';

export const command = 'build';
export const describe = 'Builds the project and deploys it to the local development network.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('reset')
    .describe('reset', 'Reset the local project.')
    .default('reset', false);
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (cmd, config) => {
    await createTasks(cmd, config, argv.reset).run();
  });
};
