import { Client as HTTPClient } from '@neo-one/server-http-client';
import { Binary, killProcess } from '@neo-one/server-plugin';
import { utils } from '@neo-one/utils';
import execa from 'execa';
import * as fs from 'fs-extra';
import isRunning from 'is-running';
import * as path from 'path';
import semver from 'semver';
import { Client } from './Client';

const SERVER_PID = 'server.pid';
const SERVER_VER = 'lastserver.ver';

const waitRunning = async ({ pid }: { readonly pid: number }) => {
  const startTime = utils.nowSeconds();
  // tslint:disable-next-line no-loop-statement
  while (!isRunning(pid) && utils.nowSeconds() - startTime <= 5) {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
};

const waitReachable = async ({ port }: { readonly port: number }) => {
  const client = new HTTPClient(port);
  const startTime = utils.nowSeconds();
  let lastError;
  // tslint:disable-next-line no-loop-statement
  while (utils.nowSeconds() - startTime <= 30) {
    try {
      await client.ready();

      return;
    } catch (error) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
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

  private async getCurrentVersion({
    port,
    expectedVersion,
  }: {
    readonly port: number;
    readonly expectedVersion: string;
  }): Promise<string | undefined> {
    const client = new Client({ port });
    const startTime = utils.nowSeconds();
    // tslint:disable-next-line no-loop-statement
    while (utils.nowSeconds() - startTime <= 5) {
      try {
        return client.getVersion();
      } catch {
        // ignore errors...
      }
    }
    return this.getServerVersion();
  }

  public async getRelativeServerVersion({
    port,
    expectedVersion,
  }: {
    readonly port: number;
    readonly expectedVersion: string;
  }): Promise<number | undefined> {
    const version = await this.getCurrentVersion({ port, expectedVersion });
    if (version !== undefined) {
      return version === expectedVersion ? 0 : semver.lt(version, expectedVersion) ? -1 : 1;
    }

    return version;
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
  public async getServerVersion(): Promise<string | undefined> {
    let versionContents = '';
    try {
      versionContents = await fs.readFile(this.versionPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return undefined;
      }

      throw error;
    }

    return versionContents;
  }

  public async checkAlive(port: number): Promise<number | undefined> {
    const pid = await this.getServerPID();

    if (pid === process.pid) {
      return pid;
    }
    if (pid !== undefined) {
      if (isRunning(pid)) {
        const serverVersion = await this.getRelativeServerVersion({
          port,
          expectedVersion: this.serverVersion,
        });
        const clientVersion = 0;

        if (serverVersion === clientVersion) {
          return pid;
        }

        if (serverVersion === undefined) {
          return undefined;
        }

        if (serverVersion > clientVersion) {
          throw new Error(
            '[NEO•ONE] version conflict: server is newer than client. Please upgrade NEO•ONE and try again.',
          );
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
    httpPort,
    binary,
    onStart,
  }: {
    readonly port: number;
    readonly httpPort: number;
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
    await waitReachable({ port: httpPort });

    return { pid: child.pid, started: true };
  }

  public async writeVersionPid(pid: number, version: string): Promise<void> {
    await fs.ensureDir(path.dirname(this.pidPath));
    await fs.writeFile(this.pidPath, `${pid}`);
    await fs.writeFile(this.versionPath, `${version}`);
  }

  public get versionPath(): string {
    return path.resolve(this.dataPath, SERVER_VER);
  }

  public get pidPath(): string {
    return path.resolve(this.dataPath, SERVER_PID);
  }
}
