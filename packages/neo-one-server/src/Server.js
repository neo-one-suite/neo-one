/* @flow */
import {
  type Binary,
  type DescribeTable,
  Config,
} from '@neo-one/server-plugin';
import Mali from 'mali';
import type { Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';
import type { ServerConfig } from '@neo-one/server-client';
import { ServerManager } from '@neo-one/server-client';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { defer } from 'rxjs/observable/defer';
import {
  distinctUntilChanged,
  map,
  mergeScan,
  switchMap,
} from 'rxjs/operators';
import { finalize } from '@neo-one/utils';
import path from 'path';
import proto from '@neo-one/server-grpc';

import PluginManager from './PluginManager';
import PortAllocator from './PortAllocator';
import { ServerRunningError } from './errors';

import { context, services as servicesMiddleware } from './middleware';
import pkg from '../package.json';

export const VERSION = pkg.version;
const PLUGIN_PATH = 'plugin';

export default class Server {
  serverConfig: Config<ServerConfig>;
  dataPath: string;
  pluginManager: PluginManager;

  _monitor: Monitor;

  _serverDebug: {|
    port?: number,
    pid?: number,
    pidPath?: string,
  |};

  constructor({
    monitor,
    serverConfig,
    dataPath,
    pluginManager,
  }: {|
    monitor: Monitor,
    serverConfig: Config<ServerConfig>,
    dataPath: string,
    pluginManager: PluginManager,
  |}) {
    this._monitor = monitor.at('server');
    this.serverConfig = serverConfig;
    this.dataPath = dataPath;
    this.pluginManager = pluginManager;

    this._serverDebug = ({}: $FlowFixMe);
  }

  static init$({
    monitor,
    binary,
    serverConfig,
  }: {|
    monitor: Monitor,
    binary: Binary,
    serverConfig: Config<ServerConfig>,
  |}): Observable<Server> {
    const dataPath$ = serverConfig.config$.pipe(
      map(config => config.paths.data),
      distinctUntilChanged(),
    );
    const portAllocator$ = combineLatest(
      dataPath$,
      serverConfig.config$.pipe(
        map(config => config.ports),
        distinctUntilChanged(),
      ),
    ).pipe(
      switchMap(([dataPath, ports]) =>
        defer(async () => {
          const portAllocator = await PortAllocator.create({
            monitor,
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
            monitor,
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
          monitor,
          serverConfig,
          dataPath,
          pluginManager,
        });
        return server.start$().pipe(map(() => server), distinctUntilChanged());
      }),
    );
  }

  start$(): Observable<void> {
    return this.serverConfig.config$.pipe(
      map(config => config.server),
      distinctUntilChanged(),
      mergeScan(
        (prevApp, serverConfig) =>
          defer(async () => {
            if (prevApp == null) {
              const manager = new ServerManager({
                dataPath: this.dataPath,
                serverVersion: VERSION,
              });
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
                this._monitor.logError({
                  name: 'grpc_app_close_error',
                  message: 'Failed to close previous app',
                  error,
                });
              });
            }
            const app = new Mali(proto);
            app.silent = false;
            app.on('error', (error, ctx) => {
              let monitor = this._monitor;
              if (
                ctx != null &&
                ctx.state != null &&
                ctx.state.monitor != null
              ) {
                ({ monitor } = ctx.state);
              }
              monitor.logError({
                name: 'grpc_server_request_uncaught_error',
                message: 'Uncaught grpc error.',
                error,
              });
            });
            app.use(context({ monitor: this._monitor }));
            app.use(servicesMiddleware({ server: this }));
            this._serverDebug.port = serverConfig.port;
            app.start(`0.0.0.0:${serverConfig.port}`);
            this._monitor.log({
              name: 'server_listen',
              message: 'Server started.',
              level: 'info',
            });
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

  async reset(): Promise<void> {
    await this.pluginManager.reset();
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
