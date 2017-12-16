/* @flow */
// flowlint untyped-import:off
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import {
  type CLIHook,
  type DescribeTable,
  type ListTable,
  type Session,
  Client,
  killServer,
  startServer,
} from '@neo-one/server-common';
import {
  type Config,
  createServerConfig,
  name,
  plugins as pluginsUtil,
} from '@neo-one/server';
import type { Log, LogMessage } from '@neo-one/utils';
import type { Observable } from 'rxjs/Observable';
import Table from 'cli-table2';
import Vorpal, { type Args } from 'vorpal';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { defer } from 'rxjs/observable/defer';
import {
  distinct,
  map,
  mergeScan,
  publishReplay,
  refCount,
  switchMap,
  take,
} from 'rxjs/operators';
import ora from 'ora';

import { type ClientConfig, createClientConfig, setupCLI } from './utils';

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
  _log: ?Log;

  _logPath: ?string;

  constructor({ debug }: {| debug: boolean |}) {
    this.vorpal = new Vorpal().version(pkg.version);
    this.debug = debug;
    this._sessions = {};
    this._sessions$ = new BehaviorSubject({});
    this._preHooks = {};
    this._postHooks = {};
    this._delimiter = [];
    this._log = null;

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

  log(message: LogMessage): void {
    if (this._log != null) {
      this._log(message);
    }
  }

  async start(): Promise<void> {
    const {
      log,
      config$: logConfig$,
      shutdownFuncs,
      shutdown: shutdownIn,
    } = setupCLI({
      vorpal: this.vorpal,
      debug: this.debug,
    });
    this.clientConfig = createClientConfig({ log });

    let isShutdown = false;
    const shutdown = arg => {
      shutdownIn(arg);
      isShutdown = true;
    };

    const logSubscription = combineLatest(
      this.clientConfig.config$.pipe(
        map(config => config.paths.log),
        distinct(),
      ),
      this.clientConfig.config$.pipe(map(config => config.log), distinct()),
    )
      .pipe(
        map(([path, config]) => {
          this._logPath = path;
          return {
            name: 'interactiveCLI',
            path,
            level: config.level,
            maxSize: config.maxSize,
            maxFiles: config.maxFiles,
          };
        }),
      )
      .subscribe(logConfig$);
    shutdownFuncs.push(() => logSubscription.unsubscribe());

    const plugins = new Set();
    const serverConfig = createServerConfig({ log });
    const start$ = combineLatest(
      serverConfig.config$.pipe(map(conf => conf.paths.data), distinct()),
      serverConfig.config$.pipe(map(conf => conf.server.port), distinct()),
    ).pipe(
      mergeScan(
        (prevPID, [dataPath, port]) =>
          defer(async () => {
            if (prevPID != null) {
              await killServer({ pid: prevPID });
            }
            let spinner;
            try {
              const { pid } = await startServer({
                port,
                dataPath,
                binary: process.argv.join(' '),
                onStart: () => {
                  if (prevPID == null) {
                    spinner = ora(
                      `Starting ${name.title} server... This can take ~15 ` +
                        'seconds on initial startup.',
                    ).start();
                  }
                },
              });
              if (spinner != null) {
                spinner.succeed(`Started ${name.title} server (pid=${pid})`);
              }
              this.client = new Client({ port });
              return pid;
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
        this.client.getPlugins$().pipe(
          map(pluginName => {
            if (!plugins.has(pluginName)) {
              plugins.add(pluginName);
              createPlugin({
                cli: this,
                plugin: pluginsUtil.getPlugin({ log, pluginName }),
              });
            }
          }),
        ),
      ),
      publishReplay(1),
      refCount(),
    );
    const subscription = start$.subscribe({
      error: error => {
        log({ event: 'UNCAUGHT_CLI_ERROR', error });
        this.vorpal.log(
          `Something went wrong: ${error.message}. Shutting down.`,
        );
        shutdown({ exitCode: 1, error });
      },
      complete: () => {
        log({ event: 'UNCAUGHT_CLI_COMPLETE' });
        this.vorpal.log(
          'Something went wrong: CLI unexpectedly exited. Shutting down.',
        );
        shutdown({ exitCode: 1 });
      },
    });
    shutdownFuncs.push(() => subscription.unsubscribe());
    await start$.pipe(take(1)).toPromise();

    if (!isShutdown) {
      commands.forEach(command => command(this));
      this.resetDelimiter();
      this.vorpal.history(name.cli).show();
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

  printDescribe(describeTable: DescribeTable, log?: (value: string) => void) {
    this._getLog(log)(this._getDescribe(describeTable));
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

  printList(listTable: ListTable, log?: (value: string) => void) {
    this._getLog(log)(this._getList(listTable));
  }

  _getList(listTable: ListTable): string {
    const table = getTable(listTable[0]);
    table.push(...listTable.slice(1));
    return table.toString();
  }

  _getLog(logIn?: (value: string) => void): (value: string) => void {
    let log = logIn;
    if (log == null) {
      if (this.vorpal.activeCommand != null) {
        log = this.vorpal.activeCommand.log.bind(this.vorpal.activeCommand);
      } else {
        log = this.vorpal.log.bind(this.vorpal);
      }
    }

    return (log: $FlowFixMe);
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
}
