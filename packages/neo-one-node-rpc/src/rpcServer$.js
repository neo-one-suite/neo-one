/* @flow */
import { type Blockchain, type Node } from '@neo-one/node-core';
import { type Log, finalize } from '@neo-one/utils';
import Koa from 'koa';
import { Observable } from 'rxjs/Observable';

import { combineLatest } from 'rxjs/observable/combineLatest';
import { defer } from 'rxjs/observable/defer';
import http from 'http';
import https from 'https';
import {
  distinct,
  map,
  mergeScan,
  publishReplay,
  refCount,
} from 'rxjs/operators';

import {
  type CreateLogForContext,
  type CreateProfile,
  type LiveHealthCheckOptions,
  type ReadyHealthCheckOptions,
  context,
  cors,
  liveHealthCheck,
  logger,
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
  log,
  createServer,
  options,
  app,
  keepAliveTimeout,
  prevResult,
}: {|
  log: Log,
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
      log({ event: 'SERVER_LISTENING', host, port });
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
  log,
  createLogForContext,
  createProfile,
  blockchain,
  node,
  environment,
  options$,
}: {|
  log: Log,
  createLogForContext: CreateLogForContext,
  createProfile: CreateProfile,
  blockchain: Blockchain,
  node: Node,
  environment: Environment,
  options$: Observable<Options>,
|}): Observable<$FlowFixMe> => {
  const app$ = combineLatest(
    options$.pipe(map(options => options.liveHealthCheck), distinct()),
    options$.pipe(map(options => options.readyHealthCheck), distinct()),
  ).pipe(
    map(([liveHealthCheckOptions, readyHealthCheckOptions]) => {
      const app = new Koa();
      app.proxy = true;
      // $FlowFixMe
      app.silent = true;

      app.on('error', appOnError({ log }));

      const middlewares = [
        context({ createLog: createLogForContext, createProfile }),
        liveHealthCheck({ blockchain, options: liveHealthCheckOptions }),
        readyHealthCheck({ blockchain, options: readyHealthCheckOptions }),
        logger,
        cors,
        rpc({ blockchain, node }),
      ];

      for (const middleware of middlewares) {
        app.use(middleware.middleware);
      }

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
      options$.pipe(map(opts => opts.server.keepAliveTimeout), distinct()),
    ).pipe(
      mergeScan((prevResult, [app, keepAliveTimeout]) =>
        defer(() =>
          handleServer({
            log,
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
