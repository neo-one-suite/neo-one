/* @flow */
import {
  type CRUDRequest,
  type CRUDRequestStart,
  type ModifyResourceResponse,
  type ReadResponse,
  type ReadRequest,
} from '@neo-one/server-plugin';
// flowlint-next-line untyped-type-import:off
import type { Context } from 'mali';
import { Observable } from 'rxjs/Observable';

import { catchError, map, switchMap } from 'rxjs/operators';
import { of as _of } from 'rxjs/observable/of';

import { type AbortSignal, AbortController } from '../utils';
import type ResourcesManager from '../ResourcesManager';
import type Server from '../Server';

import pkg from '../../package.json';

export type Config = {||};
export const SCHEMA = {
  type: 'object',
  required: [],
  properties: {},
};

const makeObservable = (ctx: Context): Observable<*> =>
  Observable.create(observer => {
    ctx.req.on('data', value => {
      observer.next(value);
    });
    ctx.req.on('error', error => {
      observer.error(error);
    });
    ctx.req.on('end', () => {
      observer.complete();
    });
    return () => ctx.req.destroy();
  });

export const middleware = ({
  server,
  // eslint-disable-next-line
  config,
}: {|
  server: Server,
  config: Config,
|}) => {
  async function handleCRUD<
    TRequest: CRUDRequest,
    TStartRequest: CRUDRequestStart,
  >(
    ctx: Context,
    createObservable$: (
      request: TStartRequest,
      signal: AbortSignal,
      resourcesManager: ResourcesManager<*, *>,
    ) => Observable<ModifyResourceResponse>,
  ): Promise<void> {
    const requests$ = makeObservable(ctx);
    const abortController = new AbortController();
    const aborted$ = _of({ type: 'aborted' });
    let observable$;
    await requests$
      .pipe(
        switchMap((request: TRequest) => {
          switch (request.type) {
            case 'start':
              if (observable$ == null && !abortController.signal.aborted) {
                observable$ = createObservable$(
                  (request: $FlowFixMe),
                  abortController.signal,
                  server.pluginManager.getResourcesManager({
                    plugin: request.plugin,
                    resourceType: request.resourceType,
                  }),
                );
              }
              return observable$ || aborted$;
            case 'abort':
              abortController.abort();
              return observable$ || aborted$;
            default:
              return _of({
                type: 'error',
                code: 'UNKNOWN_REQUEST',
                message: `Unknown request: ${request.type}`,
              });
          }
        }),
        map((response: ModifyResourceResponse) => {
          ctx.res.write(response);
          if (
            response.type === 'done' ||
            response.type === 'error' ||
            response.type === 'aborted'
          ) {
            ctx.res.end();
          }
        }),
      )
      .toPromise();
  }

  async function handleRead(
    ctx: Context,
    createObservable$: (request: $FlowFixMe) => Observable<$FlowFixMe>,
  ): Promise<void> {
    const requests$ = makeObservable(ctx);
    let observable$;
    await requests$
      .pipe(
        switchMap((request: ReadRequest) => {
          switch (request.type) {
            case 'start':
              if (observable$ == null) {
                observable$ = createObservable$(request).pipe(
                  map(response => ({ type: 'response', response })),
                );
              }
              return observable$;
            case 'abort':
              return _of({ type: 'aborted' });
            default:
              return _of({
                type: 'error',
                code: 'UNKNOWN_REQUEST',
                message: `Unknown request: ${request.type}`,
              });
          }
        }),
        catchError(error =>
          _of({
            type: 'error',
            code:
              error.code == null || typeof error.code !== 'string'
                ? 'UNKNOWN_ERROR'
                : error.code,
            message: error.message,
          }),
        ),
        map((response: ReadResponse) => {
          ctx.res.write(response);
          if (response.type === 'aborted' || response.type === 'error') {
            ctx.res.end();
          }
        }),
      )
      .toPromise();
  }

  return {
    getVersion: async (ctx: Context) => {
      ctx.res = { version: pkg.version };
    },
    getDebug: async (ctx: Context) => {
      ctx.res = { debug: JSON.stringify(server.getDebug()) };
    },
    getAllPlugins: async (ctx: Context) => {
      ctx.res = { plugins: server.pluginManager.plugins };
    },
    getPlugins: async (ctx: Context) => {
      await handleRead(ctx, () =>
        server.pluginManager.plugins$.pipe(map(plugin => ({ plugin }))),
      );
    },
    getAllResources: async (ctx: Context) => {
      await handleRead(ctx, () =>
        server.pluginManager.allResources$.pipe(
          map(value => ({ resources: JSON.stringify(value) })),
        ),
      );
    },
    getResources: async (ctx: Context) => {
      await handleRead(ctx, request =>
        server.pluginManager
          .getResourcesManager({
            plugin: request.plugin,
            resourceType: request.resourceType,
          })
          .getResources$(JSON.parse(request.options))
          .pipe(map(value => ({ resources: JSON.stringify(value) }))),
      );
    },
    getResource: async (ctx: Context) => {
      await handleRead(ctx, request =>
        server.pluginManager
          .getResourcesManager({
            plugin: request.plugin,
            resourceType: request.resourceType,
          })
          .getResource$({
            name: request.name,
            options: JSON.parse(request.options),
          })
          .pipe(
            map(value => ({
              resource: value == null ? value : JSON.stringify(value),
            })),
          ),
      );
    },
    createResource: async (ctx: Context) => {
      await handleCRUD(
        ctx,
        (request: CRUDRequestStart, signal, resourceManager) =>
          resourceManager.create$(
            request.name,
            JSON.parse(request.options),
            signal,
          ),
      );
    },
    deleteResource: async (ctx: Context) => {
      await handleCRUD(
        ctx,
        (request: CRUDRequestStart, signal, resourceManager) =>
          resourceManager.delete$(
            request.name,
            JSON.parse(request.options),
            signal,
          ),
      );
    },
    startResource: async (ctx: Context) => {
      await handleCRUD(
        ctx,
        (request: CRUDRequestStart, signal, resourceManager) =>
          resourceManager.start$(
            request.name,
            JSON.parse(request.options),
            signal,
          ),
      );
    },
    stopResource: async (ctx: Context) => {
      await handleCRUD(
        ctx,
        (request: CRUDRequestStart, signal, resourceManager) =>
          resourceManager.stop$(
            request.name,
            JSON.parse(request.options),
            signal,
          ),
      );
    },
  };
};
