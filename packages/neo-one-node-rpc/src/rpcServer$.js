/* @flow */
import { type Blockchain, type Node } from '@neo-one/node-core';
import Koa from 'koa';
import type { Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';
import Router from 'koa-router';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { defer } from 'rxjs/observable/defer';
import http from 'http';
import https from 'https';
import {
  distinctUntilChanged,
  map,
  mergeScan,
  publishReplay,
  refCount,
} from 'rxjs/operators';
import { finalize } from '@neo-one/utils';

import {
  type LiveHealthCheckOptions,
  type ReadyHealthCheckOptions,
  context,
  cors,
  liveHealthCheck,
  onError as appOnError,
  readyHealthCheck,
  rpc,
} from './middleware';

export type ServerOptions = {|
  keepAliveTimeout: number,
|};

type ListenOptions =
  | {|
      port: number,
      host: string,
    |}
  | {|
      key: string,
      cert: string,
      port: number,
      host: string,
    |};

export type Environment = {|
  http?: {|
    port: number,
    host: string,
  |},
  https?: {|
    key: string,
    cert: string,
    port: number,
    host: string,
  |},
|};

export type Options = {|
  server: ServerOptions,
  liveHealthCheck: LiveHealthCheckOptions,
  readyHealthCheck: ReadyHealthCheckOptions,
|};

type Listener = (
  request: http.IncomingMessage,
  response: http.ServerResponse,
) => void;
type HandleServerResult<T: http.Server | https.Server> = {|
  server: ?T,
  listener: ?Listener,
  app: Koa,
|};

async function handleServer<
  T: http.Server | https.Server,
  TOptions: ListenOptions,
>({
  monitor,
  createServer,
  options,
  app,
  keepAliveTimeout,
  prevResult,
}: {|
  monitor: Monitor,
  createServer: (options: TOptions) => T,
  options?: ?TOptions,
  app: Koa,
  keepAliveTimeout: number,
  prevResult: ?HandleServerResult<T>,
|}): Promise<HandleServerResult<T>> {
  const { app: prevApp, listener: prevListener, server: prevServer } =
    prevResult || {};

  let server = prevServer;
  let listener = prevListener;
  if (options != null) {
    const startServer = server == null;
    const safeServer = server == null ? createServer(options) : server;
    server = safeServer;

    if (app !== prevApp || prevListener == null) {
      if (prevListener != null) {
        server.removeListener('request', prevListener);
      }

      listener = app.callback();
      server.on('request', listener);
    }

    // $FlowFixMe
    server.keepAliveTimeout = keepAliveTimeout;

    if (startServer) {
      const { host, port } = options;
      await new Promise(resolve =>
        safeServer.listen(port, host, 511, () => resolve()),
      );
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

const finalizeServer = async (
  result: ?HandleServerResult<http.Server | https.Server>,
) => {
  if (result != null && result.server != null) {
    const { server } = result;
    await new Promise(resolve => server.close(() => resolve()));
  }
};

export default ({
  monitor: monitorIn,
  blockchain,
  node,
  environment,
  options$,
}: {|
  monitor: Monitor,
  blockchain: Blockchain,
  node: Node,
  environment: Environment,
  options$: Observable<Options>,
|}): Observable<$FlowFixMe> => {
  const monitor = monitorIn.at('rpc');
  const app$ = combineLatest(
    options$.pipe(
      map(options => options.liveHealthCheck),
      distinctUntilChanged(),
    ),
    options$.pipe(
      map(options => options.readyHealthCheck),
      distinctUntilChanged(),
    ),
  ).pipe(
    map(([liveHealthCheckOptions, readyHealthCheckOptions]) => {
      const app = new Koa();
      app.proxy = true;
      // $FlowFixMe
      app.silent = true;

      app.on('error', appOnError({ monitor }));

      const router = new Router();
      const liveMiddleware = liveHealthCheck({
        blockchain,
        options: liveHealthCheckOptions,
      });
      const readyMiddleware = readyHealthCheck({
        blockchain,
        options: readyHealthCheckOptions,
      });
      const rpcMiddleware = rpc({ blockchain, node });
      router
        .use(context({ monitor }))
        .get(
          liveMiddleware.name,
          liveMiddleware.path,
          liveMiddleware.middleware,
        )
        .get(
          readyMiddleware.name,
          readyMiddleware.path,
          readyMiddleware.middleware,
        )
        .use(cors)
        .post(rpcMiddleware.name, rpcMiddleware.path, rpcMiddleware.middleware);

      app.use(router.routes());
      app.use(router.allowedMethods());

      return app;
    }),
    publishReplay(1),
    refCount(),
  );

  const createServer$ = (
    createServer: () => http.Server | https.Server,
    options?: ListenOptions,
  ) =>
    combineLatest(
      app$,
      options$.pipe(
        map(opts => opts.server.keepAliveTimeout),
        distinctUntilChanged(),
      ),
    ).pipe(
      mergeScan((prevResult, [app, keepAliveTimeout]) =>
        defer(() =>
          handleServer({
            monitor,
            createServer,
            options,
            app,
            keepAliveTimeout,
            prevResult,
          }),
        ),
      ),
      finalize(finalizeServer),
    );

  return combineLatest(
    createServer$(() => http.createServer(), environment.http),
    createServer$(
      options =>
        https.createServer({
          cert: (options: $FlowFixMe).cert,
          key: (options: $FlowFixMe).key,
        }),
      environment.https,
    ),
  );
};
