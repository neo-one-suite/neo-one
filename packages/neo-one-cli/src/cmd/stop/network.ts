import * as fs from 'fs-extra';
import yargs from 'yargs';
import { getNetworkProcessIDFile, start } from '../../common';
import { killProcess } from '../../utils';

export const command = 'network';
export const describe = 'Stops the local development network.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder;
export const handler = () => {
  start(async (_cmd, config) => {
    const file = getNetworkProcessIDFile(config);
    let pid: number | undefined;
    try {
      const contents = await fs.readFile(file, 'utf8');
      pid = parseInt(contents, 10);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (pid !== undefined) {
      await killProcess(pid);
    }
  });
};
