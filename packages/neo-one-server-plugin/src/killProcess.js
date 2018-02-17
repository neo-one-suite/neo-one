/* @flow */
import isRunning from 'is-running';
import { utils } from '@neo-one/utils';

import { FailedToKillProcessError } from './errors';

export default async (pid: number): Promise<void> => {
  const startTime = utils.nowSeconds();
  let alive = isRunning(pid);
  if (!alive) {
    return;
  }
  // eslint-disable-next-line
  while (utils.nowSeconds() - startTime <= 10) {
    try {
      let signal = 'SIGINT';
      if (utils.nowSeconds() - startTime > 7) {
        signal = 'SIGKILL';
      } else if (utils.nowSeconds() - startTime > 5) {
        signal = 'SIGTERM';
      }
      process.kill(pid, signal);
    } catch (error) {
      if (error.code === 'ESRCH') {
        return;
      }

      throw error;
    }
    await new Promise(resolve => setTimeout(() => resolve(), 1000));
    alive = isRunning(pid);
    if (!alive) {
      return;
    }
  }

  throw new FailedToKillProcessError(pid);
};
