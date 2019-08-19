import { context, cors, onError as appOnError, setupServer } from '@neo-one/http';
import { nodeLogger, rpcLogger } from '@neo-one/logger';
import { Blockchain, Node } from '@neo-one/node-core';
import { Disposable, Labels } from '@neo-one/utils';
import * as nodeHttp from 'http';
import Application from 'koa';
import Router from 'koa-router';
import serve from 'koa-static';
import { liveHealthCheck, LiveHealthCheckOptions, readyHealthCheck, ReadyHealthCheckOptions, rpc } from './middleware';

const logger = nodeLogger.child({ component: 'rpc' });

export interface Options {
  readonly http?: {
    readonly port: number;
    readonly host?: string;
    readonly keepAliveTimeout?: number;
  };
  readonly splashScreen?: {
    readonly path: string;
  };
  readonly liveHealthCheck?: LiveHealthCheckOptions;
  readonly readyHealthCheck?: ReadyHealthCheckOptions;
}

export const setupRPCServer = async ({
  blockchain,
  node,
  options: { http, splashScreen, liveHealthCheck: liveHealthCheckOptions, readyHealthCheck: readyHealthCheckOptions },
}: {
  readonly blockchain: Blockchain;
  readonly node: Node;
  readonly options: Options;
}): Promise<Disposable> => {
  if (http === undefined) {
    return () => {
      // do nothing
    };
  }
  // tslint:disable-next-line:no-any
  const app = new Application<any, {}>();
  app.proxy = true;
  app.silent = true;

  app.on('error', appOnError(logger));

  // tslint:disable-next-line:no-any
  const router = new Router<any, {}>();

  const rpcMiddleware = rpc({ blockchain, node });
  router.use(context(logger));

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

  if (splashScreen !== undefined) {
    router.get('index', '/', serve(splashScreen.path));
  }

  router.use(cors).post(rpcMiddleware.name, rpcMiddleware.path, rpcMiddleware.middleware);

  app.use(router.routes());
  app.use(cors);
  app.use(router.allowedMethods());

  const server = nodeHttp.createServer();

  const { host = '0.0.0.0', port } = http;
  const disposable = await setupServer(app, server, host, port, http.keepAliveTimeout);
  rpcLogger.info({ [Labels.SPAN_KIND]: 'server', title: 'rpc_server_listen' }, `Server listening on ${host}:${port}`);

  return disposable;
};
