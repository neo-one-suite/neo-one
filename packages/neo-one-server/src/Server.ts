import { context as httpContext, cors, createServer$, onError as appOnError } from '@neo-one/http';
import { Monitor } from '@neo-one/monitor';
import { ServerConfig, ServerManager } from '@neo-one/server-client';
import { proto } from '@neo-one/server-grpc';
import { Binary, Config, DescribeTable, VERSION } from '@neo-one/server-plugin';
import { finalize } from '@neo-one/utils';
import * as http from 'http';
import Application from 'koa';
import Router from 'koa-router';
import Mali, { Context } from 'mali';
import * as path from 'path';
import { BehaviorSubject, combineLatest, defer, Observable, of as _of } from 'rxjs';
import { distinctUntilChanged, map, mergeScan, switchMap } from 'rxjs/operators';
import { ServerRunningError } from './errors';
import { context, rpc, services as servicesMiddleware } from './middleware';
import { PluginManager } from './PluginManager';
import { PortAllocator } from './PortAllocator';

const PLUGIN_PATH = 'plugin';

export class Server {
  public static init$({
    monitor,
    binary,
    serverConfig,
  }: {
    readonly monitor: Monitor;
    readonly binary: Binary;
    readonly serverConfig: Config<ServerConfig>;
  }): Observable<Server> {
    const dataPath$ = serverConfig.config$.pipe(
      map((config) => config.paths.data),
      distinctUntilChanged(),
    );

    const portAllocator$ = combineLatest(
      dataPath$,
      serverConfig.config$.pipe(
        map((config) => config.ports),
        distinctUntilChanged(),
      ),
    ).pipe(
      switchMap(([dataPath, ports]) =>
        defer(async () =>
          PortAllocator.create({
            monitor,
            dataPath,
            portMin: ports.min,
            portMax: ports.max,
          }),
        ),
      ),
    );

    const pluginManager$ = combineLatest(
      dataPath$,
      portAllocator$,
      serverConfig.config$.pipe(
        map((config) => config.httpServer.port),
        distinctUntilChanged(),
      ),
    ).pipe(
      switchMap(([dataPath, portAllocator, httpServerPort]) =>
        defer(async () => {
          const pluginManager = new PluginManager({
            monitor,
            binary,
            portAllocator,
            dataPath: path.resolve(dataPath, PLUGIN_PATH),
            httpServerPort,
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

        return server.start$().pipe(
          map(() => server),
          distinctUntilChanged(),
        );
      }),
    );
  }

  public readonly serverConfig: Config<ServerConfig>;
  public readonly dataPath: string;
  public readonly pluginManager: PluginManager;
  private readonly monitor: Monitor;
  private readonly mutableServerDebug: {
    // tslint:disable-next-line readonly-keyword
    port?: number;
    // tslint:disable-next-line readonly-keyword
    pid?: number;
    // tslint:disable-next-line readonly-keyword
    pidPath?: string;
  };

  public constructor({
    monitor,
    serverConfig,
    dataPath,
    pluginManager,
  }: {
    readonly monitor: Monitor;
    readonly serverConfig: Config<ServerConfig>;
    readonly dataPath: string;
    readonly pluginManager: PluginManager;
  }) {
    this.monitor = monitor.at('server');
    this.serverConfig = serverConfig;
    this.dataPath = dataPath;
    this.pluginManager = pluginManager;

    this.mutableServerDebug = {};
  }

  // tslint:disable-next-line no-any
  public start$(): Observable<any> {
    const grpc$ = this.serverConfig.config$.pipe(
      map((config) => config.server),
      distinctUntilChanged(),
      mergeScan<ServerConfig['server'], Mali | undefined>(
        (prevApp, serverConfig) =>
          defer(async () => {
            if (prevApp === undefined) {
              const manager = new ServerManager({
                dataPath: this.dataPath,
                serverVersion: VERSION,
              });
              this.mutableServerDebug.pidPath = manager.pidPath;

              const pid = await manager.checkAlive(serverConfig.port);
              if (pid === undefined) {
                this.mutableServerDebug.pid = process.pid;

                await manager.writePID(process.pid);
              } else if (pid !== process.pid) {
                throw new ServerRunningError(pid);
              }
            } else {
              await prevApp.close().catch((error: Error) => {
                this.monitor.logError({
                  name: 'grpc_app_close_error',
                  message: 'Failed to close previous app',
                  error,
                });
              });
            }
            const app = new Mali(proto);
            app.silent = false;
            app.on('error', (error: Error, ctx: Context | undefined | null) => {
              let monitor = this.monitor;
              // tslint:disable-next-line:no-any
              if (ctx != undefined && (ctx as any).state != undefined && (ctx as any).state.monitor != undefined) {
                // tslint:disable-next-line:no-any
                ({ monitor } = (ctx as any).state);
              }
              monitor.logError({
                name: 'grpc_server_request_uncaught_error',
                message: 'Uncaught grpc error.',
                error,
              });
            });
            app.use(context({ monitor: this.monitor }));
            app.use(servicesMiddleware({ server: this }));
            this.mutableServerDebug.port = serverConfig.port;
            app.start(`0.0.0.0:${serverConfig.port}`);
            this.monitor.log({
              name: 'server_listen',
              message: `GRPC Server listening on 0.0.0.0:${serverConfig.port}.`,
              level: 'info',
            });

            return app;
          }),
        undefined,
        1,
      ),
      finalize<Mali | undefined>(async (app) => {
        if (app !== undefined) {
          await app.close();
        }
      }),
    );

    const app$ = new BehaviorSubject(
      (() => {
        const app = new Application();
        app.silent = true;

        app.on('error', appOnError({ monitor: this.monitor }));

        const router = new Router();

        const rpcMiddleware = rpc({ server: this });
        router.use(httpContext({ monitor: this.monitor }));
        router.use(cors).post(rpcMiddleware.name, rpcMiddleware.path, rpcMiddleware.middleware);

        app.use(router.routes());
        app.use(cors);
        app.use(router.allowedMethods());

        return app;
      })(),
    );

    const http$ = this.serverConfig.config$.pipe(
      switchMap((config) =>
        createServer$(this.monitor, app$, _of(60000), { host: '0.0.0.0', port: config.httpServer.port }, () =>
          http.createServer(),
        ),
      ),
    );

    return combineLatest(grpc$, http$);
  }

  public async reset(): Promise<void> {
    await this.pluginManager.reset();
  }

  public getDebug(): DescribeTable {
    return [
      ['Server Config Path', this.serverConfig.configPath],
      ['Data Path', this.dataPath],
      ['Server', { type: 'describe', table: this.getServerDebug() }],
      ['Plugin Manager', { type: 'describe', table: this.pluginManager.getDebug() }],
    ];
  }

  private getServerDebug(): DescribeTable {
    return [
      ['Port', this.getValue(this.mutableServerDebug.port)],
      ['Process ID', this.getValue(this.mutableServerDebug.pid)],
      ['Process ID Path', this.getValue(this.mutableServerDebug.pidPath)],
    ];
  }

  private getValue(value?: string | number): string {
    return value === undefined ? 'Not Set' : `${value}`;
  }
}
