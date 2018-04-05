/* @flow */
import {
  type BaseResource,
  type BaseResourceOptions,
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
import type { Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import _ from 'lodash';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';
import fs from 'fs-extra';
import { labels, utils } from '@neo-one/utils';
import { of as _of } from 'rxjs/observable/of';
import path from 'path';
import type PluginManager from './PluginManager';
import type PortAllocator from './PortAllocator';
import Ready from './Ready';
import { ResourceNoStartError, ResourceNoStopError } from './errors';

const RESOURCES_PATH = 'resources';
const RESOURCES_READY_PATH = 'ready';
const DIRECT_DEPENDENTS_PATH = 'dependents';
const DEPENDENCIES_PATH = 'dependencies';

type ResourceAdapters<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
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
  ResourceOptions: BaseResourceOptions,
> {
  _monitor: Monitor;
  _dataPath: string;
  _pluginManager: PluginManager;
  resourceType: ResourceType<Resource, ResourceOptions>;
  masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>;
  _portAllocator: PortAllocator;
  _plugin: Plugin;
  _resourceAdapters$: BehaviorSubject<
    ResourceAdapters<Resource, ResourceOptions>,
  >;
  _directResourceDependents: { [name: string]: Array<ResourceDependency> };
  _resourceDependents: { [name: string]: Array<ResourceDependency> };
  _createHooks: Array<CreateHook>;

  _resourcesPath: string;
  _resourcesReady: Ready;
  _directDependentsPath: string;
  _dependenciesPath: string;

  _createTaskList: TaskLists;
  _deleteTaskList: TaskLists;
  _startTaskList: TaskLists;
  _stopTaskList: TaskLists;

  _resourceAdaptersStarted: { [resource: string]: boolean };

  resources$: Observable<Array<Resource>>;

  constructor({
    monitor,
    dataPath,
    pluginManager,
    resourceType,
    masterResourceAdapter,
    portAllocator,
  }: {|
    monitor: Monitor,
    dataPath: string,
    pluginManager: PluginManager,
    resourceType: ResourceType<Resource, ResourceOptions>,
    masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>,
    portAllocator: PortAllocator,
  |}) {
    this._monitor = monitor.at('resources_manager').withLabels({
      [labels.PLUGIN_NAME]: resourceType.plugin.name,
      [labels.RESOURCETYPE_NAME]: resourceType.name,
    });
    this._dataPath = dataPath;
    this._pluginManager = pluginManager;
    this.resourceType = resourceType;
    this.masterResourceAdapter = masterResourceAdapter;
    this._portAllocator = portAllocator;
    this._plugin = this.resourceType.plugin;
    this._resourceAdapters$ = new BehaviorSubject({});
    this._directResourceDependents = {};
    this._resourceDependents = {};
    this._createHooks = [];

    this._resourcesPath = path.resolve(dataPath, RESOURCES_PATH);
    this._resourcesReady = new Ready({
      dir: path.resolve(dataPath, RESOURCES_READY_PATH),
    });
    this._directDependentsPath = path.resolve(dataPath, DIRECT_DEPENDENTS_PATH);
    this._dependenciesPath = path.resolve(dataPath, DEPENDENCIES_PATH);

    this._createTaskList = {};
    this._deleteTaskList = {};
    this._startTaskList = {};
    this._stopTaskList = {};

    this._resourceAdaptersStarted = {};

    this.resources$ = this._resourceAdapters$.pipe(
      switchMap(resourceAdapters => {
        const adapters = utils.values(resourceAdapters);
        if (adapters.length === 0) {
          return _of([]);
        }

        return combineLatest(adapters.map(adapter => adapter.resource$));
      }),
      shareReplay(1),
    );
  }

  get _resourceAdapters(): ResourceAdapters<Resource, ResourceOptions> {
    return this._resourceAdapters$.value;
  }

  async init(): Promise<Array<InitError>> {
    return this._monitor.captureLog(
      async () => {
        await Promise.all([
          fs.ensureDir(this._resourcesPath),
          fs.ensureDir(this._resourcesReady.dir),
          fs.ensureDir(this._directDependentsPath),
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

        this._resourceAdapters$.next({});
        const results = await Promise.all(
          resources.map(async (name: string): Promise<?InitError> => {
            try {
              const [dependencies, dependents] = await Promise.all([
                this._readDeps(this._getDependenciesPath(name)),
                this._readDeps(this._getDirectDependentsPath(name)),
                this._init(name),
              ]);
              this._directResourceDependents[name] = dependents;
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
        return results.filter(Boolean);
      },
      {
        name: 'neo_resource_manager_inititalize',
        message: 'Initializing resource manager.',
        error: 'Failed to initialize resource manager.',
      },
    );
  }

  async reset(): Promise<void> {
    await this.destroy();
  }

  async _readDeps(depsPath: string): Promise<Array<ResourceDependency>> {
    try {
      const deps = await fs.readJSON(depsPath);
      return deps;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async destroy(): Promise<void> {
    this._monitor.captureLog(
      async () => {
        await Promise.all(
          utils
            .entries(this._resourceAdapters)
            .map(async ([name, resourceAdapter]) => {
              await this.stop(name, ({}: $FlowFixMe))
                .toPromise()
                .catch(() => {});
              await this._destroy(name, resourceAdapter).catch(() => {});
            }),
        );
      },
      {
        name: 'neo_resource_manager_destroy',
        message: `Destroyed resource manager for ${this._plugin.name} ${
          this.resourceType.name
        }`,
      },
    );
  }

  getResources$(options: ResourceOptions): Observable<Array<Resource>> {
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
    return this.getResources$(options).pipe(
      map(resources => resources.find(resource => resource.name === name)),
    );
  }

  create(name: string, options: ResourceOptions): TaskList {
    const { create, start } = this.resourceType.getCRUD();
    const shouldSkip = this._createTaskList[name] != null;
    const resourceAdapter = this._resourceAdapters[name];
    const skip = () => shouldSkip || resourceAdapter != null;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this._getSimpleName(
          name,
        )} is already being ${create.names.ed}.`;
      }

      if (resourceAdapter != null) {
        return `${this.resourceType.names.capital} ${this._getSimpleName(
          name,
        )} already exists.`;
      }

      return false;
    };

    let startTask = null;
    if (create.startOnCreate && start != null) {
      startTask = {
        title: `${start.names.upper} ${
          this.resourceType.names.lower
        } ${this._getSimpleName(name)}`,
        skip,
        enabled: () => create.startOnCreate,
        task: () => this.start(name, options),
      };
    }

    let set = false;
    const setFromContext = ctx => {
      if (!set) {
        set = true;
        if (ctx.resourceAdapter != null) {
          this._resourceAdapters$.next({
            ...this._resourceAdapters,
            [name]: ctx.resourceAdapter,
          });
          const dependencies = ctx.dependencies || [];
          const dependents = ctx.dependents || [];
          this._directResourceDependents[name] = dependents;
          this._addDependents({ name, dependencies });
        }
      }
    };

    const createTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `${create.names.upper} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          skip: mainSkip,
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
            setFromContext(ctx);
            await this.getResource$({ name, options: ({}: $FlowFixMe) })
              .pipe(filter(value => value != null), take(1))
              .toPromise();
            const dependencies = ctx.dependencies || [];
            const dependents = ctx.dependents || [];
            await Promise.all([
              this._resourcesReady.write(name),
              fs.writeJSON(this._getDependenciesPath(name), dependencies),
              fs.writeJSON(this._getDirectDependentsPath(name), dependents),
            ]);
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
              collapse: false,
            }),
        },
      ].filter(Boolean),
      onError: (error, ctx) => {
        if (!shouldSkip) {
          setFromContext(ctx);
        }
      },
      onDone: (failed: boolean) => {
        if (!shouldSkip) {
          delete this._createTaskList[name];
          if (failed) {
            this.delete(name, options)
              .toPromise()
              .catch(() => {});
          }
        }
      },
    });
    if (!shouldSkip) {
      this._createTaskList[name] = createTaskList;
    }

    return createTaskList;
  }

  delete(name: string, options: ResourceOptions): TaskList {
    const shouldSkip = this._deleteTaskList[name] != null;
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
    const skip = () => shouldSkip || resourceAdapter == null;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this._getSimpleName(
          name,
        )} is already being ${del.names.ed}.`;
      }

      if (resourceAdapter == null) {
        return `${this.resourceType.names.capital} ${this._getSimpleName(
          name,
        )} does not exist.`;
      }

      return false;
    };
    const dependents = this._uniqueDeps(
      (this._resourceDependents[name] || []).concat(
        this._directResourceDependents[name] || [],
      ),
    );
    const deleteTaskList = new TaskList({
      freshContext: true,
      collapse: false,
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
            enabled: () => dependents.length > 0,
            skip,
            task: () => this._deleteDeps(dependents),
          },
          {
            title: `${del.names.upper} ${
              this.resourceType.names.lower
            } ${this._getSimpleName(name)}`,
            skip,
            task: () => resourceAdapter.delete(options),
          },
          {
            title: 'Execute final cleanup',
            skip: mainSkip,
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
                fs.remove(this._getDirectDependentsPath(name)),
              ]);
              delete this._resourceDependents[name];
              delete this._directResourceDependents[name];
            },
          },
        ]),
      onDone: () => {
        if (!shouldSkip) {
          delete this._deleteTaskList[name];
        }
      },
    });
    if (!shouldSkip) {
      this._deleteTaskList[name] = deleteTaskList;
    }

    return deleteTaskList;
  }

  _deleteDeps(deps: Array<ResourceDependency>): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
        const manager = this._pluginManager.getResourcesManager({
          plugin,
          resourceType,
        });
        const dependentResourceType = manager.resourceType;

        return {
          title: `${dependentResourceType.getCRUD().delete.names.upper} ${
            dependentResourceType.names.lower
          } ${this._getSimpleName(dependentName)}`,
          task: () => manager.delete(dependentName, {}),
        };
      }),
      concurrent: true,
    });
  }

  start(name: string, options: ResourceOptions): TaskList {
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

    const shouldSkip = this._startTaskList[name] != null;
    const stopTaskList = this._stopTaskList[name];
    const resourceAdapter = this._resourceAdapters[name];
    const started = this._resourceAdaptersStarted[name];
    const directDependents = this._getStartDeps(
      this._directResourceDependents[name],
    );
    const startTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `Abort ${stop.names.ing} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          skip: () => shouldSkip,
          enabled: () => stopTaskList != null,
          task: () => stopTaskList.abort(),
        },
        {
          title: 'Start created resources',
          enabled: () => directDependents.length > 0,
          skip: () => shouldSkip || resourceAdapter == null || started,
          task: () => this._startDeps(directDependents),
        },
        {
          title: `${start.names.upper} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          skip: () => {
            if (shouldSkip) {
              return `${this.resourceType.names.capital} ${this._getSimpleName(
                name,
              )} is already being ${start.names.ed}.`;
            }

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
              return `${this.resourceType.names.capital} ${this._getSimpleName(
                name,
              )} has already been ${start.names.ed}`;
            }

            return false;
          },
          task: () => resourceAdapter.start(options),
        },
      ],
      onDone: failed => {
        if (!shouldSkip) {
          this._resourceAdaptersStarted[name] = true;
          delete this._startTaskList[name];
          if (failed) {
            this.stop(name, options)
              .toPromise()
              .catch(() => {});
          }
        }
      },
    });
    if (!shouldSkip) {
      this._startTaskList[name] = startTaskList;
    }

    return startTaskList;
  }

  _getStartDeps(deps: ?Array<ResourceDependency>): Array<ResourceDependency> {
    return (deps || []).filter(
      ({ plugin, resourceType }) =>
        this._pluginManager
          .getResourcesManager({
            plugin,
            resourceType,
          })
          .resourceType.getCRUD().start != null,
    );
  }

  _startDeps(deps: Array<ResourceDependency>): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
        const manager = this._pluginManager.getResourcesManager({
          plugin,
          resourceType,
        });
        const dependentResourceType = manager.resourceType;

        const { start: depStart } = dependentResourceType.getCRUD();
        if (depStart == null) {
          throw new Error('For Flow');
        }

        return {
          title: `${depStart.names.upper} ${
            dependentResourceType.names.lower
          } ${this._getSimpleName(dependentName)}`,
          task: () => manager.start(dependentName, {}),
        };
      }),
      concurrent: false,
    });
  }

  stop(name: string, options: ResourceOptions): TaskList {
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

    const shouldSkip = this._stopTaskList[name] != null;
    const startTaskList = this._startTaskList[name];
    const resourceAdapter = this._resourceAdapters[name];
    const skip = () => shouldSkip || resourceAdapter == null;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this._getSimpleName(
          name,
        )} is already being ${stop.names.ed}.`;
      }

      if (resourceAdapter == null) {
        return `${this.resourceType.names.capital} ${this._getSimpleName(
          name,
        )} does not exist.`;
      }

      return false;
    };
    const dependents = this._getStopDeps(this._resourceDependents[name]);
    const directDependents = this._getStopDeps(
      this._directResourceDependents[name],
    );
    const stopTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `Abort ${start.names.ing} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          skip,
          enabled: () => startTaskList != null,
          task: () => startTaskList.abort(),
        },
        {
          title: 'Stop dependent resources',
          enabled: () => dependents.length > 0,
          skip: mainSkip,
          task: () => this._stopDeps(dependents),
        },
        {
          title: `${stop.names.upper} ${
            this.resourceType.names.lower
          } ${this._getSimpleName(name)}`,
          skip,
          task: () => resourceAdapter.stop(options),
        },
        {
          title: 'Stop created resources',
          enabled: () => directDependents.length > 0,
          skip,
          task: () => this._stopDeps(directDependents),
        },
      ],
      onComplete: () => {
        this._resourceAdaptersStarted[name] = false;
      },
      onDone: () => {
        if (!shouldSkip) {
          delete this._stopTaskList[name];
        }
      },
    });
    if (!shouldSkip) {
      this._stopTaskList[name] = stopTaskList;
    }

    return stopTaskList;
  }

  _getStopDeps(deps: ?Array<ResourceDependency>): Array<ResourceDependency> {
    return (deps || []).filter(
      ({ plugin, resourceType }) =>
        this._pluginManager
          .getResourcesManager({
            plugin,
            resourceType,
          })
          .resourceType.getCRUD().stop != null,
    );
  }

  _stopDeps(deps: Array<ResourceDependency>): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
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
      }),
      concurrent: true,
    });
  }

  async _init(name: string): Promise<void> {
    const resourceAdapter = await this.masterResourceAdapter.initResourceAdapter(
      {
        name,
        dataPath: path.resolve(this._resourcesPath, name),
      },
    );
    this._resourceAdapters$.next({
      ...this._resourceAdapters,
      [name]: resourceAdapter,
    });
  }

  async _destroy(
    name: string,
    resourceAdapter: ResourceAdapter<Resource, ResourceOptions>,
  ): Promise<void> {
    const resourceAdapters = { ...this._resourceAdapters };
    delete resourceAdapters[name];
    this._resourceAdapters$.next(resourceAdapters);
    await resourceAdapter.destroy();
  }

  _getSimpleName(nameIn: string): string {
    const { name } = compoundName.extract(nameIn);
    return name;
  }

  _getDirectDependentsPath(name: string): string {
    return path.resolve(this._directDependentsPath, `${name}.json`);
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

  _uniqueDeps(deps: Array<ResourceDependency>): Array<ResourceDependency> {
    return _.uniqBy(
      deps,
      ({ plugin, resourceType, name }) => `${plugin}:${resourceType}:${name}`,
    );
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
