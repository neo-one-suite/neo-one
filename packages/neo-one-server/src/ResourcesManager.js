/* @flow */
// flowlint untyped-import:off
import { type Log, logInvoke, utils } from '@neo-one/utils';
import {
  type BaseResource,
  type CreateHook,
  type DescribeTable,
  type MasterResourceAdapter,
  type Plugin,
  type ResourceAdapter,
  type ResourceDependency,
  type ResourceType,
  TaskList,
  compoundName,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import type { Subject } from 'rxjs/Subject';

import { map, shareReplay, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';
import fs from 'fs-extra';
import { of as _of } from 'rxjs/observable/of';
import path from 'path';
import type PluginManager from './PluginManager';
import type PortAllocator from './PortAllocator';
import Ready from './Ready';
import { ResourceNoStartError, ResourceNoStopError } from './errors';

const RESOURCES_PATH = 'resources';
const RESOURCES_READY_PATH = 'ready';
const DEPENDENCIES_PATH = 'dependencies';

type ResourceAdapters<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> = { [resource: string]: ResourceAdapter<Resource, ResourceOptions> };

export type InitError = {|
  resourceType: string,
  resource: string,
  error: Error,
|};

type TaskLists = {
  [resource: string]: TaskList,
};

export default class ResourcesManager<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> {
  _log: Log;
  _dataPath: string;
  _pluginManager: PluginManager;
  resourceType: ResourceType<Resource, ResourceOptions>;
  masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>;
  _portAllocator: PortAllocator;
  _plugin: Plugin;
  _resourceAdapters: ResourceAdapters<Resource, ResourceOptions>;
  _resourceDependents: { [name: string]: Array<ResourceDependency> };
  _createHooks: Array<CreateHook>;

  _resourcesPath: string;
  _resourcesReady: Ready;
  _dependenciesPath: string;

  _createTaskList: TaskLists;
  _deleteTaskList: TaskLists;
  _startTaskList: TaskLists;
  _stopTaskList: TaskLists;

  _resourceAdaptersStarted: { [resource: string]: boolean };

  _update$: Subject<void>;
  resources$: Observable<Array<Resource>>;

  constructor({
    log,
    dataPath,
    pluginManager,
    resourceType,
    masterResourceAdapter,
    portAllocator,
  }: {|
    log: Log,
    dataPath: string,
    pluginManager: PluginManager,
    resourceType: ResourceType<Resource, ResourceOptions>,
    masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>,
    portAllocator: PortAllocator,
  |}) {
    this._log = log;
    this._dataPath = dataPath;
    this._pluginManager = pluginManager;
    this.resourceType = resourceType;
    this.masterResourceAdapter = masterResourceAdapter;
    this._portAllocator = portAllocator;
    this._plugin = this.resourceType.plugin;
    this._resourceAdapters = {};
    this._resourceDependents = {};
    this._createHooks = [];

    this._resourcesPath = path.resolve(dataPath, RESOURCES_PATH);
    this._resourcesReady = new Ready({
      dir: path.resolve(dataPath, RESOURCES_READY_PATH),
    });
    this._dependenciesPath = path.resolve(dataPath, DEPENDENCIES_PATH);

    this._createTaskList = {};
    this._deleteTaskList = {};
    this._startTaskList = {};
    this._stopTaskList = {};

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
        resourceType: this.resourceType.name,
      },
      async () => {
        await Promise.all([
          fs.ensureDir(this._resourcesPath),
          fs.ensureDir(this._resourcesReady.dir),
          fs.ensureDir(this._dependenciesPath),
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
              // eslint-disable-next-line
              const [_, dependencies] = await Promise.all([
                this._init(name),
                (async () => {
                  try {
                    const deps = await fs.readJSON(
                      this._getDependenciesPath(name),
                    );
                    return deps;
                  } catch (error) {
                    if (error.code === 'ENOENT') {
                      return [];
                    }

                    throw error;
                  }
                })(),
              ]);
              this._addDependents({ name, dependencies });
              return null;
            } catch (error) {
              return {
                resourceType: this.resourceType.name,
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
        resourceType: this.resourceType.name,
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
      resourceType: this.resourceType.name,
      options,
    });

    return this.resources$.pipe(
      map(resources => this.resourceType.filterResources(resources, options)),
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
      resourceType: this.resourceType.name,
      options,
    });

    return this.getResources$(options).pipe(
      map(resources => resources.find(resource => resource.name === name)),
    );
  }

  create(name: string, options: ResourceOptions): TaskList {
    this._log({
      event: 'RESOURCES_MANAGER_CREATE',
      plugin: this._plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
    });

    const { create, start } = this.resourceType.getCRUD();
    if (this._createTaskList[name] == null) {
      const resourceAdapter = this._resourceAdapters[name];
      const skip = () => resourceAdapter != null;

      let startTask = null;
      if (start != null) {
        startTask = {
          title: `${start.names.upper} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          skip,
          enabled: () => create.startOnCreate,
          task: () => this.start(name, options),
        };
      }
      this._createTaskList[name] = new TaskList({
        tasks: [
          {
            title: `${create.names.upper} ${
              this.resourceType.names.lower
            } ${this._getSimpleName(name)}`,
            skip: () =>
              resourceAdapter != null
                ? `${this.resourceType.names.capital} ${this._getSimpleName(
                    name,
                  )} already exists.`
                : false,
            task: () =>
              this.masterResourceAdapter.createResourceAdapter(
                {
                  name,
                  dataPath: path.resolve(this._resourcesPath, name),
                },
                options,
              ),
          },
          {
            title: 'Execute final setup',
            skip,
            task: async ctx => {
              this._resourceAdapters[name] = ctx.resourceAdapter;
              await Promise.all([
                this._resourcesReady.write(name),
                fs.writeJSON(this._getDependenciesPath(name), ctx.dependencies),
              ]);
              this._addDependents({ name, dependencies: ctx.dependencies });
              this._update$.next();
            },
          },
          startTask,
          {
            title: 'Execute plugin hooks',
            skip,
            enabled: () => this._createHooks.length > 0,
            task: () =>
              new TaskList({
                tasks: this._createHooks.map(hook =>
                  hook({
                    name,
                    options,
                    pluginManager: this._pluginManager,
                  }),
                ),
                concurrent: true,
              }),
          },
        ].filter(Boolean),
        onError: error => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_CREATE_ERROR',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
            error,
          });

          this.delete(name, options)
            .toPromise()
            .catch(() => {});
        },
        onComplete: () => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_CREATE_COMPLETE',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
          });
        },
        onDone: () => {
          delete this._createTaskList[name];
        },
      });
    }

    return this._createTaskList[name];
  }

  delete(name: string, options: ResourceOptions): TaskList {
    this._log({
      event: 'RESOURCES_MANAGER_DELETE',
      plugin: this._plugin.name,
      resourceType: this.resourceType.name,
      name,
    });

    if (this._deleteTaskList[name] == null) {
      const { create, start, stop, delete: del } = this.resourceType.getCRUD();
      const startTaskList = this._startTaskList[name];
      const startStopTasks = [];
      if (start != null) {
        startStopTasks.push({
          title: `Abort ${start.names.ing} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          enabled: () => startTaskList != null,
          task: () => startTaskList.abort(),
        });
      }
      if (stop != null) {
        startStopTasks.push({
          title: `${stop.names.upper} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          enabled: () => this._resourceAdaptersStarted[name],
          task: () => this.stop(name, options),
        });
      }
      const createTaskList = this._createTaskList[name];
      const resourceAdapter = this._resourceAdapters[name];
      const skip = () => resourceAdapter == null;
      const dependents = this._resourceDependents[name];
      this._deleteTaskList[name] = new TaskList({
        tasks: [
          {
            title: `Abort ${create.names.ing} ${
              this.resourceType.names.lower
            } ${this._getSimpleName(name)}`,
            enabled: () => createTaskList != null,
            task: () => createTaskList.abort(),
          },
        ]
          .concat(startStopTasks)
          .concat([
            {
              title: 'Delete dependent resources',
              enabled: () => dependents != null && dependents.length > 0,
              skip,
              task: () =>
                new TaskList({
                  tasks: dependents.map(
                    ({ plugin, resourceType, name: dependentName }) => {
                      const manager = this._pluginManager.getResourcesManager({
                        plugin,
                        resourceType,
                      });
                      const dependentResourceType = manager.resourceType;

                      return {
                        title: `${
                          dependentResourceType.getCRUD().delete.names.upper
                        } ${
                          dependentResourceType.names.lower
                        } ${this._getSimpleName(dependentName)}`,
                        task: () => manager.delete(dependentName, {}),
                      };
                    },
                  ),
                  concurrent: true,
                }),
            },
            {
              title: `${del.names.upper} ${
                this.resourceType.names.lower
              } ${this._getSimpleName(name)}`,
              skip: () =>
                resourceAdapter == null
                  ? `${this.resourceType.names.capital} ${this._getSimpleName(
                      name,
                    )} does not exist.`
                  : false,
              task: () => resourceAdapter.delete(options),
            },
            {
              title: 'Execute final cleanup',
              skip,
              task: async () => {
                await this._destroy(name, resourceAdapter);
                this._portAllocator.releasePort({
                  plugin: this._plugin.name,
                  resourceType: this.resourceType.name,
                  resource: name,
                });
                await Promise.all([
                  this._resourcesReady.delete(name),
                  fs.remove(this._getDependenciesPath(name)),
                ]);
                delete this._resourceDependents[name];
              },
            },
          ]),
        onError: error => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_DELETE_ERROR',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
            error,
          });
        },
        onComplete: () => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_DELETE_COMPLETE',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
          });
        },
        onDone: () => {
          delete this._deleteTaskList[name];
          this._update$.next();
        },
      });
    }

    return this._deleteTaskList[name];
  }

  start(name: string, options: ResourceOptions): TaskList {
    this._log({
      event: 'RESOURCES_MANAGER_START',
      plugin: this._plugin.name,
      resourceType: this.resourceType.name,
      name,
    });

    const { create, start, stop } = this.resourceType.getCRUD();
    if (start == null) {
      throw new ResourceNoStartError({
        plugin: this._plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }
    if (stop == null) {
      throw new ResourceNoStopError({
        plugin: this._plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }

    if (this._startTaskList[name] == null) {
      const stopTaskList = this._stopTaskList[name];
      const resourceAdapter = this._resourceAdapters[name];
      const started = this._resourceAdaptersStarted[name];
      this._startTaskList[name] = new TaskList({
        tasks: [
          {
            title: `Abort ${stop.names.ing} ${
              this.resourceType.names.lower
            } ${this._getSimpleName(name)}`,
            enabled: () => stopTaskList != null,
            task: () => stopTaskList.abort(),
          },
          {
            title: `${start.names.upper} ${
              this.resourceType.names.lower
            } ${this._getSimpleName(name)}`,
            skip: () => {
              if (resourceAdapter == null) {
                return (
                  `${this.resourceType.names.capital} ${this._getSimpleName(
                    name,
                  )} does not exist. ` +
                  `Try ${create.names.ing} it first. From the command line: ` +
                  `${create.name} ${this.resourceType.name} <name>`
                );
              }

              if (started) {
                return `${
                  this.resourceType.names.capital
                } ${this._getSimpleName(name)} has already been ${
                  start.names.ed
                }`;
              }

              return false;
            },
            task: () => resourceAdapter.start(options),
          },
        ],
        onError: error => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_START_ERROR',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
            error,
          });
          this.stop(name, options)
            .toPromise()
            .catch(() => {});
        },
        onComplete: () => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_START_COMPLETE',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
          });
          this._resourceAdaptersStarted[name] = true;
        },
        onDone: () => {
          delete this._startTaskList[name];
          this._update$.next();
        },
      });
    }

    return this._startTaskList[name];
  }

  stop(name: string, options: ResourceOptions): TaskList {
    this._log({
      event: 'RESOURCES_MANAGER_STOP',
      plugin: this._plugin.name,
      resourceType: this.resourceType.name,
      name,
    });

    const { start, stop } = this.resourceType.getCRUD();
    if (start == null) {
      throw new ResourceNoStartError({
        plugin: this._plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }
    if (stop == null) {
      throw new ResourceNoStopError({
        plugin: this._plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }

    if (this._stopTaskList[name] == null) {
      const startTaskList = this._startTaskList[name];
      const resourceAdapter = this._resourceAdapters[name];
      const skip = () => resourceAdapter == null;
      const dependents = (this._resourceDependents[name] || []).filter(
        ({ plugin, resourceType }) =>
          this._pluginManager
            .getResourcesManager({
              plugin,
              resourceType,
            })
            .resourceType.getCRUD().stop != null,
      );
      this._stopTaskList[name] = new TaskList({
        tasks: [
          {
            title: `Abort ${start.names.ing} ${
              this.resourceType.names.lower
            } ${this._getSimpleName(name)}`,
            enabled: () => startTaskList != null,
            task: () => startTaskList.abort(),
          },
          {
            title: 'Stop dependent resources',
            enabled: () => dependents.length > 0,
            skip: () =>
              resourceAdapter == null
                ? `${this.resourceType.names.capital} ${this._getSimpleName(
                    name,
                  )} does not exist.`
                : false,
            task: () =>
              new TaskList({
                tasks: dependents.map(
                  ({ plugin, resourceType, name: dependentName }) => {
                    const manager = this._pluginManager.getResourcesManager({
                      plugin,
                      resourceType,
                    });
                    const dependentResourceType = manager.resourceType;

                    const { stop: depStop } = dependentResourceType.getCRUD();
                    if (depStop == null) {
                      throw new Error('For Flow');
                    }

                    return {
                      title: `${depStop.names.upper} ${
                        dependentResourceType.names.lower
                      } ${this._getSimpleName(dependentName)}`,
                      task: () => manager.stop(dependentName, {}),
                    };
                  },
                ),
                concurrent: true,
              }),
          },
          {
            title: `${stop.names.upper} ${
              this.resourceType.names.lower
            } ${this._getSimpleName(name)}`,
            skip,
            task: () => resourceAdapter.stop(options),
          },
        ],
        onError: error => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_STOP_ERROR',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
            error,
          });
        },
        onComplete: () => {
          this._log({
            event: 'RESOURCES_MANAGER_RESOURCE_ADAPTER_STOP_COMPLETE',
            plugin: this._plugin.name,
            resourceType: this.resourceType.name,
            name,
          });
          this._resourceAdaptersStarted[name] = false;
        },
        onDone: () => {
          delete this._stopTaskList[name];
          this._update$.next();
        },
      });
    }

    return this._stopTaskList[name];
  }

  async _init(name: string): Promise<void> {
    await logInvoke(
      this._log,
      'RESOURCES_MANAGER_RESOURCE_ADAPTER_INIT',
      {
        plugin: this._plugin.name,
        resourceType: this.resourceType.name,
        name,
      },
      async () => {
        this._resourceAdapters[
          name
        ] = await this.masterResourceAdapter.initResourceAdapter({
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
        resourceType: this.resourceType.name,
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

  _getDependenciesPath(name: string): string {
    return path.resolve(this._dependenciesPath, `${name}.json`);
  }

  _addDependents({
    name: nameIn,
    dependencies,
  }: {|
    name: string,
    dependencies: Array<ResourceDependency>,
  |}): void {
    dependencies.forEach(({ plugin, resourceType, name }) => {
      this._pluginManager
        .getResourcesManager({
          plugin,
          resourceType,
        })
        .addDependent(name, {
          plugin: this._plugin.name,
          resourceType: this.resourceType.name,
          name: nameIn,
        });
    });
  }

  addDependent(name: string, dependent: ResourceDependency): void {
    if (this._resourceDependents[name] == null) {
      this._resourceDependents[name] = [];
    }
    this._resourceDependents[name].push(dependent);
  }

  addCreateHook(hook: CreateHook): void {
    this._createHooks.push(hook);
  }

  getResourceAdapter(name: string): ResourceAdapter<Resource, ResourceOptions> {
    const adapter = this._resourceAdapters[name];
    if (adapter == null) {
      throw new Error(
        `${this.resourceType.names.capital} ${name} does not exist`,
      );
    }
    return adapter;
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
