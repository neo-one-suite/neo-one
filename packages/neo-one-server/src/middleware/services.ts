// tslint:disable no-any no-object-mutation
import {
  areTasksDone,
  CRUDRequest,
  CRUDRequestStart,
  ExecuteTaskListRequest,
  ExecuteTaskListRequestStart,
  ReadRequest,
  ReadResponse,
  TaskList,
  TaskStatus,
  VERSION,
} from '@neo-one/server-plugin';
import { Context } from 'mali';
import { EMPTY, Observable, Observer, of as _of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ResourcesManager } from '../ResourcesManager';
import { Server } from '../Server';

function makeObservable$<TData>(ctx: Context): Observable<TData> {
  return new Observable((observer: Observer<TData>) => {
    let completed = false;
    (ctx as any).req.on('data', (value: TData) => {
      observer.next(value);
    });
    (ctx as any).req.on('error', (error: Error) => {
      observer.error(error);
    });
    (ctx as any).req.on('end', () => {
      completed = true;
      observer.complete();
    });

    return () => {
      if (!completed) {
        (ctx as any).req.destroy();
      }
    };
  });
}

export const services = ({ server }: { readonly server: Server }) => {
  async function executeTaskList<
    TRequest extends ExecuteTaskListRequest,
    TStartRequest extends ExecuteTaskListRequestStart
  >(ctx: Context, createTaskList: (request: TStartRequest) => TaskList): Promise<void> {
    const requests$ = makeObservable$<TRequest | TStartRequest>(ctx);
    let taskList: TaskList | undefined;
    let done = false;
    await requests$
      .pipe(
        switchMap((request: TRequest | TStartRequest) => {
          switch (request.type) {
            case 'start':
              if (taskList === undefined) {
                // tslint:disable-next-line no-any
                taskList = createTaskList(request as any);
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
            (ctx as any).res.write({ tasks: JSON.stringify(tasks) });
            if (areTasksDone(tasks)) {
              done = true;
              (ctx as any).res.end();
            }
          }
        }),
      )
      .toPromise();
  }
  async function handleCRUD<TRequest extends CRUDRequest, TStartRequest extends CRUDRequestStart>(
    ctx: Context,
    createTaskList: (request: TStartRequest, resourcesManager: ResourcesManager) => TaskList,
  ): Promise<void> {
    return executeTaskList<TRequest, TStartRequest>(ctx, (request) =>
      createTaskList(
        request,
        server.pluginManager.getResourcesManager({
          // tslint:disable-next-line no-any
          plugin: (request as any).plugin,
          // tslint:disable-next-line no-any
          resourceType: (request as any).resourceType,
        }),
      ),
    );
  }

  // tslint:disable-next-line no-any
  async function handleRead(ctx: Context, createObservable$: (request: any) => Observable<any>): Promise<void> {
    const requests$ = makeObservable$<ReadRequest>(ctx);
    // tslint:disable-next-line no-any
    let observable$: Observable<any> | undefined;
    let done = false;
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
          if (!done) {
            (ctx as any).res.write(response);
            if (response.type === 'aborted' || response.type === 'error') {
              done = true;
              (ctx as any).res.end();
            }
          }
        }),
      )
      .toPromise();
  }

  return {
    reset: async (ctx: Context) => {
      await server.reset();
      (ctx as any).res = {};
    },
    getVersion: async (ctx: Context) => {
      (ctx as any).res = { version: VERSION };
    },
    verify: async (ctx: Context) => {
      (ctx as any).res = { ready: true };
    },
    getDebug: async (ctx: Context) => {
      (ctx as any).res = { debug: JSON.stringify(server.getDebug()) };
    },
    getAllPlugins: async (ctx: Context) => {
      (ctx as any).res = { plugins: server.pluginManager.plugins };
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
    executeTaskList: async (ctx: Context) => {
      await executeTaskList(ctx, (request: ExecuteTaskListRequestStart) =>
        server.pluginManager
          .getPlugin({
            plugin: request.plugin,
          })
          .executeTaskList(server.pluginManager, request.options),
      );
    },
  };
};
