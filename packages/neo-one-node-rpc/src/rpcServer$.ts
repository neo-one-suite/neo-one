import { context, cors, createServer$, onError as appOnError } from '@neo-one/http';
import { Monitor } from '@neo-one/monitor';
import { Blockchain, Node } from '@neo-one/node-core';
import * as http from 'http';
import * as https from 'https';
import Application from 'koa';
import Router from 'koa-router';
import { combineLatest, Observable, of as _of } from 'rxjs';
import { distinctUntilChanged, map, publishReplay, refCount } from 'rxjs/operators';
import { liveHealthCheck, LiveHealthCheckOptions, readyHealthCheck, ReadyHealthCheckOptions, rpc } from './middleware';

export interface ServerOptions {
  readonly keepAliveTimeout?: number;
}
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
      app.use(cors);
      app.use(router.allowedMethods());

      return app;
    }),
    publishReplay(1),
    refCount(),
  );

  const keepAliveTimeout$ = options$.pipe(
    map((options) => (options.server === undefined ? undefined : options.server.keepAliveTimeout)),
  );

  return combineLatest(
    environment.http === undefined
      ? _of(undefined)
      : createServer$(monitor, app$, keepAliveTimeout$, environment.http, () => http.createServer()),
    environment.https === undefined
      ? _of(undefined)
      : createServer$(monitor, app$, keepAliveTimeout$, environment.https, (options) =>
          https.createServer({
            cert: options.cert,
            key: options.key,
          }),
        ),
  );
};
