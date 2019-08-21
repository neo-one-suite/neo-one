import { Configuration } from '@neo-one/client-common';
import { DeveloperClient, NEOONEDataProvider } from '@neo-one/client-core';
import fetch from 'cross-fetch';
import execa from 'execa';
import { Command } from '../types';

export const startNetwork = async (cmd: Command, config: Configuration, reset: boolean) => {
  const proc = execa(cmd.bin, cmd.args.concat(['start', 'network']), {
    cleanup: false,
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  const start = Date.now();
  const timeoutMS = 5 * 1000;
  let ready = false;
  // tslint:disable-next-line no-loop-statement
  while (Date.now() - start < timeoutMS) {
    try {
      const response = await fetch(`http://localhost:${config.network.port}/ready_health_check`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // do nothing
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!ready) {
    throw new Error('Network is not ready.');
  }

  if (reset) {
    const client = new DeveloperClient(
      new NEOONEDataProvider({ network: 'local', rpcURL: `http://localhost:${config.network.port}/rpc` }),
    );
    await client.reset();
  }
};
