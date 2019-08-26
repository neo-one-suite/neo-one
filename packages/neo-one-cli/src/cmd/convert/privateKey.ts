// tslint:disable no-console
import {
  privateKeyToAddress,
  privateKeyToPublicKey,
  privateKeyToScriptHash,
  privateKeyToWIF,
} from '@neo-one/client-common';
import { Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { start } from '../../common';

export const command = 'private-key <value>';
export const describe = 'Convert a private key to various formats and print them to stdout.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.positional('value', { type: 'string' }).demandOption('value');
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
  start(async () => {
    const privateKey = argv.value;
    const wif = privateKeyToWIF(privateKey);
    const address = privateKeyToAddress(privateKey);
    const publicKey = privateKeyToPublicKey(privateKey);
    const scriptHash = privateKeyToScriptHash(privateKey);
    console.log(`Private Key: ${privateKey}`);
    console.log(`WIF: ${wif}`);
    console.log(`Address: ${address}`);
    console.log(`Public Key: ${publicKey}`);
    console.log(`Script Hash: ${scriptHash}`);
  });
};
