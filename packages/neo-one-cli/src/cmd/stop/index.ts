import yargs from 'yargs';
import * as neotracker from './neotracker';
import * as network from './network';

export const command = 'stop';
export const describe = 'Stops NEO•ONE services.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder.command(network).command(neotracker);
