// tslint:disable no-console
import { scriptHashToAddress } from '@neo-one/client-common';
import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../../common';

export const command = 'script-hash <value>';
export const describe = 'Convert a script hash to various formats and print them to stdout.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.positional('value', { type: 'string' }).demandOption('value');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async () => {
    const scriptHash = argv.value;
    const address = scriptHashToAddress(scriptHash);
    console.log(`Script Hash: ${scriptHash}`);
    console.log(`Address: ${address}`);
  });
};
