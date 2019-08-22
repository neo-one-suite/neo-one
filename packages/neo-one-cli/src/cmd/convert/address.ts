// tslint:disable no-console
import { addressToScriptHash } from '@neo-one/client-common';
import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../../common';

export const command = 'address <value>';
export const describe = 'Convert an address to various formats and print them to stdout.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.positional('value', { type: 'string' }).demandOption('value');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async () => {
    const address = argv['value'];
    const scriptHash = addressToScriptHash(address);
    console.log(`Address: ${address}`);
    console.log(`Script Hash: ${scriptHash}`);
  });
};
