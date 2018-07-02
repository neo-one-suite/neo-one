import { Binary, killProcess } from '@neo-one/server-plugin';
import { utils } from '@neo-one/utils';
import execa from 'execa';
import * as fs from 'fs-extra';
import isRunning from 'is-running';
import * as path from 'path';
import { Client } from './Client';

const SERVER_PID = 'server.pid';

const isSameVersion = async ({
  port,
  expectedVersion,
}: {
  readonly port: number;
  readonly expectedVersion: string;
}): Promise<boolean> => {
  const client = new Client({ port });
  const startTime = utils.nowSeconds();
  // tslint:disable-next-line no-loop-statement
  while (utils.nowSeconds() - startTime <= 5) {
    try {
      const version = await client.getVersion();

      return version === expectedVersion;
    } catch {
      // ignore errors
    }
  }

  return false;
};

const waitRunning = async ({ pid }: { readonly pid: number }) => {
  const startTime = utils.nowSeconds();
  // tslint:disable-next-line no-loop-statement
  while (!isRunning(pid) && utils.nowSeconds() - startTime <= 5) {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
};

const waitReachable = async ({ port }: { readonly port: number }) => {
  const client = new Client({ port });
  const startTime = utils.nowSeconds();
  let lastError;
  // tslint:disable-next-line no-loop-statement
  while (utils.nowSeconds() - startTime <= 30) {
    try {
      await client.wait(1000);

      return;
    } catch (error) {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      lastError = error;
    }
  }

  if (lastError != undefined) {
    throw lastError;
  }
};

export class ServerManager {
  private readonly dataPath: string;
  private readonly serverVersion: string;

  public constructor({ dataPath, serverVersion }: { readonly dataPath: string; readonly serverVersion: string }) {
    this.dataPath = dataPath;
    this.serverVersion = serverVersion;
  }

  public async getServerPID(): Promise<number | undefined> {
    let pidContents;
    try {
      pidContents = await fs.readFile(this.pidPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return undefined;
      }

      throw error;
    }

    try {
      return parseInt(pidContents, 10);
    } catch {
      await fs.remove(this.pidPath);

      return undefined;
    }
  }

  public async checkAlive(port: number): Promise<number | undefined> {
    const pid = await this.getServerPID();

    if (pid === process.pid) {
      return pid;
    }

    if (pid !== undefined) {
      if (isRunning(pid)) {
        const sameVersion = await isSameVersion({
          port,
          expectedVersion: this.serverVersion,
        });

        if (sameVersion) {
          return pid;
        }

        await this.kill({ pid });
      }

      await fs.remove(this.pidPath);
    }

    return undefined;
  }

  public async kill(optionsIn?: { readonly pid: number }): Promise<void> {
    let pid = optionsIn === undefined ? undefined : optionsIn.pid;
    if (pid === undefined) {
      pid = await this.getServerPID();
    }
    if (pid === undefined) {
      return;
    }

    await killProcess(pid);
  }

  public async start({
    port,
    binary,
    onStart,
  }: {
    readonly port: number;
    readonly binary: Binary;
    readonly onStart?: () => void;
  }): Promise<{ readonly pid: number; readonly started: boolean }> {
    const pid = await this.checkAlive(port);
    if (pid !== undefined) {
      return { pid, started: false };
    }

    if (onStart !== undefined) {
      onStart();
    }

    const child = execa(binary.cmd, binary.firstArgs.concat(['start', 'server']), {
      detached: true,
      stdio: 'ignore',
      // @ts-ignore
      windowsHide: true,
      cleanup: false,
    });

    child.unref();

    await waitRunning({ pid: child.pid });
    await waitReachable({ port });

    return { pid: child.pid, started: true };
  }

  public async writePID(pid: number): Promise<void> {
    await fs.ensureDir(path.dirname(this.pidPath));
    await fs.writeFile(this.pidPath, `${pid}`);
  }

  public get pidPath(): string {
    return path.resolve(this.dataPath, SERVER_PID);
  }
}
