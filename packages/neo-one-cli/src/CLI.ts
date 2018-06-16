import { plugins as pluginsUtil } from '@neo-one/server';
import { Client, createServerConfig } from '@neo-one/server-client';
import { CLIArgs, paths as defaultPaths } from '@neo-one/server-plugin';
import { Paths } from 'env-paths';
import path from 'path';
import { map, take } from 'rxjs/operators';
import Vorpal from 'vorpal';
import pkg from '../package.json';
import { commands } from './commands';
import { createBinary, setupCLI } from './utils';

export class CLI {
  public readonly serverConfig: {
    readonly dir?: string;
    readonly serverPort?: number;
    readonly minPort?: number;
  };
  public readonly paths: Paths;
  private readonly debug: boolean;
  private readonly plugins: Set<string>;

  public constructor({
    debug,
    dir,
    serverPort,
    minPort,
  }: {
    readonly debug: boolean;
    readonly dir?: string;
    readonly serverPort?: number;
    readonly minPort?: number;
  }) {
    this.debug = debug;
    this.plugins = new Set();
    this.serverConfig = { dir, serverPort, minPort };
    this.paths = {
      data: dir === undefined ? defaultPaths.data : path.join(dir, 'data'),
      config: dir === undefined ? defaultPaths.config : path.join(dir, 'config'),
      cache: dir === undefined ? defaultPaths.cache : path.join(dir, 'cache'),
      log: dir === undefined ? defaultPaths.log : path.join(dir, 'log'),
      temp: dir === undefined ? defaultPaths.temp : path.join(dir, 'temp'),
    };
  }

  public async start(argv: ReadonlyArray<string>): Promise<void> {
    const vorpal = new Vorpal();
    vorpal.version(pkg.version);

    const { monitor, config$: logConfig$, mutableShutdownFuncs, shutdown } = setupCLI({
      logConsole: false,
      vorpal,
      debug: this.debug,
    });

    const cliArgs: CLIArgs = {
      monitor,
      vorpal,
      debug: this.debug,
      binary: createBinary(argv, this.serverConfig),
      shutdown,
      mutableShutdownFuncs,
      logConfig$,
      serverArgs: this.serverConfig,
      paths: this.paths,
    };

    commands.forEach((command) => command(cliArgs));

    const cmd = argv.slice(2).join(' ');
    if (!this.exists(vorpal, cmd)) {
      this.installDefaultPlugins(cliArgs);
      if (!this.exists(vorpal, cmd)) {
        await this.installPlugins(cliArgs);
      }
    }

    await vorpal.exec(cmd);
  }

  private exists(vorpalIn: Vorpal, cmd: string): boolean {
    // tslint:disable-next-line no-any
    const vorpal = vorpalIn as any;
    const result = vorpal.util.parseCommand(cmd, vorpal.commands);

    return result.match != undefined;
  }

  private installDefaultPlugins(cliArgs: CLIArgs): void {
    pluginsUtil.DEFAULT_PLUGINS.forEach((plugin) => {
      this.installPlugin(plugin, cliArgs);
    });
  }

  private async installPlugins(cliArgs: CLIArgs): Promise<void> {
    const serverConfig = createServerConfig({
      paths: cliArgs.paths,
      serverPort: this.serverConfig.serverPort,
      minPort: this.serverConfig.minPort,
    });

    const port = await serverConfig.config$
      .pipe(
        map((conf) => conf.server.port),
        take(1),
      )
      .toPromise();
    const client = new Client({ port });
    const plugins = await client.getAllPlugins();
    plugins.forEach((plugin) => {
      this.installPlugin(plugin, cliArgs);
    });
  }

  private installPlugin(pluginName: string, cliArgs: CLIArgs): void {
    if (!this.plugins.has(pluginName)) {
      this.plugins.add(pluginName);
      const plugin = pluginsUtil.getPlugin({
        monitor: cliArgs.monitor,
        pluginName,
      });

      plugin.commands.forEach((command) => command(cliArgs));
    }
  }
}
