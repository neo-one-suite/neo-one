import { Monitor } from '@neo-one/monitor';
import { plugins as pluginsUtil, VERSION } from '@neo-one/server';
import {
  Client,
  createServerConfig,
  PluginNotInstalledError,
  ServerManager,
  UnknownPluginResourceType,
} from '@neo-one/server-client';
import {
  CLIHook,
  Config,
  DescribeTable,
  ListTable,
  name,
  paths as defaultPaths,
  Plugin,
  ResourceType,
  Session,
} from '@neo-one/server-plugin';
// tslint:disable-next-line match-default-export-name
import Table from 'cli-table2';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { BehaviorSubject, combineLatest, defer, Observable } from 'rxjs';
import { distinctUntilChanged, map, mergeScan, publishReplay, refCount, switchMap, take } from 'rxjs/operators';
import Vorpal, { Args } from 'vorpal';
import pkg from '../package.json';
import { commands, createPlugin } from './interactive';
import { ClientConfig, createBinary, createClientConfig, setupCLI } from './utils';

// tslint:disable-next-line readonly-array
const getTable = (head?: string[]) =>
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

interface Sessions {
  // tslint:disable-next-line readonly-keyword
  [plugin: string]: Session;
}

export class InteractiveCLI {
  public readonly vorpal: Vorpal;
  public mutableClient: Client;
  public mutableClientConfig: Config<ClientConfig>;
  public readonly debug: boolean;
  public mutableMonitor: Monitor | undefined;
  private readonly sessions: Sessions;
  private readonly sessions$: BehaviorSubject<Sessions>;
  // tslint:disable-next-line readonly-keyword readonly-array
  private readonly preHooks: { [command: string]: CLIHook[] };
  // tslint:disable-next-line readonly-keyword readonly-array
  private readonly postHooks: { [command: string]: CLIHook[] };
  private mutableDelimiter: Array<{ readonly key: string; readonly name: string }>;
  private mutablePlugins: { [name: string]: Plugin };
  private readonly serverConfig: {
    readonly dir?: string;
    readonly serverPort?: number;
    readonly minPort?: number;
  };
  private mutableLogPath: string | undefined;

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
    this.vorpal = new Vorpal().version(pkg.version);
    this.debug = debug;
    this.sessions = {};
    this.sessions$ = new BehaviorSubject<Session>({});
    this.preHooks = {};
    this.postHooks = {};
    this.mutableDelimiter = [];
    this.plugins = {};
    this.serverConfig = { dir, serverPort, minPort };
  }

  public async getSession(plugin: string): Promise<Session> {
    return this.sessions[plugin] === undefined ? {} : this.sessions[plugin];
  }

  public updateSession(plugin: string, session: Session): void {
    // tslint:disable-next-line no-object-mutation
    this.sessions[plugin] = session;
    this.sessions$.next(this.sessions);
  }

  public mergeSession(plugin: string, session: Session): void {
    // tslint:disable-next-line no-object-mutation
    this.sessions[plugin] = {
      ...(this.sessions[plugin] === undefined ? {} : this.sessions[plugin]),
      ...session,
    };

    this.sessions$.next(this.sessions);
  }

  public getSession$(plugin: string): Observable<Session> {
    return this.sessions$.pipe(map((sessions) => (sessions[plugin] === undefined ? {} : sessions[plugin])));
  }

  public addDelimiter(keyIn: string, nameIn: string): void {
    this.filterDelimiter(keyIn);
    this.mutableDelimiter.push({ key: keyIn, name: nameIn });
    this.setDelimiter();
  }

  public removeDelimiter(keyIn: string): void {
    this.filterDelimiter(keyIn);
    this.setDelimiter();
  }

  public resetDelimiter(): void {
    this.mutableDelimiter = [];
    this.setDelimiter();
  }

  public get monitor(): Monitor {
    if (this.mutableMonitor === undefined) {
      throw new Error('Attempted to access monitor before it was available');
    }

    return this.mutableMonitor;
  }

  public async start(argv: ReadonlyArray<string>): Promise<void> {
    const { dir } = this.serverConfig;
    const paths = {
      data: dir === undefined ? defaultPaths.data : path.join(dir, 'data'),
      config: dir === undefined ? defaultPaths.config : path.join(dir, 'config'),
      cache: dir === undefined ? defaultPaths.cache : path.join(dir, 'cache'),
      log: dir === undefined ? defaultPaths.log : path.join(dir, 'log'),
      temp: dir === undefined ? defaultPaths.temp : path.join(dir, 'temp'),
    };

    const { monitor, config$: logConfig$, mutableShutdownFuncs, shutdown: shutdownIn } = setupCLI({
      vorpal: this.vorpal,
      debug: this.debug,
    });

    this.mutableMonitor = monitor;
    this.mutableClientConfig = createClientConfig({ paths });

    let isShutdown = false;
    // tslint:disable-next-line no-any
    const shutdown = (arg: any) => {
      shutdownIn(arg);
      isShutdown = true;
    };

    const logSubscription = combineLatest(
      this.mutableClientConfig.config$.pipe(
        map((config) => config.paths.log),
        distinctUntilChanged(),
      ),

      this.mutableClientConfig.config$.pipe(
        map((config) => config.log),
        distinctUntilChanged(),
      ),
    )
      .pipe(
        map(([logPath, config]) => {
          this.mutableLogPath = logPath;

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
    mutableShutdownFuncs.push(() => logSubscription.unsubscribe());

    const serverConfig = createServerConfig({
      paths,
      serverPort: this.serverConfig.serverPort,
      minPort: this.serverConfig.minPort,
    });

    const start$ = combineLatest(
      serverConfig.config$.pipe(
        map((conf) => conf.paths.data),
        distinctUntilChanged(),
      ),

      serverConfig.config$.pipe(
        map((conf) => conf.server.port),
        distinctUntilChanged(),
      ),
    ).pipe(
      mergeScan(
        (managerIn, [dataPath, port]) =>
          defer(async () => {
            let manager = managerIn as ServerManager | undefined;
            const first = manager === undefined;
            if (manager !== undefined) {
              await manager.kill();
            }
            manager = new ServerManager({ dataPath, serverVersion: VERSION });

            // tslint:disable-next-line no-any
            let spinner: any | undefined;
            try {
              const { pid } = await manager.start({
                port,
                binary: createBinary(argv, this.serverConfig),
                onStart: () => {
                  if (first) {
                    spinner = ora(`Starting ${name.title} server...`).start();
                  }
                },
              });

              if (spinner !== undefined) {
                spinner.succeed(`Started ${name.title} server (pid=${pid})`);
              }
              this.mutableClient = new Client({ port });

              return manager;
            } catch (error) {
              if (spinner !== undefined) {
                spinner.fail(`Failed to start ${name.title} server: ${error.message}`);
              }
              throw error;
            }
          }),
        undefined,
        1,
      ),

      switchMap(() =>
        this.mutableClient.getPlugins$().pipe(map((pluginName) => this.registerPlugin(monitor, pluginName))),
      ),

      publishReplay(1),
      refCount(),
    );

    const subscription = start$.subscribe({
      error: (error) => {
        monitor.logError({
          name: 'cli_uncaught_error',
          message: 'Something went wrong. Shutting down.',
          error,
        });

        this.vorpal.log(`Something went wrong: ${error.message}. Shutting down.`);

        shutdown({ exitCode: 1, error });
      },
      complete: () => {
        const message = 'Something went wrong: CLI unexpectedly exited. Shutting down.';
        monitor.log({
          name: 'cli_uncaught_complete',
          message,
          level: 'error',
        });

        this.vorpal.log(message);
        shutdown({ exitCode: 1 });
      },
    });

    mutableShutdownFuncs.push(() => subscription.unsubscribe());
    await start$.pipe(take(1)).toPromise();
    const plugins = await this.mutableClient.getAllPlugins();
    plugins.forEach((plugin) => this.registerPlugin(monitor, plugin));

    if (!isShutdown) {
      commands.forEach((command) => command(this));
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

  public registerPreHook(nameIn: string, hook: CLIHook): void {
    const preHook = this.preHooks[nameIn] as CLIHook[] | undefined;
    if (preHook === undefined) {
      // tslint:disable-next-line no-object-mutation
      this.preHooks[nameIn] = [];
    }
    // tslint:disable-next-line no-array-mutation
    this.preHooks[nameIn].push(hook);
  }

  public registerPostHook(nameIn: string, hook: CLIHook): void {
    const postHook = this.postHooks[nameIn] as CLIHook[] | undefined;
    if (postHook === undefined) {
      // tslint:disable-next-line no-object-mutation
      this.postHooks[nameIn] = [];
    }
    // tslint:disable-next-line no-array-mutation
    this.postHooks[nameIn].push(hook);
  }

  public async executeCommandPreHooks(nameIn: string, args: Args): Promise<void> {
    const preHooks = this.preHooks[nameIn] as CLIHook[] | undefined;
    if (preHooks !== undefined) {
      // tslint:disable-next-line no-loop-statement
      for (const preHook of preHooks) {
        await preHook({ cli: this, args });
      }
    }
  }

  public async executeCommandPostHooks(nameIn: string, args: Args): Promise<void> {
    const postHooks = this.postHooks[nameIn] as CLIHook[] | undefined;
    if (postHooks !== undefined) {
      // tslint:disable-next-line no-loop-statement
      for (const postHook of postHooks) {
        await postHook({ cli: this, args });
      }
    }
  }

  public async exec(command: string): Promise<void> {
    // tslint:disable-next-line no-any
    const originalNewCommand = (this.vorpal as any).cmdHistory.newCommand;
    // tslint:disable-next-line no-any no-object-mutation
    (this.vorpal as any).cmdHistory.newCommand = () => {
      // do nothing
    };
    try {
      await this.vorpal.execSync(command);
    } finally {
      // tslint:disable-next-line no-object-mutation no-any
      (this.vorpal as any).cmdHistory.newCommand = originalNewCommand;
    }
  }

  public printDescribe(describeTable: DescribeTable, print?: ((value: string) => void)) {
    this.getPrint(print)(this.getDescribe(describeTable));
  }

  public printList(listTable: ListTable, print?: ((value: string) => void)) {
    this.getPrint(print)(this.getList(listTable));
  }

  public getResourceType({
    plugin: pluginName,
    resourceType: resourceTypeName,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    // tslint:disable-next-line no-any
  }): ResourceType<any, any> {
    const plugin = this.plugins[pluginName] as Plugin | undefined;
    if (plugin === undefined) {
      throw new PluginNotInstalledError(pluginName);
    }

    const resourceType = plugin.resourceTypeByName[resourceTypeName] as ResourceType | undefined;
    if (resourceType === undefined) {
      throw new UnknownPluginResourceType({
        plugin: pluginName,
        resourceType: resourceTypeName,
      });
    }

    return resourceType;
  }

  public getDebug(): DescribeTable {
    return [
      ['Interactive CLI Log Path', this.mutableLogPath === undefined ? 'Unknown' : this.mutableLogPath],

      ['Interactive CLI Config Path', this.mutableClientConfig.configPath],
    ];
  }
  // tslint:disable-next-line no-any
  public async prompt(questions: ReadonlyArray<any>): Promise<any> {
    return inquirer.prompt(questions);
  }

  private filterDelimiter(keyIn: string): void {
    this.mutableDelimiter = this.mutableDelimiter.filter(({ key }) => key !== keyIn);
  }

  private setDelimiter(): void {
    if (this.mutableDelimiter.length === 0) {
      this.vorpal.delimiter(`${name.cli}$`);
    } else {
      this.vorpal.delimiter(`${this.mutableDelimiter.map(({ name: delimName }) => delimName).join(' ')}$`);
    }
  }

  private registerPlugin(monitor: Monitor, pluginName: string): void {
    const plugin = this.mutablePlugins[pluginName] as Plugin | undefined;
    if (plugin === undefined) {
      this.mutablePlugins[pluginName] = pluginsUtil.getPlugin({
        monitor,
        pluginName,
      });

      createPlugin({
        cli: this,
        plugin: this.mutablePlugins[pluginName],
      });
    }
  }

  private getDescribe(describeTable: DescribeTable): string {
    const table = getTable();
    table.push(
      ...describeTable.map(([keyIn, value]) => {
        const key = `${keyIn}:`;
        if (typeof value === 'string') {
          return { [key]: value };
        }
        if (value.type === 'list') {
          return { [key]: `\n${this.getList(value.table)}` };
        }

        return { [key]: `\n${this.getDescribe(value.table)}` };
      }),
    );

    return table.toString();
  }

  private getList(listTable: ListTable): string {
    const table = getTable(listTable[0]);
    table.push(...listTable.slice(1));
    return table.toString();
  }

  private getPrint(printIn?: ((value: string) => void)): ((value: string) => void) {
    let print = printIn;
    if (print == undefined) {
      if (this.vorpal.activeCommand != undefined) {
        print = this.vorpal.activeCommand.log.bind(this.vorpal.activeCommand);
      } else {
        print = this.vorpal.log.bind(this.vorpal);
      }
    }

    return print as any;
  }
}
