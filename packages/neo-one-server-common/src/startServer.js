/* @flow */
import isRunning from 'is-running';
import { spawn } from 'child_process';
import { utils } from '@neo-one/utils';

import Client from './Client';

import checkServer from './checkServer';
import getServerPIDPath from './getServerPIDPath';

const waitRunning = async ({ pid }: {| pid: number |}) => {
  const startTime = utils.nowSeconds();
  while (!isRunning(pid) && utils.nowSeconds() - startTime <= 5) {
    // eslint-disable-next-line
    await new Promise(resolve => setTimeout(() => resolve(), 100));
  }
};

// TODO: Figure out why this takes so long when we are the ones that spawned
//       the process.
const waitReachable = async ({ port }: {| port: number |}) => {
  const client = new Client({ port });
  const startTime = utils.nowSeconds();
  let lastError;
  while (utils.nowSeconds() - startTime <= 30) {
    try {
      // eslint-disable-next-line
      await client.wait(1000);
      return;
    } catch (error) {
      // eslint-disable-next-line
      await new Promise(resolve => setTimeout(() => resolve(), 100));
      lastError = error;
      // eslint-disable-next-line
    }
  }

  if (lastError != null) {
    throw lastError;
  }
};

export default async ({
  port,
  dataPath,
  binary,
  onStart,
}: {|
  port: number,
  dataPath: string,
  binary: Array<string>,
  onStart?: () => void,
|}): Promise<{| pid: number, started: boolean |}> => {
  const pidPath = getServerPIDPath({ dataPath });
  const pid = await checkServer({ port, pidPath });
  if (pid != null) {
    return { pid, started: false };
  }

  if (onStart != null) {
    onStart();
  }

  // eslint-disable-next-line
  const [cmd0, cmd1, ...args] = binary;
  const child = spawn(cmd0, [cmd1, 'start', 'server'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  await waitRunning({ pid: child.pid });
  await waitReachable({ port });

  return { pid: child.pid, started: true };
};
