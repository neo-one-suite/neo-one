import { context, cors, createServer$, onError as appOnError } from '@neo-one/http';
import { nodeLogger } from '@neo-one/logger';
import { Blockchain, Node } from '@neo-one/node-core';
import * as http from 'http';
import Application from 'koa';
import rateLimit from 'koa-ratelimit-lru';
import Router from 'koa-router';
import serve from 'koa-static';
import { combineLatest, Observable, of as _of } from 'rxjs';
import { distinctUntilChanged, map, publishReplay, refCount, switchMap } from 'rxjs/operators';
import {
  liveHealthCheck,
  LiveHealthCheckOptions,
  readyHealthCheck,
  ReadyHealthCheckOptions,
  rpc,
  TooBusyCheckOptions,
} from './middleware';

const logger = nodeLogger.child({ component: 'rpc' });

export interface ServerOptions {
  readonly keepAliveTimeout?: number;
}
export interface Environment {
  readonly http?: {
    readonly port: number;
    readonly host: string;
  };

  readonly splashScreen?: {
    readonly path: string;
  };
}
export interface Options {
  readonly server?: ServerOptions;
  readonly liveHealthCheck?: LiveHealthCheckOptions;
  readonly readyHealthCheck?: ReadyHealthCheckOptions;
  readonly rateLimit?: rateLimit.Options & { readonly enabled?: boolean };
  readonly tooBusyCheck?: TooBusyCheckOptions & { readonly enabled?: boolean };
}

export const rpcServer$ = ({
  blockchain,
  node,
  environment,
  options$,
}: {
  readonly blockchain: Blockchain;
  readonly node: Node;
  readonly environment: Environment;
  readonly options$: Observable<Options>;
  // tslint:disable-next-line no-any
}): Observable<any> => {
  const app$ = combineLatest([
    options$.pipe(
      map((options) => options.liveHealthCheck),
      distinctUntilChanged(),
    ),
    options$.pipe(
      map((options) => options.readyHealthCheck),
      distinctUntilChanged(),
    ),
    options$.pipe(
      map((options) => options.tooBusyCheck),
      distinctUntilChanged(),
    ),
    options$.pipe(
      map((options) => options.rateLimit),
      distinctUntilChanged(),
    ),
  ]).pipe(
    switchMap(async ([liveHealthCheckOptions, readyHealthCheckOptions, tooBusyCheckOptions, rateLimitOptions]) => {
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

      if (rateLimitOptions !== undefined && rateLimitOptions.enabled) {
        router.use(rateLimit(rateLimitOptions));
      }

      if (tooBusyCheckOptions !== undefined && tooBusyCheckOptions.enabled) {
        // only importing if we set options, tooBusy starts a loop that will be left open otherwise.
        const { tooBusyCheck } = await import('./middleware/tooBusyCheck');
        router.use(tooBusyCheck(tooBusyCheckOptions));
      }

      if (environment.splashScreen !== undefined) {
        router.get('index', '/', serve(environment.splashScreen.path));
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

  return environment.http === undefined
    ? _of(undefined)
    : createServer$(app$, keepAliveTimeout$, environment.http, () => http.createServer());
};
