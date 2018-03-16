/* @flow */
import { Client, createServerConfig } from '@neo-one/server-client';
import {
  type CLIArgs,
  type Paths,
  paths as defaultPaths,
} from '@neo-one/server-plugin';
import Vorpal from 'vorpal';

import { map, take } from 'rxjs/operators';
import path from 'path';
import { plugins as pluginsUtil } from '@neo-one/server';

import commands from './commands';
import pkg from '../package.json';
import { createBinary, setupCLI } from './utils';

export default class CLI {
  _debug: boolean;
  _plugins: Set<string>;
  serverConfig: {|
    dir?: string,
    serverPort?: number,
    minPort?: number,
  |};
  paths: Paths;

  constructor({
    debug,
    dir,
    serverPort,
    minPort,
  }: {|
    debug: boolean,
    dir?: string,
    serverPort?: number,
    minPort?: number,
  |}) {
    this._debug = debug;
    this._plugins = new Set();
    this.serverConfig = { dir, serverPort, minPort };
    this.paths = {
      data: dir == null ? defaultPaths.data : path.join(dir, 'data'),
      config: dir == null ? defaultPaths.config : path.join(dir, 'config'),
      cache: dir == null ? defaultPaths.cache : path.join(dir, 'cache'),
      log: dir == null ? defaultPaths.log : path.join(dir, 'log'),
      temp: dir == null ? defaultPaths.temp : path.join(dir, 'temp'),
    };
  }

  async start(argv: Array<string>): Promise<void> {
    const vorpal = new Vorpal();
    vorpal.version(pkg.version);

    const { monitor, config$: logConfig$, shutdownFuncs, shutdown } = setupCLI({
      logConsole: false,
      vorpal,
      debug: this._debug,
    });

    const cliArgs = {
      monitor,
      vorpal,
      debug: this._debug,
      binary: createBinary(argv, this.serverConfig),
      shutdown,
      shutdownFuncs,
      logConfig$,
      serverArgs: this.serverConfig,
      paths: this.paths,
    };
    commands.forEach(command => command(cliArgs));

    const cmd = argv.slice(2).join(' ');
    if (!this._exists(vorpal, cmd)) {
      this._installDefaultPlugins(cliArgs);
      if (!this._exists(vorpal, cmd)) {
        await this._installPlugins(cliArgs);
      }
    }

    vorpal.exec(cmd);
  }

  _exists(vorpalIn: Vorpal, cmd: string): boolean {
    const vorpal = (vorpalIn: $FlowFixMe);
    const result = vorpal.util.parseCommand(cmd, vorpal.commands);
    return result.match != null;
  }

  _installDefaultPlugins(cliArgs: CLIArgs): void {
    for (const plugin of pluginsUtil.DEFAULT_PLUGINS) {
      this._installPlugin(plugin, cliArgs);
    }
  }

  async _installPlugins(cliArgs: CLIArgs): Promise<void> {
    const serverConfig = createServerConfig({
      paths: cliArgs.paths,
      serverPort: this.serverConfig.serverPort,
      minPort: this.serverConfig.minPort,
    });
    const port = await serverConfig.config$
      .pipe(map(conf => conf.server.port), take(1))
      .toPromise();
    const client = new Client({ port });
    const plugins = await client.getAllPlugins();
    for (const plugin of plugins) {
      this._installPlugin(plugin, cliArgs);
    }
  }

  _installPlugin(pluginName: string, cliArgs: CLIArgs): void {
    if (!this._plugins.has(pluginName)) {
      this._plugins.add(pluginName);
      const plugin = pluginsUtil.getPlugin({
        monitor: cliArgs.monitor,
        pluginName,
      });
      plugin.commands.forEach(command => command(cliArgs));
    }
  }
}
