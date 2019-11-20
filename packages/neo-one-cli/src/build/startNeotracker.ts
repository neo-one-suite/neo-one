import { Configuration } from '@neo-one/cli-common';
import execa from 'execa';
import { isRunning } from '../common';
import { Command } from '../types';
import { findKillProcess } from '../utils';

export const startNeotracker = async (cmd: Command, config: Configuration, reset: boolean) => {
  const args = cmd.args.concat(['start', 'neotracker']);
  if (reset) {
    await findKillProcess('neotracker', config);
  }

  const proc = execa(cmd.bin, reset ? args.concat(['--reset']) : args, {
    cleanup: false,
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  const start = Date.now();
  const timeoutMS = 30 * 1000;
  let ready = false;
  if (reset) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  // tslint:disable-next-line no-loop-statement
  while (Date.now() - start < timeoutMS) {
    try {
      const response = await isRunning(config.neotracker.port);
      if (response) {
        ready = true;
        break;
      }
    } catch {
      // do nothing
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!ready) {
    throw new Error('Neotracker is not ready.');
  }
};
