import {
  areTasksDone,
  CRUDRequest,
  CRUDRequestStart,
  ReadRequest,
  ReadResponse,
  TaskList,
  TaskStatus,
} from '@neo-one/server-plugin';
import { Context } from 'mali';
import { EMPTY, Observable, of as _of } from 'rxjs';
import { Observer } from 'rxjs/Observer';
import { catchError, map, switchMap } from 'rxjs/operators';
import pkg from '../../package.json';
import { ResourcesManager } from '../ResourcesManager';
import { Server } from '../Server';

function makeObservable$<TData>(ctx: Context): Observable<TData> {
  return Observable.create((observer: Observer<TData>) => {
    ctx.req.on('data', (value: TData) => {
      observer.next(value);
    });
    ctx.req.on('error', (error: Error) => {
      observer.error(error);
    });
    ctx.req.on('end', () => {
      observer.complete();
    });

    return () => ctx.req.destroy();
  });
}

export const services = ({ server }: { readonly server: Server }) => {
  async function handleCRUD<TRequest extends CRUDRequest, TStartRequest extends CRUDRequestStart>(
    ctx: Context,
    // tslint:disable-next-line no-any
    createTaskList: (request: TStartRequest, resourcesManager: ResourcesManager<any, any>) => TaskList,
  ): Promise<void> {
    const requests$ = makeObservable$<TRequest | TStartRequest>(ctx);
    let taskList: TaskList | undefined;
    let done = false;
    await requests$
      .pipe(
        switchMap((request: TRequest | TStartRequest) => {
          switch (request.type) {
            case 'start':
              if (taskList === undefined) {
                taskList = createTaskList(
                  // tslint:disable-next-line no-any
                  request as any,
                  server.pluginManager.getResourcesManager({
                    // tslint:disable-next-line no-any
                    plugin: (request as any).plugin,
                    // tslint:disable-next-line no-any
                    resourceType: (request as any).resourceType,
                  }),
                );
              }

              return taskList.status$;
            case 'abort':
              if (taskList === undefined) {
                return EMPTY;
              }

              return taskList.abort$();
            default:
              throw new Error('Unknown request');
          }
        }),
        map((tasks: ReadonlyArray<TaskStatus>) => {
          if (!done) {
            ctx.res.write({ tasks: JSON.stringify(tasks) });
            if (areTasksDone(tasks)) {
              done = true;
              ctx.res.end();
            }
          }
        }),
      )
      .toPromise();
  }

  // tslint:disable-next-line no-any
  async function handleRead(ctx: Context, createObservable$: (request: any) => Observable<any>): Promise<void> {
    const requests$ = makeObservable$<ReadRequest>(ctx);
    // tslint:disable-next-line no-any
    let observable$: Observable<any> | undefined;
    await requests$
      .pipe(
        switchMap((request: ReadRequest) => {
          switch (request.type) {
            case 'start':
              if (observable$ === undefined) {
                observable$ = createObservable$(request).pipe(map((response) => ({ type: 'response', response })));
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
        catchError((error) =>
          _of({
            type: 'error',
            code: error.code == undefined || typeof error.code !== 'string' ? 'UNKNOWN_ERROR' : error.code,
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
    reset: async (ctx: Context) => {
      await server.reset();
      ctx.res = {};
    },
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
      await handleRead(ctx, () => server.pluginManager.plugins$.pipe(map((plugin) => ({ plugin }))));
    },
    getAllResources: async (ctx: Context) => {
      await handleRead(ctx, () =>
        server.pluginManager.allResources$.pipe(map((value) => ({ resources: JSON.stringify(value) }))),
      );
    },
    getResources: async (ctx: Context) => {
      await handleRead(ctx, (request) =>
        server.pluginManager
          .getResourcesManager({
            plugin: request.plugin,
            resourceType: request.resourceType,
          })
          .getResources$(JSON.parse(request.options))
          .pipe(map((value) => ({ resources: JSON.stringify(value) }))),
      );
    },
    getResource: async (ctx: Context) => {
      await handleRead(ctx, (request) =>
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
            map((value) => ({
              resource: value === undefined ? value : JSON.stringify(value),
            })),
          ),
      );
    },
    createResource: async (ctx: Context) => {
      await handleCRUD(ctx, (request: CRUDRequestStart, resourceManager) =>
        resourceManager.create(request.name, JSON.parse(request.options)),
      );
    },
    deleteResource: async (ctx: Context) => {
      await handleCRUD(ctx, (request: CRUDRequestStart, resourceManager) =>
        resourceManager.delete(request.name, JSON.parse(request.options)),
      );
    },
    startResource: async (ctx: Context) => {
      await handleCRUD(ctx, (request: CRUDRequestStart, resourceManager) =>
        resourceManager.start(request.name, JSON.parse(request.options)),
      );
    },
    stopResource: async (ctx: Context) => {
      await handleCRUD(ctx, (request: CRUDRequestStart, resourceManager) =>
        resourceManager.stop(request.name, JSON.parse(request.options)),
      );
    },
  };
};
