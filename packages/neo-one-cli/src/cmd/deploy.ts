import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';
import { deploy } from '../deploy';

export const command = 'deploy';
export const describe = 'Deploys the project using the migration file.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('network')
    .describe('network', 'Network to run the migration on.')
    .default('network', 'test');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (cmd, config) => {
    await deploy(cmd, config, argv.network);
  });
};
