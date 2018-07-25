import { utils } from '@neo-one/utils';
import isRunning from 'is-running';
import { FailedToKillProcessError } from './errors';

export const killProcess = async (pid: number): Promise<void> => {
  const startTime = utils.nowSeconds();
  let alive = isRunning(pid);
  if (!alive) {
    return;
  }

  // tslint:disable-next-line no-loop-statement
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
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    alive = isRunning(pid);
    if (!alive) {
      return;
    }
  }

  throw new FailedToKillProcessError(pid);
};
