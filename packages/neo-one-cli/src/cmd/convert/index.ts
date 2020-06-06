import yargs from 'yargs';
import * as address from './address';
import * as privateKey from './privateKey';
import * as publicKey from './publicKey';
import * as scriptHash from './scriptHash';
import * as wif from './wif';

export const command = 'convert';
export const describe = 'Converts values.';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.command(address).command(privateKey).command(publicKey).command(scriptHash).command(wif);
