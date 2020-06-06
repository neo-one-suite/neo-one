import yargs from 'yargs';
import * as privateKey from './privateKey';

export const command = 'new';
export const describe = 'Creates new resources.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder.command(privateKey);
