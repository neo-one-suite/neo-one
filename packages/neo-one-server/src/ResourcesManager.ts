import {
  BaseResource,
  BaseResourceOptions,
  CreateHook,
  DescribeTable,
  MasterResourceAdapter,
  Plugin,
  ResourceAdapter,
  ResourceDependency,
  ResourceType,
  TaskList,
  compoundName,
} from '@neo-one/server-plugin';
import { Monitor } from '@neo-one/monitor';
import { Observable, BehaviorSubject, combineLatest, of as _of } from 'rxjs';
import _ from 'lodash';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import fs from 'fs-extra';
import { labels, utils } from '@neo-one/utils';
import path from 'path';
import { PluginManager } from './PluginManager';
import { PortAllocator } from './PortAllocator';
import { Ready } from './Ready';
import { ResourceNoStartError, ResourceNoStopError } from './errors';

const RESOURCES_PATH = 'resources';
const RESOURCES_READY_PATH = 'ready';
const DIRECT_DEPENDENTS_PATH = 'dependents';
const DEPENDENCIES_PATH = 'dependencies';

interface ResourceAdapters<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  [resource: string]: ResourceAdapter<Resource, ResourceOptions>;
}

export interface InitError {
  resourceType: string;
  resource: string;
  error: Error;
}

interface TaskLists {
  [resource: string]: TaskList;
}

export class ResourcesManager<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  private readonly monitor: Monitor;
  private readonly dataPath: string;
  private readonly pluginManager: PluginManager;
  public readonly resourceType: ResourceType<Resource, ResourceOptions>;
  public readonly masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>;
  private readonly portAllocator: PortAllocator;
  private readonly plugin: Plugin;
  private readonly resourceAdapters$: BehaviorSubject<ResourceAdapters<Resource, ResourceOptions>>;
  private readonly directResourceDependents: { [name: string]: ResourceDependency[] };
  private readonly resourceDependents: { [name: string]: ResourceDependency[] };
  private readonly createHooks: CreateHook[];
  private readonly resourcesPath: string;
  private readonly resourcesReady: Ready;
  private readonly directDependentsPath: string;
  private readonly dependenciesPath: string;
  private readonly createTaskList: TaskLists;
  private readonly deleteTaskList: TaskLists;
  private readonly startTaskList: TaskLists;
  private readonly stopTaskList: TaskLists;
  private readonly resourceAdaptersStarted: { [resource: string]: boolean };
  public readonly resources$: Observable<Resource[]>;

  constructor({
    monitor,
    dataPath,
    pluginManager,
    resourceType,
    masterResourceAdapter,
    portAllocator,
  }: {
    monitor: Monitor;
    dataPath: string;
    pluginManager: PluginManager;
    resourceType: ResourceType<Resource, ResourceOptions>;
    masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>;
    portAllocator: PortAllocator;
  }) {
    this.monitor = monitor.at('resources_manager').withLabels({
      [labels.PLUGIN_NAME]: resourceType.plugin.name,
      [labels.RESOURCETYPE_NAME]: resourceType.name,
    });

    this.dataPath = dataPath;
    this.pluginManager = pluginManager;
    this.resourceType = resourceType;
    this.masterResourceAdapter = masterResourceAdapter;
    this.portAllocator = portAllocator;
    this.plugin = this.resourceType.plugin;
    this.resourceAdapters$ = new BehaviorSubject({});
    this.directResourceDependents = {};
    this.resourceDependents = {};
    this.createHooks = [];

    this.resourcesPath = path.resolve(dataPath, RESOURCES_PATH);
    this.resourcesReady = new Ready({
      dir: path.resolve(dataPath, RESOURCES_READY_PATH),
    });

    this.directDependentsPath = path.resolve(dataPath, DIRECT_DEPENDENTS_PATH);
    this.dependenciesPath = path.resolve(dataPath, DEPENDENCIES_PATH);

    this.createTaskList = {};
    this.deleteTaskList = {};
    this.startTaskList = {};
    this.stopTaskList = {};

    this.resourceAdaptersStarted = {};

    this.resources$ = this.resourceAdapters$.pipe(
      switchMap((resourceAdapters) => {
        const adapters = utils.values(resourceAdapters);
        if (adapters.length === 0) {
          return _of([]);
        }

        return combineLatest(adapters.map((adapter) => adapter.resource$));
      }),
      shareReplay(1),
    );
  }

  private get resourceAdapters(): ResourceAdapters<Resource, ResourceOptions> {
    return this.resourceAdapters$.value;
  }

  public async init(): Promise<InitError[]> {
    return this.monitor.captureLog(
      async () => {
        await Promise.all([
          fs.ensureDir(this.resourcesPath),
          fs.ensureDir(this.resourcesReady.dir),
          fs.ensureDir(this.directDependentsPath),
          fs.ensureDir(this.dependenciesPath),
        ]);

        const resources = await this.resourcesReady.getAll();

        const foundResourceAdapters = new Set();
        resources.forEach((name: string) => {
          if (foundResourceAdapters.has(name)) {
            throw new Error(`Something went wrong, found duplicate resource name: ${this.getSimpleName(name)}`);
          }
          foundResourceAdapters.add(name);
        });

        this.resourceAdapters$.next({});
        const results = await Promise.all(
          resources.map(
            async (name: string): Promise<InitError | null> => {
              try {
                const [dependencies, dependents] = await Promise.all([
                  this.readDeps(this.getDependenciesPath(name)),
                  this.readDeps(this.getDirectDependentsPath(name)),
                  this.init(name),
                ]);

                this.directResourceDependents[name] = dependents;
                this.addDependents({ name, dependencies });
                return null;
              } catch (error) {
                return {
                  resourceType: this.resourceType.name,
                  resource: name,
                  error,
                };
              }
            },
          ),
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

  public async reset(): Promise<void> {
    await this.destroy();
  }

  private async readDeps(depsPath: string): Promise<ResourceDependency[]> {
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

  public async destroy(): Promise<void> {
    this.monitor.captureLog(
      async () => {
        await Promise.all(
          utils.entries(this.resourceAdapters).map(async ([name, resourceAdapter]) => {
            await this.stop(name, {} as any)
              .toPromise()
              .catch(() => {});
            await this.destroy(name, resourceAdapter).catch(() => {});
          }),
        );
      },
      {
        name: 'neo_resource_manager_destroy',
        message: `Destroyed resource manager for ${this.plugin.name} ${this.resourceType.name}`,
      },
    );
  }

  public getResources$(options: ResourceOptions): Observable<Resource[]> {
    return this.resources$.pipe(map((resources) => this.resourceType.filterResources(resources, options)));
  }

  public getResource$({ name, options }: { name: string; options: ResourceOptions }): Observable<Resource | null> {
    return this.getResources$(options).pipe(map((resources) => resources.find((resource) => resource.name === name)));
  }

  public create(name: string, options: ResourceOptions): TaskList {
    const { create, start } = this.resourceType.getCRUD();
    const shouldSkip = this.createTaskList[name] != null;
    const resourceAdapter = this.resourceAdapters[name];
    const skip = () => shouldSkip || resourceAdapter != null;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} is already being ${create.names.ed}.`;
      }

      if (resourceAdapter != null) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} already exists.`;
      }

      return false;
    };

    let startTask = null;
    if (create.startOnCreate && start != null) {
      startTask = {
        title: `${start.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
        skip,
        enabled: () => create.startOnCreate,
        task: () => this.start(name, options),
      };
    }

    let set = false;
    const setFromContext = (ctx) => {
      if (!set) {
        set = true;
        if (ctx.resourceAdapter != null) {
          this.resourceAdapters$.next({
            ...this.resourceAdapters,
            [name]: ctx.resourceAdapter,
          });

          const dependencies = ctx.dependencies || [];
          const dependents = ctx.dependents || [];
          this.directResourceDependents[name] = dependents;
          this.addDependents({ name, dependencies });
        }
      }
    };

    const createTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `${create.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
          skip: mainSkip,
          task: () =>
            this.masterResourceAdapter.createResourceAdapter(
              {
                name,
                dataPath: path.resolve(this.resourcesPath, name),
              },

              options,
            ),
        },

        {
          title: 'Execute final setup',
          skip,
          task: async (ctx) => {
            setFromContext(ctx);
            await this.getResource$({ name, options: {} as any })
              .pipe(
                filter((value) => value != null),
                take(1),
              )
              .toPromise();
            const dependencies = ctx.dependencies || [];
            const dependents = ctx.dependents || [];
            await Promise.all([
              this.resourcesReady.write(name),
              fs.writeJSON(this.getDependenciesPath(name), dependencies),
              fs.writeJSON(this.getDirectDependentsPath(name), dependents),
            ]);
          },
        },

        startTask,
        {
          title: 'Execute plugin hooks',
          skip,
          enabled: () => this.createHooks.length > 0,
          task: () =>
            new TaskList({
              tasks: this.createHooks.map((hook) =>
                hook({
                  name,
                  options,
                  pluginManager: this.pluginManager,
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
          delete this.createTaskList[name];
          if (failed) {
            this.delete(name, options)
              .toPromise()
              .catch(() => {});
          }
        }
      },
    });

    if (!shouldSkip) {
      this.createTaskList[name] = createTaskList;
    }

    return createTaskList;
  }

  public delete(name: string, options: ResourceOptions): TaskList {
    const shouldSkip = this.deleteTaskList[name] != null;
    const { create, start, stop, delete: del } = this.resourceType.getCRUD();
    const startTaskList = this.startTaskList[name];
    const startStopTasks = [];
    if (start != null) {
      startStopTasks.push({
        title: `Abort ${start.names.ing} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
        enabled: () => startTaskList != null,
        task: () => startTaskList.abort(),
      });
    }
    if (stop != null) {
      startStopTasks.push({
        title: `${stop.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
        enabled: () => this.resourceAdaptersStarted[name],
        task: () => this.stop(name, options),
      });
    }
    const createTaskList = this.createTaskList[name];
    const resourceAdapter = this.resourceAdapters[name];
    const skip = () => shouldSkip || resourceAdapter == null;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} is already being ${del.names.ed}.`;
      }

      if (resourceAdapter == null) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} does not exist.`;
      }

      return false;
    };
    const dependents = this.uniqueDeps(
      (this.resourceDependents[name] || []).concat(this.directResourceDependents[name] || []),
    );

    const deleteTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `Abort ${create.names.ing} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
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
            task: () => this.deleteDeps(dependents),
          },

          {
            title: `${del.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
            skip,
            task: () => resourceAdapter.delete(options),
          },

          {
            title: 'Execute final cleanup',
            skip: mainSkip,
            task: async () => {
              await this.destroy(name, resourceAdapter);
              this.portAllocator.releasePort({
                plugin: this.plugin.name,
                resourceType: this.resourceType.name,
                resource: name,
              });

              await Promise.all([
                this.resourcesReady.delete(name),
                fs.remove(this.getDependenciesPath(name)),
                fs.remove(this.getDirectDependentsPath(name)),
              ]);

              delete this.resourceDependents[name];
              delete this.directResourceDependents[name];
            },
          },
        ]),

      onDone: () => {
        if (!shouldSkip) {
          delete this.deleteTaskList[name];
        }
      },
    });

    if (!shouldSkip) {
      this.deleteTaskList[name] = deleteTaskList;
    }

    return deleteTaskList;
  }

  private deleteDeps(deps: ResourceDependency[]): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
        const manager = this.pluginManager.getResourcesManager({
          plugin,
          resourceType,
        });

        const dependentResourceType = manager.resourceType;

        return {
          title: `${dependentResourceType.getCRUD().delete.names.upper} ${
            dependentResourceType.names.lower
          } ${this.getSimpleName(dependentName)}`,
          task: () => manager.delete(dependentName, {}),
        };
      }),
      concurrent: true,
    });
  }

  public start(name: string, options: ResourceOptions): TaskList {
    const { create, start, stop } = this.resourceType.getCRUD();
    if (start == null) {
      throw new ResourceNoStartError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }
    if (stop == null) {
      throw new ResourceNoStopError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }

    const shouldSkip = this.startTaskList[name] != null;
    const stopTaskList = this.stopTaskList[name];
    const resourceAdapter = this.resourceAdapters[name];
    const started = this.resourceAdaptersStarted[name];
    const directDependents = this.getStartDeps(this.directResourceDependents[name]);

    const startTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `Abort ${stop.names.ing} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
          skip: () => shouldSkip,
          enabled: () => stopTaskList != null,
          task: () => stopTaskList.abort(),
        },

        {
          title: 'Start created resources',
          enabled: () => directDependents.length > 0,
          skip: () => shouldSkip || resourceAdapter == null || started,
          task: () => this.startDeps(directDependents),
        },

        {
          title: `${start.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
          skip: () => {
            if (shouldSkip) {
              return `${this.resourceType.names.capital} ${this.getSimpleName(name)} is already being ${
                start.names.ed
              }.`;
            }

            if (resourceAdapter == null) {
              return (
                `${this.resourceType.names.capital} ${this.getSimpleName(name)} does not exist. ` +
                `Try ${create.names.ing} it first. From the command line: ` +
                `${create.name} ${this.resourceType.name} <name>`
              );
            }

            if (started) {
              return `${this.resourceType.names.capital} ${this.getSimpleName(name)} has already been ${
                start.names.ed
              }`;
            }

            return false;
          },
          task: () => resourceAdapter.start(options),
        },
      ],

      onDone: (failed) => {
        if (!shouldSkip) {
          this.resourceAdaptersStarted[name] = true;
          delete this.startTaskList[name];
          if (failed) {
            this.stop(name, options)
              .toPromise()
              .catch(() => {});
          }
        }
      },
    });

    if (!shouldSkip) {
      this.startTaskList[name] = startTaskList;
    }

    return startTaskList;
  }

  private getStartDeps(deps: ResourceDependency[] | null): ResourceDependency[] {
    return (deps || []).filter(
      ({ plugin, resourceType }) =>
        this.pluginManager
          .getResourcesManager({
            plugin,
            resourceType,
          })
          .resourceType.getCRUD().start != null,
    );
  }

  private startDeps(deps: ResourceDependency[]): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
        const manager = this.pluginManager.getResourcesManager({
          plugin,
          resourceType,
        });

        const dependentResourceType = manager.resourceType;

        const { start: depStart } = dependentResourceType.getCRUD();
        if (depStart == null) {
          throw new Error('For Flow');
        }

        return {
          title: `${depStart.names.upper} ${dependentResourceType.names.lower} ${this.getSimpleName(dependentName)}`,
          task: () => manager.start(dependentName, {}),
        };
      }),
      concurrent: false,
    });
  }

  public stop(name: string, options: ResourceOptions): TaskList {
    const { start, stop } = this.resourceType.getCRUD();
    if (start == null) {
      throw new ResourceNoStartError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }
    if (stop == null) {
      throw new ResourceNoStopError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }

    const shouldSkip = this.stopTaskList[name] != null;
    const startTaskList = this.startTaskList[name];
    const resourceAdapter = this.resourceAdapters[name];
    const skip = () => shouldSkip || resourceAdapter == null;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} is already being ${stop.names.ed}.`;
      }

      if (resourceAdapter == null) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} does not exist.`;
      }

      return false;
    };
    const dependents = this.getStopDeps(this.resourceDependents[name]);
    const directDependents = this.getStopDeps(this.directResourceDependents[name]);

    const stopTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `Abort ${start.names.ing} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
          skip,
          enabled: () => startTaskList != null,
          task: () => startTaskList.abort(),
        },

        {
          title: 'Stop dependent resources',
          enabled: () => dependents.length > 0,
          skip: mainSkip,
          task: () => this.stopDeps(dependents),
        },

        {
          title: `${stop.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
          skip,
          task: () => resourceAdapter.stop(options),
        },

        {
          title: 'Stop created resources',
          enabled: () => directDependents.length > 0,
          skip,
          task: () => this.stopDeps(directDependents),
        },
      ],

      onComplete: () => {
        this.resourceAdaptersStarted[name] = false;
      },
      onDone: () => {
        if (!shouldSkip) {
          delete this.stopTaskList[name];
        }
      },
    });

    if (!shouldSkip) {
      this.stopTaskList[name] = stopTaskList;
    }

    return stopTaskList;
  }

  private getStopDeps(deps: ResourceDependency[] | null): ResourceDependency[] {
    return (deps || []).filter(
      ({ plugin, resourceType }) =>
        this.pluginManager
          .getResourcesManager({
            plugin,
            resourceType,
          })
          .resourceType.getCRUD().stop != null,
    );
  }

  private stopDeps(deps: ResourceDependency[]): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
        const manager = this.pluginManager.getResourcesManager({
          plugin,
          resourceType,
        });

        const dependentResourceType = manager.resourceType;

        const { stop: depStop } = dependentResourceType.getCRUD();
        if (depStop == null) {
          throw new Error('For Flow');
        }

        return {
          title: `${depStop.names.upper} ${dependentResourceType.names.lower} ${this.getSimpleName(dependentName)}`,
          task: () => manager.stop(dependentName, {}),
        };
      }),
      concurrent: true,
    });
  }

  private async init(name: string): Promise<void> {
    const resourceAdapter = await this.masterResourceAdapter.initResourceAdapter({
      name,
      dataPath: path.resolve(this.resourcesPath, name),
    });

    this.resourceAdapters$.next({
      ...this.resourceAdapters,
      [name]: resourceAdapter,
    });
  }

  private async destroy(name: string, resourceAdapter: ResourceAdapter<Resource, ResourceOptions>): Promise<void> {
    const resourceAdapters = { ...this.resourceAdapters };
    delete resourceAdapters[name];
    this.resourceAdapters$.next(resourceAdapters);
    await resourceAdapter.destroy();
  }

  private getSimpleName(nameIn: string): string {
    const { name } = compoundName.extract(nameIn);
    return name;
  }

  private getDirectDependentsPath(name: string): string {
    return path.resolve(this.directDependentsPath, `${name}.json`);
  }

  private getDependenciesPath(name: string): string {
    return path.resolve(this.dependenciesPath, `${name}.json`);
  }

  private addDependents({ name: nameIn, dependencies }: { name: string; dependencies: ResourceDependency[] }): void {
    dependencies.forEach(({ plugin, resourceType, name }) => {
      this.pluginManager
        .getResourcesManager({
          plugin,
          resourceType,
        })
        .addDependent(name, {
          plugin: this.plugin.name,
          resourceType: this.resourceType.name,
          name: nameIn,
        });
    });
  }

  private uniqueDeps(deps: ResourceDependency[]): ResourceDependency[] {
    return _.uniqBy(deps, ({ plugin, resourceType, name }) => `${plugin}:${resourceType}:${name}`);
  }

  public addDependent(name: string, dependent: ResourceDependency): void {
    if (this.resourceDependents[name] == null) {
      this.resourceDependents[name] = [];
    }
    this.resourceDependents[name].push(dependent);
  }

  public addCreateHook(hook: CreateHook): void {
    this.createHooks.push(hook);
  }

  public getResourceAdapter(name: string): ResourceAdapter<Resource, ResourceOptions> {
    const adapter = this.resourceAdapters[name];
    if (adapter == null) {
      throw new Error(`${this.resourceType.names.capital} ${name} does not exist`);
    }
    return adapter;
  }

  public getDebug(): DescribeTable {
    return utils
      .entries(this.resourceAdapters)
      .map(([name, adapter]) => [name, { type: 'describe', table: adapter.getDebug() }]);
  }
}
