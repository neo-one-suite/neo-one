import { Configuration } from '@neo-one/cli-common';
import { ExecaChildProcess } from 'execa';
import * as fs from 'fs-extra';
import * as nodePath from 'path';
import { getProcessIDFile } from '../../common';

export const writePidFile = async (
  name: 'network' | 'neotracker',
  proc: NodeJS.Process | ExecaChildProcess,
  config: Configuration,
) => {
  const pidFile = getProcessIDFile(config, name);
  await fs.ensureDir(nodePath.dirname(pidFile));
  await fs.writeFile(pidFile, `${proc.pid}`);
};
