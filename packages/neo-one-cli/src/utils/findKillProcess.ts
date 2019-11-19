import { Configuration } from '@neo-one/cli-common';
import * as fs from 'fs-extra';
import { getProcessIDFile } from '../common';
import { killProcess } from './killProcess';

export const findKillProcess = async (name: 'network' | 'neotracker', config: Configuration) => {
  const file = getProcessIDFile(config, name);
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
};
