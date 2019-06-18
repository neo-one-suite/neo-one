import { Client as HTTPClient } from '@neo-one/server-http-client';
import { Binary, killProcess } from '@neo-one/server-plugin';
import { utils } from '@neo-one/utils';
import execa from 'execa';
import * as fs from 'fs-extra';
import isRunning from 'is-running';
import * as path from 'path';
import semver from 'semver';
import { Client } from './Client';
import { npmCheck } from './npmCheck';

const SERVER_PID = 'server.pid';
const SERVER_VER = 'lastserver.ver';
const SERVER_CHK = 'lastcheck.dat';
const CHECK_DELAY_SEC = 600;
const CHECK_TIMEOUT_MS = 5000;

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
    let versionContents: string | undefined;
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

  public async getCurrentVersion({ port }: { readonly port: number }): Promise<string | undefined> {
    const client = new Client({ port });
    const startTime = utils.nowSeconds();
    // tslint:disable-next-line no-loop-statement
    while (utils.nowSeconds() - startTime <= 5) {
      try {
        /*tslint:disable-next-line:prefer-immediate-return */
        const version = await client.getVersion();

        /* tslint:disable-next-line:no-var-before-return */
        return version;
      } catch {
        // ignore errors...
      }
    }

    return this.getServerVersion();
  }

  public compareVersions(verA: string, verB: string): 0 | 1 | -1 {
    return verA === verB ? 0 : semver.lt(verA, verB) ? 1 : -1;
  }

  public async getRelativeServerVersion({
    port,
    expectedVersion,
  }: {
    readonly port: number;
    readonly expectedVersion: string;
  }): Promise<number | undefined> {
    const version = await this.getCurrentVersion({ port });
    if (version !== undefined) {
      return this.compareVersions(version, expectedVersion);
    }

    return version;
  }

  public async getNewerServerVersion(): Promise<string | undefined> {
    const npmVersion = await npmCheck('@neo-one/cli', this.checkPath, CHECK_TIMEOUT_MS, CHECK_DELAY_SEC);

    return npmVersion !== undefined && this.compareVersions(this.serverVersion, npmVersion) > 0
      ? npmVersion
      : undefined;
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

  public async writeVersionPID(pid: number, version: string): Promise<void> {
    await Promise.all([this.writePID(pid), this.writeVersion(version)]);
  }

  public async writeVersion(version: string): Promise<void> {
    await fs.ensureDir(path.dirname(this.versionPath));
    await fs.writeFile(this.versionPath, `${version}`);
  }

  public async writePID(pid: number) {
    await fs.ensureDir(path.dirname(this.pidPath));
    await fs.writeFile(this.pidPath, `${pid}`);
  }

  public get checkPath(): string {
    return path.resolve(this.dataPath, SERVER_CHK);
  }

  public get pidPath(): string {
    return path.resolve(this.dataPath, SERVER_PID);
  }

  public get versionPath(): string {
    return path.resolve(this.dataPath, SERVER_VER);
  }
}
