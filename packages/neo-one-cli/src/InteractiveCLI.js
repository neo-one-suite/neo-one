/* @flow */
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { VERSION, plugins as pluginsUtil } from '@neo-one/server';
import {
  Client,
  PluginNotInstalledError,
  ServerManager,
  UnknownPluginResourceType,
  createServerConfig,
} from '@neo-one/server-client';
import {
  type Config,
  type CLIHook,
  type DescribeTable,
  type ListTable,
  type Plugin,
  type ResourceType,
  type Session,
  name,
  paths as defaultPaths,
} from '@neo-one/server-plugin';
import type { Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';
import Table from 'cli-table2';
import Vorpal, { type Args } from 'vorpal';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { defer } from 'rxjs/observable/defer';
import {
  distinctUntilChanged,
  map,
  mergeScan,
  publishReplay,
  refCount,
  switchMap,
  take,
} from 'rxjs/operators';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';

import {
  type ClientConfig,
  createBinary,
  createClientConfig,
  setupCLI,
} from './utils';

import commands, { createPlugin } from './interactive';
import pkg from '../package.json';

const getTable = (head?: Array<string>) =>
  new Table({
    head,
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ' ',
    },
    style: {
      head: [],
      border: [],
      'padding-left': 0,
      'padding-right': 0,
    },
  });

type Sessions = { [plugin: string]: Session };

export default class InteractiveCLI {
  vorpal: Vorpal;
  client: Client;
  clientConfig: Config<ClientConfig>;
  debug: boolean;
  _sessions: Sessions;
  _sessions$: BehaviorSubject<Sessions>;
  _preHooks: { [command: string]: Array<CLIHook> };
  _postHooks: { [command: string]: Array<CLIHook> };
  _delimiter: Array<{| key: string, name: string |}>;
  _monitor: ?Monitor;
  _plugins: { [name: string]: Plugin };
  _serverConfig: {|
    dir?: string,
    serverPort?: number,
    minPort?: number,
  |};

  _logPath: ?string;

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
    this.vorpal = new Vorpal().version(pkg.version);
    this.debug = debug;
    this._sessions = {};
    this._sessions$ = new BehaviorSubject({});
    this._preHooks = {};
    this._postHooks = {};
    this._delimiter = [];
    this._monitor = null;
    this._plugins = {};
    this._serverConfig = { dir, serverPort, minPort };

    this._logPath = null;
  }

  async getSession(plugin: string): Promise<Session> {
    return this._sessions[plugin] || {};
  }

  updateSession(plugin: string, session: Session): void {
    this._sessions[plugin] = session;
    this._sessions$.next(this._sessions);
  }

  mergeSession(plugin: string, session: Session): void {
    this._sessions[plugin] = {
      ...(this._sessions[plugin] || {}),
      ...session,
    };
    this._sessions$.next(this._sessions);
  }

  getSession$(plugin: string): Observable<Session> {
    return this._sessions$.pipe(map(sessions => sessions[plugin] || {}));
  }

  addDelimiter(keyIn: string, nameIn: string): void {
    this._filterDelimiter(keyIn);
    this._delimiter.push({ key: keyIn, name: nameIn });
    this._setDelimiter();
  }

  removeDelimiter(keyIn: string): void {
    this._filterDelimiter(keyIn);
    this._setDelimiter();
  }

  resetDelimiter(): void {
    this._delimiter = [];
    this._setDelimiter();
  }

  _filterDelimiter(keyIn: string): void {
    this._delimiter = this._delimiter.filter(({ key }) => key !== keyIn);
  }

  _setDelimiter(): void {
    if (this._delimiter.length === 0) {
      this.vorpal.delimiter(`${name.cli}$`);
    } else {
      this.vorpal.delimiter(
        `${this._delimiter.map(({ name: delimName }) => delimName).join(' ')}$`,
      );
    }
  }

  get monitor(): Monitor {
    if (this._monitor == null) {
      throw new Error('Attempted to access monitor before it was available');
    }
    return this._monitor;
  }

  async start(argv: Array<string>): Promise<void> {
    const { dir } = this._serverConfig;
    const paths = {
      data: dir == null ? defaultPaths.data : path.join(dir, 'data'),
      config: dir == null ? defaultPaths.config : path.join(dir, 'config'),
      cache: dir == null ? defaultPaths.cache : path.join(dir, 'cache'),
      log: dir == null ? defaultPaths.log : path.join(dir, 'log'),
      temp: dir == null ? defaultPaths.temp : path.join(dir, 'temp'),
    };
    const {
      monitor,
      config$: logConfig$,
      shutdownFuncs,
      shutdown: shutdownIn,
    } = setupCLI({
      vorpal: this.vorpal,
      debug: this.debug,
    });
    this._monitor = monitor;
    this.clientConfig = createClientConfig({ paths });

    let isShutdown = false;
    const shutdown = arg => {
      shutdownIn(arg);
      isShutdown = true;
    };

    const logSubscription = combineLatest(
      this.clientConfig.config$.pipe(
        map(config => config.paths.log),
        distinctUntilChanged(),
      ),
      this.clientConfig.config$.pipe(
        map(config => config.log),
        distinctUntilChanged(),
      ),
    )
      .pipe(
        map(([logPath, config]) => {
          this._logPath = logPath;
          return {
            name: 'interactiveCLI',
            path: logPath,
            level: config.level,
            maxSize: config.maxSize,
            maxFiles: config.maxFiles,
          };
        }),
      )
      .subscribe(logConfig$);
    shutdownFuncs.push(() => logSubscription.unsubscribe());

    const serverConfig = createServerConfig({
      paths,
      serverPort: this._serverConfig.serverPort,
      minPort: this._serverConfig.minPort,
    });
    const start$ = combineLatest(
      serverConfig.config$.pipe(
        map(conf => conf.paths.data),
        distinctUntilChanged(),
      ),
      serverConfig.config$.pipe(
        map(conf => conf.server.port),
        distinctUntilChanged(),
      ),
    ).pipe(
      mergeScan(
        (managerIn, [dataPath, port]) =>
          defer(async () => {
            let manager = managerIn;
            const first = manager == null;
            if (manager != null) {
              await manager.kill();
            }
            manager = new ServerManager({ dataPath, serverVersion: VERSION });

            let spinner;
            try {
              const { pid } = await manager.start({
                port,
                binary: createBinary(argv, this._serverConfig),
                onStart: () => {
                  if (first) {
                    spinner = ora(`Starting ${name.title} server...`).start();
                  }
                },
              });
              if (spinner != null) {
                spinner.succeed(`Started ${name.title} server (pid=${pid})`);
              }
              this.client = new Client({ port });
              return manager;
            } catch (error) {
              if (spinner != null) {
                spinner.fail(
                  `Failed to start ${name.title} server: ${error.message}`,
                );
              }
              throw error;
            }
          }),
        undefined,
        1,
      ),
      switchMap(() =>
        this.client
          .getPlugins$()
          .pipe(map(pluginName => this._registerPlugin(monitor, pluginName))),
      ),
      publishReplay(1),
      refCount(),
    );
    const subscription = start$.subscribe({
      error: error => {
        monitor.logError({
          name: 'cli_uncaught_error',
          message: 'Something went wrong. Shutting down.',
          error,
        });
        this.vorpal.log(
          `Something went wrong: ${error.message}. Shutting down.`,
        );
        shutdown({ exitCode: 1, error });
      },
      complete: () => {
        const message =
          'Something went wrong: CLI unexpectedly exited. Shutting down.';
        monitor.log({
          name: 'cli_uncaught_complete',
          message,
          level: 'error',
        });
        this.vorpal.log(message);
        shutdown({ exitCode: 1 });
      },
    });
    shutdownFuncs.push(() => subscription.unsubscribe());
    await start$.pipe(take(1)).toPromise();
    const plugins = await this.client.getAllPlugins();
    plugins.forEach(plugin => this._registerPlugin(monitor, plugin));

    if (!isShutdown) {
      commands.forEach(command => command(this));
      const args = argv.slice(2);
      if (args.length > 0) {
        await this.vorpal.exec(args.join(' '));
        shutdown({ exitCode: 0 });
      } else {
        this.resetDelimiter();
        this.vorpal.history(name.cli).show();
      }
    }
  }

  _registerPlugin(monitor: Monitor, pluginName: string): void {
    if (this._plugins[pluginName] == null) {
      this._plugins[pluginName] = pluginsUtil.getPlugin({
        monitor,
        pluginName,
      });
      createPlugin({
        cli: this,
        plugin: this._plugins[pluginName],
      });
    }
  }

  registerPreHook(nameIn: string, hook: CLIHook): void {
    if (this._preHooks[nameIn] == null) {
      this._preHooks[nameIn] = [];
    }
    this._preHooks[nameIn].push(hook);
  }

  registerPostHook(nameIn: string, hook: CLIHook): void {
    if (this._postHooks[nameIn] == null) {
      this._postHooks[nameIn] = [];
    }
    this._postHooks[nameIn].push(hook);
  }

  async executeCommandPreHooks(nameIn: string, args: Args): Promise<void> {
    const preHooks = this._preHooks[nameIn] || [];
    for (const preHook of preHooks) {
      // eslint-disable-next-line
      await preHook({ cli: this, args });
    }
  }

  async executeCommandPostHooks(nameIn: string, args: Args): Promise<void> {
    const postHooks = this._postHooks[nameIn] || [];
    for (const postHook of postHooks) {
      // eslint-disable-next-line
      await postHook({ cli: this, args });
    }
  }

  async exec(command: string): Promise<void> {
    // $FlowFixMe
    const originalNewCommand = this.vorpal.cmdHistory.newCommand;
    // $FlowFixMe
    this.vorpal.cmdHistory.newCommand = () => {};
    try {
      await this.vorpal.execSync(command);
    } finally {
      // $FlowFixMe
      this.vorpal.cmdHistory.newCommand = originalNewCommand;
    }
  }

  printDescribe(describeTable: DescribeTable, print?: (value: string) => void) {
    this._getPrint(print)(this._getDescribe(describeTable));
  }

  _getDescribe(describeTable: DescribeTable): string {
    const table = getTable();
    table.push(
      ...describeTable.map(([keyIn, value]) => {
        const key = `${keyIn}:`;
        if (typeof value === 'string') {
          return { [key]: value };
        }
        if (value.type === 'list') {
          return { [key]: `\n${this._getList(value.table)}` };
        }

        return { [key]: `\n${this._getDescribe(value.table)}` };
      }),
    );
    return table.toString();
  }

  printList(listTable: ListTable, print?: (value: string) => void) {
    this._getPrint(print)(this._getList(listTable));
  }

  getResourceType({
    plugin: pluginName,
    resourceType: resourceTypeName,
  }: {|
    plugin: string,
    resourceType: string,
  |}): ResourceType<any, any> {
    const plugin = this._plugins[pluginName];
    if (plugin == null) {
      throw new PluginNotInstalledError(pluginName);
    }

    const resourceType = plugin.resourceTypeByName[resourceTypeName];
    if (resourceType == null) {
      throw new UnknownPluginResourceType({
        plugin: pluginName,
        resourceType: resourceTypeName,
      });
    }

    return resourceType;
  }

  _getList(listTable: ListTable): string {
    const table = getTable(listTable[0]);
    table.push(...listTable.slice(1));
    return table.toString();
  }

  _getPrint(printIn?: (value: string) => void): (value: string) => void {
    let print = printIn;
    if (print == null) {
      if (this.vorpal.activeCommand != null) {
        print = this.vorpal.activeCommand.log.bind(this.vorpal.activeCommand);
      } else {
        print = this.vorpal.log.bind(this.vorpal);
      }
    }

    return (print: $FlowFixMe);
  }

  getDebug(): DescribeTable {
    return [
      [
        'Interactive CLI Log Path',
        this._logPath == null ? 'Unknown' : this._logPath,
      ],
      ['Interactive CLI Config Path', this.clientConfig._configPath],
    ];
  }

  prompt(questions: Array<Object>): Promise<Object> {
    return inquirer.prompt(questions);
  }
}
