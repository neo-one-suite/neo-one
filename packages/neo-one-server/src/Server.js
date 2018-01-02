/* @flow */
import {
  type Binary,
  type DescribeTable,
  Config,
} from '@neo-one/server-plugin';
import { type Log, finalize } from '@neo-one/utils';
import Mali from 'mali';
import type { Observable } from 'rxjs/Observable';
import type { ServerConfig } from '@neo-one/server-client';
import { ServerManager } from '@neo-one/server-client';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { defer } from 'rxjs/observable/defer';
import { distinct, map, mergeScan, switchMap } from 'rxjs/operators';
import path from 'path';
import proto from '@neo-one/server-grpc';

import PluginManager from './PluginManager';
import PortAllocator from './PortAllocator';
import { ServerRunningError } from './errors';
import { context, logger, services as servicesMiddleware } from './middleware';

const PLUGIN_PATH = 'plugin';

export default class Server {
  serverConfig: Config<ServerConfig>;
  dataPath: string;
  pluginManager: PluginManager;

  _log: Log;

  _serverDebug: {|
    port?: number,
    pid?: number,
    pidPath?: string,
  |};

  constructor({
    log,
    serverConfig,
    dataPath,
    pluginManager,
  }: {|
    log: Log,
    serverConfig: Config<ServerConfig>,
    dataPath: string,
    pluginManager: PluginManager,
  |}) {
    this._log = log;
    this.serverConfig = serverConfig;
    this.dataPath = dataPath;
    this.pluginManager = pluginManager;

    this._serverDebug = ({}: $FlowFixMe);
  }

  static init$({
    log,
    binary,
    serverConfig,
  }: {|
    log: Log,
    binary: Binary,
    serverConfig: Config<ServerConfig>,
  |}): Observable<Server> {
    const dataPath$ = serverConfig.config$.pipe(
      map(config => config.paths.data),
      distinct(),
    );
    const portAllocator$ = combineLatest(
      dataPath$,
      serverConfig.config$.pipe(map(config => config.ports), distinct()),
    ).pipe(
      switchMap(([dataPath, ports]) =>
        defer(async () => {
          const portAllocator = await PortAllocator.create({
            log,
            dataPath,
            portMin: ports.min,
            portMax: ports.max,
          });
          return portAllocator;
        }),
      ),
    );

    const pluginManager$ = combineLatest(dataPath$, portAllocator$).pipe(
      switchMap(([dataPath, portAllocator]) =>
        defer(async () => {
          const pluginManager = new PluginManager({
            log,
            binary,
            portAllocator,
            dataPath: path.resolve(dataPath, PLUGIN_PATH),
          });
          await pluginManager.init();
          return pluginManager;
        }),
      ),
    );

    return combineLatest(dataPath$, pluginManager$).pipe(
      switchMap(([dataPath, pluginManager]) => {
        const server = new Server({
          log,
          serverConfig,
          dataPath,
          pluginManager,
        });
        return server.start$().pipe(map(() => server), distinct());
      }),
    );
  }

  start$(): Observable<void> {
    return this.serverConfig.config$.pipe(
      map(config => config.server),
      distinct(),
      mergeScan(
        (prevApp, serverConfig) =>
          defer(async () => {
            if (prevApp == null) {
              const manager = new ServerManager({ dataPath: this.dataPath });
              this._serverDebug.pidPath = manager.pidPath;

              const pid = await manager.checkAlive(serverConfig.port);
              if (pid == null) {
                this._serverDebug.pid = process.pid;

                manager.writePID(process.pid);
              } else if (pid !== process.pid) {
                throw new ServerRunningError(pid);
              }
            } else {
              await prevApp.close().catch(error => {
                this._log({ event: 'APP_CLOSE_ERROR', error });
              });
            }
            const app = new Mali(proto);
            app.silent = false;
            app.on('error', (error, ctx) => {
              let log = this._log;
              if (ctx != null && ctx.state != null && ctx.state.log != null) {
                // eslint-disable-next-line
                log = ctx.state.log;
              }
              log({ event: 'APP_ERROR', error });
            });
            app.use(context({ log: this._log }));
            app.use(logger);
            app.use(servicesMiddleware({ server: this }));
            this._serverDebug.port = serverConfig.port;
            app.start(`0.0.0.0:${serverConfig.port}`);
            this._log({ event: 'SERVER_START', port: serverConfig.port });
            return app;
          }),
        undefined,
        1,
      ),
      finalize(async app => {
        if (app != null) {
          await app.close();
        }
      }),
    );
  }

  getDebug(): DescribeTable {
    return [
      ['Server Config Path', this.serverConfig._configPath],
      ['Data Path', this.dataPath],
      ['Server', { type: 'describe', table: this._getServerDebug() }],
      [
        'Plugin Manager',
        { type: 'describe', table: this.pluginManager.getDebug() },
      ],
    ];
  }

  _getServerDebug(): DescribeTable {
    return [
      ['Port', this._getValue(this._serverDebug.port)],
      ['Process ID', this._getValue(this._serverDebug.pid)],
      ['Process ID Path', this._getValue(this._serverDebug.pidPath)],
    ];
  }

  _getValue(value?: ?(string | number)): string {
    return value == null ? 'Not Set' : `${value}`;
  }
}
