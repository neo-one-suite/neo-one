import yargs from 'yargs';
import { start } from '../../common';
import { findKillProcess } from '../../utils';

export const command = 'neotracker';
export const describe = 'Stops the local NEO Tracker instance.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder;
export const handler = () => {
  start(async (_cmd, config) => {
    await findKillProcess('neotracker', config);
  });
};
