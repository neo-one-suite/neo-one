/* @flow */
import fs from 'fs-extra';
import { killProcess } from '@neo-one/server-plugin';
import isRunning from 'is-running';
import path from 'path';
import spawn from 'cross-spawn';
import { utils } from '@neo-one/utils';

import Client from './Client';

const SERVER_PID = 'server.pid';

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

const waitRunning = async ({ pid }: {| pid: number |}) => {
  const startTime = utils.nowSeconds();
  while (!isRunning(pid) && utils.nowSeconds() - startTime <= 5) {
    // eslint-disable-next-line
    await new Promise(resolve => setTimeout(() => resolve(), 100));
  }
};

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

export default class ServerManager {
  _dataPath: string;

  constructor({ dataPath }: {| dataPath: string |}) {
    this._dataPath = dataPath;
  }

  async getServerPID(): Promise<?number> {
    let pidContents;
    try {
      pidContents = await fs.readFile(this.pidPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }

      throw error;
    }

    try {
      return parseInt(pidContents, 10);
    } catch (error) {
      await fs.remove(this.pidPath);
      return null;
    }
  }

  async checkAlive(port: number): Promise<?number> {
    const pid = await this.getServerPID();

    if (pid === process.pid) {
      return pid;
    }

    if (pid != null) {
      if (isRunning(pid)) {
        const sameVersion = await isSameVersion({ port });
        if (sameVersion) {
          return pid;
        }

        await this.kill({ pid });
      }

      await fs.remove(this.pidPath);
    }

    return null;
  }

  async kill(optionsIn?: {| pid: number |}): Promise<void> {
    let { pid } = optionsIn || {};
    if (pid == null) {
      pid = await this.getServerPID();
    }
    if (pid == null) {
      return;
    }

    await killProcess(pid);
  }

  async start({
    port,
    binary,
    onStart,
  }: {|
    port: number,
    binary: Array<string>,
    onStart?: () => void,
  |}): Promise<{| pid: number, started: boolean |}> {
    const pid = await this.checkAlive(port);
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
  }

  async writePID(pid: number): Promise<void> {
    await fs.ensureDir(path.dirname(this.pidPath));
    await fs.writeFile(this.pidPath, `${pid}`);
  }

  get pidPath(): string {
    return path.resolve(this._dataPath, SERVER_PID);
  }
}
