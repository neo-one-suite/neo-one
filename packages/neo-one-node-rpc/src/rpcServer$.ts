import { Monitor } from '@neo-one/monitor';
import { Blockchain, Node } from '@neo-one/node-core';
import { finalize, mergeScanLatest } from '@neo-one/utils';
import * as http from 'http';
import * as https from 'https';
import Application from 'koa';
import Router from 'koa-router';
import { combineLatest, defer, Observable } from 'rxjs';
import { distinctUntilChanged, map, publishReplay, refCount } from 'rxjs/operators';
import {
  context,
  cors,
  liveHealthCheck,
  LiveHealthCheckOptions,
  onError as appOnError,
  readyHealthCheck,
  ReadyHealthCheckOptions,
  rpc,
} from './middleware';
export interface ServerOptions {
  readonly keepAliveTimeout?: number;
}
type ListenOptions =
  | {
      readonly port: number;
      readonly host: string;
    }
  | {
      readonly key: string;
      readonly cert: string;
      readonly port: number;
      readonly host: string;
    };
export interface Environment {
  readonly http?: {
    readonly port: number;
    readonly host: string;
  };

  readonly https?: {
    readonly key: string;
    readonly cert: string;
    readonly port: number;
    readonly host: string;
  };
}
export interface Options {
  readonly server?: ServerOptions;
  readonly liveHealthCheck?: LiveHealthCheckOptions;
  readonly readyHealthCheck?: ReadyHealthCheckOptions;
}
type Listener = ((request: http.IncomingMessage, response: http.ServerResponse) => void);

interface HandleServerResult<T extends http.Server | https.Server> {
  readonly server: T | undefined;
  readonly listener: Listener | undefined;
  readonly app: Application | undefined;
}

async function handleServer<T extends http.Server | https.Server, TOptions extends ListenOptions>({
  monitor,
  createServer,
  options,
  app,
  keepAliveTimeout,
  prevResult: { app: prevApp, listener: prevListener, server: prevServer } = {
    app: undefined,
    listener: undefined,
    server: undefined,
  },
}: {
  readonly monitor: Monitor;
  readonly createServer: ((options: TOptions) => T);
  readonly options?: TOptions | undefined;
  readonly app: Application;
  readonly keepAliveTimeout: number;
  readonly prevResult: HandleServerResult<T> | undefined;
}): Promise<HandleServerResult<T>> {
  let server = prevServer;
  let listener = prevListener;
  if (options !== undefined) {
    const startServer = server === undefined;
    const safeServer = server === undefined ? createServer(options) : server;
    server = safeServer;

    if (app !== prevApp || prevListener === undefined) {
      if (prevListener !== undefined) {
        server.removeListener('request', prevListener);
      }

      listener = app.callback();
      server.on('request', listener);
    }

    // tslint:disable-next-line no-object-mutation
    server.keepAliveTimeout = keepAliveTimeout;

    if (startServer) {
      const { host, port } = options;
      await new Promise<void>((resolve) => safeServer.listen(port, host, 511, resolve));

      monitor
        .withLabels({
          [monitor.labels.SPAN_KIND]: 'server',
        })
        .log({
          name: 'server_listen',
          message: `Server listening on ${host}:${port}`,
          level: 'verbose',
        });
    }
  }

  return { server, listener, app };
}

const finalizeServer = async (result: HandleServerResult<http.Server | https.Server> | undefined) => {
  if (result !== undefined && result.server !== undefined) {
    const { server } = result;
    await new Promise<void>((resolve) => server.close(resolve));
  }
};

export const rpcServer$ = ({
  monitor: monitorIn,
  blockchain,
  node,
  environment,
  options$,
}: {
  readonly monitor: Monitor;
  readonly blockchain: Blockchain;
  readonly node: Node;
  readonly environment: Environment;
  readonly options$: Observable<Options>;
  // tslint:disable-next-line no-any
}): Observable<any> => {
  const monitor = monitorIn.at('rpc');
  const app$ = combineLatest(
    options$.pipe(
      map((options) => options.liveHealthCheck),
      distinctUntilChanged(),
    ),

    options$.pipe(
      map((options) => options.readyHealthCheck),
      distinctUntilChanged(),
    ),
  ).pipe(
    map(([liveHealthCheckOptions, readyHealthCheckOptions]) => {
      const app = new Application();
      app.proxy = true;
      // $FlowFixMe
      app.silent = true;

      app.on('error', appOnError({ monitor }));

      const router = new Router();

      const rpcMiddleware = rpc({ blockchain, node });
      router.use(context({ monitor }));

      if (liveHealthCheckOptions !== undefined) {
        const liveMiddleware = liveHealthCheck({
          blockchain,
          options: liveHealthCheckOptions,
        });

        router.get(liveMiddleware.name, liveMiddleware.path, liveMiddleware.middleware);
      }

      if (readyHealthCheckOptions !== undefined) {
        const readyMiddleware = readyHealthCheck({
          blockchain,
          options: readyHealthCheckOptions,
        });

        router.get(readyMiddleware.name, readyMiddleware.path, readyMiddleware.middleware);
      }

      router.use(cors).post(rpcMiddleware.name, rpcMiddleware.path, rpcMiddleware.middleware);

      app.use(router.routes());
      app.use(router.allowedMethods());

      return app;
    }),
    publishReplay(1),
    refCount(),
  );

  function createServer$<TOptions extends ListenOptions>(
    createServer: ((options: TOptions) => http.Server | https.Server),
    options?: TOptions,
  ) {
    return combineLatest(
      app$,
      options$.pipe(
        map(({ server = {} }) => {
          const { keepAliveTimeout = 60000 } = server;

          return keepAliveTimeout;
        }),
        distinctUntilChanged(),
      ),
    ).pipe(
      mergeScanLatest<[Application, number], HandleServerResult<http.Server | https.Server> | undefined>(
        (prevResult, [app, keepAliveTimeout]) =>
          defer(async () =>
            handleServer({
              monitor,
              createServer,
              options,
              app,
              keepAliveTimeout,
              prevResult,
            }),
          ),
        undefined,
      ),
      finalize<HandleServerResult<http.Server | https.Server> | undefined>(finalizeServer),
    );
  }

  return combineLatest(
    createServer$(() => http.createServer(), environment.http),
    createServer$(
      (options) =>
        https.createServer({
          cert: options.cert,
          key: options.key,
        }),
      environment.https,
    ),
  );
};
