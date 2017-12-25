/* @flow */
// flowlint untyped-import:off
import { type Log, logInvoke, onComplete, utils } from '@neo-one/utils';
import {
  type BaseResource,
  type DescribeTable,
  type MasterResourceAdapter,
  type ModifyResourceResponse,
  type Plugin,
  type ResourceAdapter,
  type ResourceType,
  compoundName,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import type { Subject } from 'rxjs/Subject';

import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { concat } from 'rxjs/observable/concat';
import { defer } from 'rxjs/observable/defer';
import { empty } from 'rxjs/observable/empty';
import fs from 'fs-extra';
import { of as _of } from 'rxjs/observable/of';
import path from 'path';

import { type AbortSignal, AbortController } from './utils';
import type PortAllocator from './PortAllocator';
import Ready from './Ready';
import { ResourceNoStartError, ResourceNoStopError } from './errors';

const RESOURCES_PATH = 'resources';
const RESOURCES_READY_PATH = 'ready';

const DOES_NOT_EXIST = 'DOES_NOT_EXIST';
const DUPLICATE_OPERATION = 'DUPLICATE_OPERATION';
const SOMETHING_WENT_WRONG = 'SOMETHING_WENT_WRONG';

type ResourceAdapters<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> = { [resource: string]: ResourceAdapter<Resource, ResourceOptions> };
type AbortControllers = { [resource: string]: AbortController };
type ModifyResources = {
  [resource: string]: Observable<ModifyResourceResponse>,
};

export type InitError = {|
  resourceType: string,
  resource: string,
  error: Error,
|};

export default class ResourcesManager<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> {
  _log: Log;
  _dataPath: string;
  _resourceType: ResourceType<Resource, ResourceOptions>;
  _masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>;
  _portAllocator: PortAllocator;
  _plugin: Plugin;
  _resourceAdapters: ResourceAdapters<Resource, ResourceOptions>;

  _resourcesPath: string;
  _resourcesReady: Ready;

  _createAbortControllers: AbortControllers;
  _creation$: ModifyResources;

  _deletion$: ModifyResources;

  _startAbortControllers: AbortControllers;
  _starts$: ModifyResources;

  _stopAbortControllers: AbortControllers;
  _stops$: ModifyResources;

  _resourceAdaptersStarted: { [resource: string]: boolean };

  _update$: Subject<void>;
  resources$: Observable<Array<Resource>>;

  constructor({
    log,
    dataPath,
    resourceType,
    masterResourceAdapter,
    portAllocator,
  }: {|
    log: Log,
    dataPath: string,
    resourceType: ResourceType<Resource, ResourceOptions>,
    masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>,
    portAllocator: PortAllocator,
  |}) {
    this._log = log;
    this._dataPath = dataPath;
    this._resourceType = resourceType;
    this._masterResourceAdapter = masterResourceAdapter;
    this._portAllocator = portAllocator;
    this._plugin = this._resourceType.plugin;
    this._resourceAdapters = {};

    this._resourcesPath = path.resolve(dataPath, RESOURCES_PATH);
    this._resourcesReady = new Ready({
      dir: path.resolve(dataPath, RESOURCES_READY_PATH),
    });

    this._createAbortControllers = {};
    this._creation$ = {};

    this._deletion$ = {};

    this._startAbortControllers = {};
    this._starts$ = {};

    this._stopAbortControllers = {};
    this._stops$ = {};

    this._resourceAdaptersStarted = {};

    this._update$ = new ReplaySubject(1);
    this.resources$ = this._update$.pipe(
      switchMap(() => {
        const adapters = utils.values(this._resourceAdapters);
        if (adapters.length === 0) {
          return _of([]);
        }

        return combineLatest(adapters.map(adapter => adapter.resource$));
      }),
      shareReplay(1),
    );
    this._update$.next();
  }

  async init(): Promise<Array<InitError>> {
    const result = await logInvoke(
      this._log,
      'RESOURCES_MANAGER_INIT',
      {
        plugin: this._plugin.name,
        resourceType: this._resourceType.name,
      },
      async () => {
        await Promise.all([
          fs.ensureDir(this._resourcesPath),
          fs.ensureDir(this._resourcesReady.dir),
        ]);
        const resources = await this._resourcesReady.getAll();

        const foundResourceAdapters = new Set();
        resources.forEach((name: string) => {
          if (foundResourceAdapters.has(name)) {
            throw new Error(
              `Something went wrong, found duplicate resource name: ${this._getSimpleName(
                name,
              )}`,
            );
          }
          foundResourceAdapters.add(name);
        });

        this._resourceAdapters = {};
        const results = await Promise.all(
          resources.map(async (name: string): Promise<?InitError> => {
            try {
              await this._init(name);
              return null;
            } catch (error) {
              return {
                resourceType: this._resourceType.name,
                resource: name,
                error,
              };
            }
          }),
        );
        this._update$.next();
        return results.filter(Boolean);
      },
    );

    return result;
  }

  async destroy(): Promise<void> {
    await logInvoke(
      this._log,
      'RESOURCES_MANAGER_DESTROY',
      {
        plugin: this._plugin.name,
        resourceType: this._resourceType.name,
      },
      async () => {
        await Promise.all(
          utils
            .entries(this._resourceAdapters)
            .map(([name, resourceAdapter]) =>
              this._destroy(name, resourceAdapter).catch(() => {}),
            ),
        );
        this._update$.next();
      },
    );
  }

  getResources$(options: ResourceOptions): Observable<Array<Resource>> {
    this._log({
      event: 'RESOURCES_MANAGER_GET_RESOURCES',
      plugin: this._plugin.name,
      resourceType: this._resourceType.name,
      options,
    });

    return this.resources$.pipe(
      map(resources => this._resourceType.filterResources(resources, options)),
    );
  }

  getResource$({
    name,
    options,
  }: {|
    name: string,
    options: ResourceOptions,
  |}): Observable<?Resource> {
    this._log({
      event: 'RESOURCES_MANAGER_GET_RESOURCE',
      plugin: this._plugin.name,
      resourceType: this._resourceType.name,
      options,
    });

    return this.getResources$(options).pipe(
      map(resources => resources.find(resource => resource.name === name)),
    );
  }

  create$(
    name: string,
    options: ResourceOptions,
    abortSignal: AbortSignal,
  ): Observable<ModifyResourceResponse> {
    this._log({
      event: 'RESOURCES_MANAGER_CREATE',
      plugin: this._plugin.name,
      resourceType: this._resourceType.name,
      name,
      options,
    });

    const { create } = this._resourceType.getCRUD();

    let create$ = _of({
      type: 'error',
      code: DUPLICATE_OPERATION,
      message: `${this._resourceType.names.capital} ${this._getSimpleName(
        name,
      )} is being ${create.names.ed}.`,
    });
    let createAbortSignal;
    const saveCreate = this._creation$[name] == null;
    if (saveCreate) {
      const abortController = new AbortController();
      this._createAbortControllers[name] = abortController;
      createAbortSignal = abortController.signal;

      create$ = defer(() => this._create$(name, options));
    }

    const cleanup = () => {
      delete this._createAbortControllers[name];
      delete this._creation$[name];
    };

    const exists = this._resourceAdapters[name] != null;
    create$ = create$.pipe(
      map(response => {
        if (response.type === 'progress') {
          abortSignal.check();
          if (createAbortSignal != null) {
            createAbortSignal.check();
          }
        }

        return response;
      }),
      catchError((error): Observable<ModifyResourceResponse> => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_CREATE_ERROR',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          error,
        });

        if (error.code === 'ABORT') {
          return _of({ type: 'aborted' });
        }

        return _of({
          type: 'error',
          code:
            error.code == null || typeof error.code !== 'string'
              ? SOMETHING_WENT_WRONG
              : error.code,
          message:
            `Something went wrong while ${create.names.ing} ` +
            `${this._resourceType.names.lower} ${this._getSimpleName(name)}: ${
              error.message
            }`,
        });
      }),
      map(response => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_CREATE_RESPONSE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          response: { ...response },
        });

        if (response.type === 'aborted' || response.type === 'error') {
          cleanup();
          const controller = new AbortController();
          if (!exists) {
            this.delete$(name, options, controller.signal)
              .toPromise()
              .catch(() => {});
          }
        } else if (response.type === 'done') {
          this._update$.next();
        }

        return response;
      }),
      onComplete(() => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_CREATE_COMPLETE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
        });
        cleanup();
      }),
      shareReplay(),
    );
    if (saveCreate) {
      this._creation$[name] = create$;
    }

    return create$;
  }

  _create$(
    name: string,
    options: ResourceOptions,
  ): Observable<ModifyResourceResponse> {
    const { create } = this._resourceType.getCRUD();
    let create$ = _of({
      type: 'error',
      code: 'RESOURCE_EXIST',
      message: `${this._resourceType.names.capital} ${this._getSimpleName(
        name,
      )} already exists.`,
    });
    if (this._resourceAdapters[name] == null) {
      const resourceAdapter$ = this._masterResourceAdapter.createResourceAdapter$(
        {
          name,
          dataPath: path.resolve(this._resourcesPath, name),
        },
        options,
      );

      this._log({
        event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_CREATE',
        plugin: this._plugin.name,
        resourceType: this._resourceType.name,
        name,
      });
      const persist$ = defer(async () => {
        await this._resourcesReady.write(name);
        return {
          type: 'progress',
          persist: true,
          message: 'Completed final setup',
        };
      });
      create$ = concat(
        _of({
          type: 'progress',
          message: `${create.names.ingUpper} ${
            this._resourceType.names.lower
          } ${this._getSimpleName(name)}`,
        }),
        resourceAdapter$.pipe(
          switchMap(response => {
            if (response.type === 'progress') {
              return _of(response);
            }

            this._resourceAdapters[name] = response.resourceAdapter;
            return empty();
          }),
        ),
        _of({
          type: 'progress',
          message:
            `Executing final setup of ${this._resourceType.names.lower} ` +
            `${this._getSimpleName(name)}`,
        }),
        persist$,
        _of({
          type: 'progress',
          persist: true,
          message: `${create.names.edUpper} ${
            this._resourceType.names.lower
          } ${this._getSimpleName(name)}`,
        }),
        _of({ type: 'done' }),
      );
    }

    return create$;
  }

  delete$(
    name: string,
    options: ResourceOptions,
    abortSignal: AbortSignal,
  ): Observable<ModifyResourceResponse> {
    this._log({
      event: 'RESOURCES_MANAGER_DELETE',
      plugin: this._plugin.name,
      resourceType: this._resourceType.name,
      name,
    });

    const { create, delete: del, start } = this._resourceType.getCRUD();
    const create$ = this._creation$[name];
    const createAbortController = this._createAbortControllers[name];
    let initial$ = ((empty(): $FlowFixMe): Observable<ModifyResourceResponse>);
    if (create$ != null && createAbortController != null) {
      initial$ = concat(
        _of({
          type: 'progress',
          message: `${this._resourceType.names.lower} ${this._getSimpleName(
            name,
          )} is ${create.names.ing}, aborting`,
        }),
        defer(async () => {
          createAbortController.abort();
          await create$.toPromise();
          return {
            type: 'progress',
            persist: true,
            message: `Aborted ${create.name}`,
          };
        }),
      );
    }

    const start$ = this._starts$[name];
    const startAbortController = this._startAbortControllers[name];
    const stop$ = this._stops$[name];
    const started = this._resourceAdaptersStarted[name];
    if (start != null && start$ != null && startAbortController != null) {
      initial$ = concat(
        initial$,
        _of({
          type: 'progress',
          message: `${this._resourceType.names.capital} ${this._getSimpleName(
            name,
          )} is ${start.names.ing}, aborting`,
        }),
        defer(async () => {
          startAbortController.abort();
          await start$.toPromise();
          return {
            type: 'progress',
            persist: true,
            message: `Aborted ${start.name}`,
          };
        }),
      );
    } else if (started) {
      initial$ = concat(
        initial$,
        stop$ == null ? this.stop$(name, options, abortSignal, true) : stop$,
      );
    }

    let delete$ = _of({
      type: 'error',
      code: DUPLICATE_OPERATION,
      message: `${this._resourceType.names.capital} ${this._getSimpleName(
        name,
      )} is being ${del.names.ed}.`,
    });
    const saveDelete = this._deletion$[name] == null;
    if (saveDelete) {
      delete$ = defer(() => this._delete$(name, options));
    }

    delete$ = concat(initial$, delete$).pipe(
      map(response => {
        if (response.type === 'progress') {
          abortSignal.check();
        }

        return response;
      }),
      catchError((error): Observable<ModifyResourceResponse> => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_DELETE_ERROR',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          error,
        });

        if (error.code === 'ABORT') {
          return _of({ type: 'aborted' });
        }

        return _of({
          type: 'error',
          code:
            error.code == null || typeof error.code !== 'string'
              ? SOMETHING_WENT_WRONG
              : error.code,
          message:
            `Something went wrong while ${del.names.ing} ` +
            `${this._resourceType.names.lower} ${this._getSimpleName(name)}: ${
              error.message
            }`,
        });
      }),
      map((response: ModifyResourceResponse) => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_DELETE_RESPONSE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          response: { ...response },
        });
        return response;
      }),
      onComplete(() => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_DELETE_COMPLETE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
        });
        delete this._deletion$[name];
        this._update$.next();
      }),
      shareReplay(),
    );
    if (saveDelete) {
      this._deletion$[name] = delete$;
    }

    return delete$;
  }

  _delete$(
    name: string,
    options: ResourceOptions,
  ): Observable<ModifyResourceResponse> {
    const { delete: del } = this._resourceType.getCRUD();
    let delete$ = _of({
      type: 'error',
      code: DOES_NOT_EXIST,
      message: `${this._resourceType.names.capital} ${this._getSimpleName(
        name,
      )} does not exist.`,
    });
    const resourceAdapter = this._resourceAdapters[name];
    if (resourceAdapter != null) {
      this._log({
        event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_DELETE',
        plugin: this._plugin.name,
        resourceType: this._resourceType.name,
        name,
      });

      const destroy$ = defer(async () => {
        await this._destroy(name, resourceAdapter);
        this._portAllocator.releasePort({
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          resource: name,
        });
        await this._resourcesReady.delete(name);
        return {
          type: 'progress',
          persist: true,
          message: 'Completed final cleanup',
        };
      });
      delete$ = concat(
        _of({
          type: 'progress',
          message: `${del.names.ingUpper} ${
            this._resourceType.names.lower
          } ${this._getSimpleName(name)}`,
        }),
        resourceAdapter.delete$(options),
        _of({
          type: 'progress',
          message:
            `Executing final cleanup of ${this._resourceType.names.lower} ` +
            `${this._getSimpleName(name)}`,
        }),
        destroy$,
        _of({
          type: 'progress',
          persist: true,
          message: `${del.names.edUpper} ${
            this._resourceType.names.lower
          } ${this._getSimpleName(name)}`,
        }),
        _of({ type: 'done' }),
      );
    }

    return delete$;
  }

  start$(
    name: string,
    options: ResourceOptions,
    abortSignal: AbortSignal,
  ): Observable<ModifyResourceResponse> {
    this._log({
      event: 'RESOURCES_MANAGER_START',
      plugin: this._plugin.name,
      resourceType: this._resourceType.name,
      name,
    });

    const { start, stop } = this._resourceType.getCRUD();
    if (start == null) {
      throw new ResourceNoStartError({
        plugin: this._plugin.name,
        resourceType: this._resourceType.names.lower,
      });
    }
    if (stop == null) {
      throw new ResourceNoStopError({
        plugin: this._plugin.name,
        resourceType: this._resourceType.names.lower,
      });
    }

    const stop$ = this._stops$[name];
    const stopAbortController = this._stopAbortControllers[name];
    let initial$ = ((empty(): $FlowFixMe): Observable<ModifyResourceResponse>);
    if (stop$ != null && stopAbortController != null) {
      initial$ = concat(
        _of({
          type: 'progress',
          message: `${this._resourceType.names.lower} ${this._getSimpleName(
            name,
          )} is ${stop.names.ing}, aborting`,
        }),
        defer(async () => {
          stopAbortController.abort();
          await stop$.toPromise();
          return {
            type: 'progress',
            persist: true,
            message: `Aborted ${stop.name}`,
          };
        }),
      );
    }

    let start$ = _of({
      type: 'error',
      code: DUPLICATE_OPERATION,
      message: `${this._resourceType.names.capital} ${this._getSimpleName(
        name,
      )} is ${start.names.ing}.`,
    });
    let startAbortSignal;
    const saveStart = this._starts$[name] == null;
    if (saveStart) {
      const abortController = new AbortController();
      this._startAbortControllers[name] = abortController;
      startAbortSignal = abortController.signal;

      start$ = defer(() => this._start$(name, options));
    }

    const started = this._resourceAdaptersStarted[name];

    const cleanup = () => {
      delete this._startAbortControllers[name];
      delete this._starts$[name];
    };

    start$ = concat(initial$, start$).pipe(
      map(response => {
        if (response.type === 'progress') {
          abortSignal.check();
          if (startAbortSignal != null) {
            startAbortSignal.check();
          }
        }

        return response;
      }),
      catchError((error): Observable<ModifyResourceResponse> => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_START_ERROR',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          error,
        });

        if (error.code === 'ABORT') {
          return _of({ type: 'aborted' });
        }

        return _of({
          type: 'error',
          code:
            error.code == null || typeof error.code !== 'string'
              ? SOMETHING_WENT_WRONG
              : error.code,
          message:
            `Something went wrong while ${start.names.ing} ` +
            `${this._resourceType.names.lower} ${this._getSimpleName(name)}: ${
              error.message
            }`,
        });
      }),
      map(response => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_START_RESPONSE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          response: { ...response },
        });

        if (response.type === 'aborted' || response.type === 'error') {
          cleanup();
          const controller = new AbortController();
          if (!started) {
            this.stop$(name, options, controller.signal)
              .toPromise()
              .catch(() => {});
          }
        } else if (response.type === 'done') {
          this._update$.next();
        }
        return response;
      }),
      onComplete(() => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_START_COMPLETE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
        });
        cleanup();
      }),
      shareReplay(),
    );
    if (saveStart) {
      this._starts$[name] = start$;
    }

    return start$;
  }

  _start$(
    name: string,
    options: ResourceOptions,
  ): Observable<ModifyResourceResponse> {
    const { create, start } = this._resourceType.getCRUD();
    if (start == null) {
      throw new ResourceNoStartError({
        plugin: this._plugin.name,
        resourceType: this._resourceType.names.lower,
      });
    }

    let start$ = _of({
      type: 'error',
      code: DOES_NOT_EXIST,
      message:
        `${this._resourceType.names.capital} ${this._getSimpleName(
          name,
        )} does not exist. ` +
        `Try ${create.names.ing} it first. From the command line: ` +
        `${create.name} ${this._resourceType.name} <name>`,
    });

    this._log({
      event: 'RESOURCES_MANAGER_START',
      plugin: this._plugin.name,
      resourceType: this._resourceType.name,
      name,
    });
    const resourceAdapter = this._resourceAdapters[name];
    if (resourceAdapter != null) {
      start$ = _of({
        type: 'error',
        code: DUPLICATE_OPERATION,
        message: `${this._resourceType.names.capital} ${this._getSimpleName(
          name,
        )} has already been ${start.names.ed}`,
      });
      const started = this._resourceAdaptersStarted[name];
      if (!started) {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_START',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
        });

        const set$ = defer(() => {
          this._resourceAdaptersStarted[name] = true;
          return _of({
            type: 'progress',
            persist: true,
            message: `${start.names.edUpper} ${
              this._resourceType.names.lower
            } ${this._getSimpleName(name)}`,
          });
        });
        start$ = concat(
          _of({
            type: 'progress',
            message: `${start.names.ingUpper} ${
              this._resourceType.names.lower
            } ${this._getSimpleName(name)}`,
          }),
          resourceAdapter.start$(options),
          set$,
          _of({ type: 'done' }),
        );
      }
    }

    return start$;
  }

  stop$(
    name: string,
    options: ResourceOptions,
    abortSignal: AbortSignal,
    noDone?: boolean,
  ): Observable<ModifyResourceResponse> {
    this._log({
      event: 'RESOURCES_MANAGER_STOP',
      plugin: this._plugin.name,
      resourceType: this._resourceType.name,
      name,
    });

    const { start, stop } = this._resourceType.getCRUD();
    if (start == null) {
      throw new ResourceNoStartError({
        plugin: this._plugin.name,
        resourceType: this._resourceType.names.lower,
      });
    }
    if (stop == null) {
      throw new ResourceNoStopError({
        plugin: this._plugin.name,
        resourceType: this._resourceType.names.lower,
      });
    }

    const start$ = this._starts$[name];
    const startAbortController = this._startAbortControllers[name];
    let initial$ = ((empty(): $FlowFixMe): Observable<ModifyResourceResponse>);
    if (start$ != null && startAbortController != null) {
      initial$ = concat(
        _of({
          type: 'progress',
          message: `${this._resourceType.names.lower} ${this._getSimpleName(
            name,
          )} is ${start.names.ing}, aborting`,
        }),
        defer(async () => {
          startAbortController.abort();
          await start$.toPromise();
          return {
            type: 'progress',
            persist: true,
            message: `Aborted ${start.name}`,
          };
        }),
      );
    }

    let stop$ = _of({
      type: 'error',
      code: DUPLICATE_OPERATION,
      message: `${this._resourceType.names.capital} ${this._getSimpleName(
        name,
      )} is being ${stop.names.ed}.`,
    });
    let stopAbortSignal;
    const saveStop = this._stops$[name] == null;
    if (saveStop) {
      const abortController = new AbortController();
      this._stopAbortControllers[name] = abortController;
      stopAbortSignal = abortController.signal;

      stop$ = defer(() => this._stop$(name, options, noDone));
    }

    stop$ = concat(initial$, stop$).pipe(
      map(response => {
        if (response.type === 'progress') {
          abortSignal.check();
          if (stopAbortSignal != null) {
            stopAbortSignal.check();
          }
        }

        return response;
      }),
      catchError((error): Observable<ModifyResourceResponse> => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_STOP_ERROR',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          error,
        });

        if (error.code === 'ABORT') {
          return _of({ type: 'aborted' });
        }

        return _of({
          type: 'error',
          code:
            error.code == null || typeof error.code !== 'string'
              ? SOMETHING_WENT_WRONG
              : error.code,
          message:
            `Something went wrong while ${stop.names.ing} ` +
            `${this._resourceType.names.lower} ${this._getSimpleName(name)}: ${
              error.message
            }`,
        });
      }),
      map(response => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_STOP_RESPONSE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
          response: { ...response },
        });

        return response;
      }),
      onComplete(() => {
        this._log({
          event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_STOP_COMPLETE',
          plugin: this._plugin.name,
          resourceType: this._resourceType.name,
          name,
        });
        delete this._stopAbortControllers[name];
        delete this._stops$[name];
        this._update$.next();
      }),
      shareReplay(),
    );
    if (saveStop) {
      this._stops$[name] = stop$;
    }

    return stop$;
  }

  _stop$(
    name: string,
    options: ResourceOptions,
    noDone?: boolean,
  ): Observable<ModifyResourceResponse> {
    const { stop } = this._resourceType.getCRUD();
    if (stop == null) {
      throw new ResourceNoStopError({
        plugin: this._plugin.name,
        resourceType: this._resourceType.names.lower,
      });
    }
    let stop$ = _of({
      type: 'error',
      code: DOES_NOT_EXIST,
      message: `${this._resourceType.names.capital} ${this._getSimpleName(
        name,
      )} does not exist.`,
    });
    const resourceAdapter = this._resourceAdapters[name];
    if (resourceAdapter != null) {
      this._log({
        event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_STOP',
        plugin: this._plugin.name,
        resourceType: this._resourceType.name,
        name,
      });

      const clear$ = defer(() => {
        this._resourceAdaptersStarted[name] = false;
        return _of({
          type: 'progress',
          persist: true,
          message: `${stop.names.edUpper} ${
            this._resourceType.names.lower
          } ${this._getSimpleName(name)}`,
        });
      });
      stop$ = concat(
        _of({
          type: 'progress',
          message: `${stop.names.ingUpper} ${
            this._resourceType.names.lower
          } ${this._getSimpleName(name)}`,
        }),
        resourceAdapter.stop$(options),
        clear$,
      );
      if (!noDone) {
        stop$ = concat(stop$, _of({ type: 'done' }));
      }
    }

    return stop$;
  }

  async _init(name: string): Promise<void> {
    await logInvoke(
      this._log,
      'RESOURCES_MANAGER_RESOURCE_ADAPTER_INIT',
      {
        plugin: this._plugin.name,
        resourceType: this._resourceType.name,
        name,
      },
      async () => {
        this._resourceAdapters[
          name
        ] = await this._masterResourceAdapter.initResourceAdapter({
          name,
          dataPath: path.resolve(this._resourcesPath, name),
        });
      },
    );
  }

  async _destroy(
    name: string,
    resourceAdapter: ResourceAdapter<Resource, ResourceOptions>,
  ): Promise<void> {
    await logInvoke(
      this._log,
      'RESOURCES_MANAGER_RESOURCE_ADAPTER_DESTROY',
      {
        plugin: this._plugin.name,
        resourceType: this._resourceType.name,
        name,
      },
      async () => {
        delete this._resourceAdapters[name];
        await resourceAdapter.destroy();
      },
    );
  }

  _getSimpleName(nameIn: string): string {
    const { name } = compoundName.extract(nameIn);
    return name;
  }

  getDebug(): DescribeTable {
    return utils
      .entries(this._resourceAdapters)
      .map(([name, adapter]) => [
        name,
        { type: 'describe', table: adapter.getDebug() },
      ]);
  }
}
