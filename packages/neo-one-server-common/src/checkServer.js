/* @flow */
import fs from 'fs-extra';
import isRunning from 'is-running';
import { utils } from '@neo-one/utils';

import Client from './Client';

import killServer from './killServer';
import getServerPID from './getServerPID';

const isSameVersion = async ({
  port,
}: {|
  port: number,
|}): Promise<boolean> => {
  const client = new Client({ port });
  const startTime = utils.nowSeconds();
  while (utils.nowSeconds() - startTime <= 5) {
    try {
      // eslint-disable-next-line
      const version = await client.getVersion();
      return version === client.version;
    } catch (error) {
      // eslint-disable-next-line
    }
  }

  return false;
};

export default async ({
  port,
  pidPath,
}: {|
  port: number,
  pidPath: string,
|}): Promise<?number> => {
  const pid = await getServerPID({ pidPath });

  if (pid === process.pid) {
    return pid;
  }

  if (pid != null) {
    if (isRunning(pid)) {
      const sameVersion = await isSameVersion({ port });
      if (sameVersion) {
        return pid;
      }

      await killServer({ pid });
    }

    await fs.remove(pidPath);
  }

  return null;
};
