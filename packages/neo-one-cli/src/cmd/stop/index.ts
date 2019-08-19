import yargs from 'yargs';
import * as network from './network';

export const command = 'stop';
export const describe = 'Stop NEO•ONE services.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder.command(network);
