import { context as httpContext, cors, onError as appOnError, setupServer } from '@neo-one/http';
import { Logger, serverLogger } from '@neo-one/logger';
import { ServerConfig, ServerManager } from '@neo-one/server-client';
import { proto } from '@neo-one/server-grpc';
import { Binary, Config, DescribeTable, VERSION } from '@neo-one/server-plugin';
import { Disposable, finalize, mergeScanLatest } from '@neo-one/utils';
import * as http from 'http';
import Application from 'koa';
import Router from 'koa-router';
import Mali, { Context } from 'mali';
import * as path from 'path';
import { BehaviorSubject, combineLatest, defer, Observable } from 'rxjs';
import { distinctUntilChanged, map, mergeScan, switchMap } from 'rxjs/operators';
import { ServerRunningError } from './errors';
import { context, rpc, services as servicesMiddleware } from './middleware';
import { PluginManager } from './PluginManager';
import { PortAllocator } from './PortAllocator';

const PLUGIN_PATH = 'plugin';

export class Server {
  public static init$({
    binary,
    serverConfig,
  }: {
    readonly binary: Binary;
    readonly serverConfig: Config<ServerConfig>;
  }): Observable<Server> {
    const dataPath$ = serverConfig.config$.pipe(
      map((config) => config.paths.data),
      distinctUntilChanged(),
    );

    const portAllocator$ = combineLatest([
      dataPath$,
      serverConfig.config$.pipe(
        map((config) => config.ports),
        distinctUntilChanged(),
      ),
    ]).pipe(
      switchMap(([dataPath, ports]) =>
        defer(async () =>
          PortAllocator.create({
            logger: serverLogger,
            dataPath,
            portMin: ports.min,
            portMax: ports.max,
          }),
        ),
      ),
    );

    const pluginManager$ = combineLatest([
      dataPath$,
      portAllocator$,
      serverConfig.config$.pipe(
        map((config) => config.httpServer.port),
        distinctUntilChanged(),
      ),
    ]).pipe(
      switchMap(([dataPath, portAllocator, httpServerPort]) =>
        defer(async () => {
          const pluginManager = new PluginManager({
            logger: serverLogger,
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

    return combineLatest([dataPath$, pluginManager$]).pipe(
      switchMap(([dataPath, pluginManager]) => {
        const server = new Server({
          logger: serverLogger,
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
  private readonly mutableServerDebug: {
    // tslint:disable-next-line readonly-keyword
    port?: number;
    // tslint:disable-next-line readonly-keyword
    pid?: number;
    // tslint:disable-next-line readonly-keyword
    pidPath?: string;
  };

  public constructor({
    serverConfig,
    dataPath,
    pluginManager,
  }: {
    readonly logger: Logger;
    readonly serverConfig: Config<ServerConfig>;
    readonly dataPath: string;
    readonly pluginManager: PluginManager;
  }) {
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

                await manager.writeVersionPID(process.pid, VERSION);
              } else if (pid !== process.pid) {
                throw new ServerRunningError(pid);
              }
            } else {
              await prevApp.close().catch((error: Error) => {
                serverLogger.error({ title: 'grpc_app_close_error', error }, 'Failed to close previous app');
              });
            }
            const app = new Mali(proto);
            app.silent = false;
            app.on('error', (error: Error, ctx: Context | undefined | null) => {
              let logger = serverLogger;
              // tslint:disable-next-line:no-any
              if (ctx != undefined && (ctx as any).state != undefined && (ctx as any).state.logger != undefined) {
                // tslint:disable-next-line:no-any
                logger = (ctx as any).state.logger;
              }
              logger.error({ title: 'grpc_server_request_uncaught_error', error }, 'Uncaught grpc error.');
            });
            app.use(context({ logger: serverLogger }));
            app.use(servicesMiddleware({ server: this }));
            this.mutableServerDebug.port = serverConfig.port;
            app.start(`0.0.0.0:${serverConfig.port}`);
            serverLogger.info({ title: 'server' }, `GRPC Server listening on 0.0.0.0:${serverConfig.port}.`);

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
        // tslint:disable-next-line:no-any
        const app = new Application<any, {}>();
        app.silent = true;

        app.on('error', appOnError(serverLogger));

        // tslint:disable-next-line:no-any
        const router = new Router<any, {}>();

        const rpcMiddleware = rpc({ server: this });
        router.use(httpContext(serverLogger));
        router.use(cors).post(rpcMiddleware.name, rpcMiddleware.path, rpcMiddleware.middleware);

        app.use(router.routes());
        app.use(cors);
        app.use(router.allowedMethods());

        return app;
      })(),
    );

    const http$ = combineLatest([app$, this.serverConfig.config$]).pipe(
      mergeScanLatest(async (disposable: Disposable | undefined, [app, config]) => {
        if (disposable !== undefined) {
          await disposable();
        }

        return setupServer(app, http.createServer(), '0.0.0.0', config.httpServer.port);
      }),
      finalize(async (disposable) => {
        if (disposable !== undefined) {
          await disposable();
        }
      }),
    );

    return combineLatest([grpc$, http$]);
  }

  public async reset(): Promise<void> {
    await this.pluginManager.reset();
  }

  public getDebug(): DescribeTable {
    return [
      ['Server Config Path', this.serverConfig.configPath] as const,
      ['Data Path', this.dataPath] as const,
      ['Server', { type: 'describe', table: this.getServerDebug() }] as const,
      ['Plugin Manager', { type: 'describe', table: this.pluginManager.getDebug() }] as const,
    ];
  }

  private getServerDebug(): DescribeTable {
    return [
      ['Port', this.getValue(this.mutableServerDebug.port)] as const,
      ['Process ID', this.getValue(this.mutableServerDebug.pid)] as const,
      ['Process ID Path', this.getValue(this.mutableServerDebug.pidPath)] as const,
    ];
  }

  private getValue(value?: string | number): string {
    return value === undefined ? 'Not Set' : `${value}`;
  }
}
