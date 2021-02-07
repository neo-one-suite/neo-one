import { configToSerializable } from '@neo-one/cli-common-node';
import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../common';

export const command = 'info';
export const describe = 'Prints project configuration.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('configPath')
    .describe('configPath', 'Optional path to the config file if not in root of project directory.');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async (_cmd, config) => {
    // tslint:disable-next-line no-console
    console.log(JSON.stringify(configToSerializable(config), undefined, 2));
  }, argv.configPath);
};
