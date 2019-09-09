// tslint:disable no-console
import { publicKeyToAddress, publicKeyToScriptHash } from '@neo-one/client-common';
import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../../common';

export const command = 'public-key <value>';
export const describe = 'Convert an address to various formats and print them to stdout.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.positional('value', { type: 'string' }).demandOption('value');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async () => {
    const publicKey = argv.value;
    const address = publicKeyToAddress(publicKey);
    const scriptHash = publicKeyToScriptHash(publicKey);
    console.log(`PublicKey: ${address}`);
    console.log(`Address: ${address}`);
    console.log(`Script Hash: ${scriptHash}`);
  });
};
