import yargs from 'yargs';
import * as network from './network';

export const command = 'start';
export const describe = 'Start NEO•ONE services.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder.command(network);
