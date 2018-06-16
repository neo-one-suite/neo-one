import { Monitor } from '@neo-one/monitor';
import {
  BaseResource,
  BaseResourceOptions,
  compoundName,
  CreateHook,
  DescribeTable,
  MasterResourceAdapter,
  Plugin,
  ResourceAdapter,
  ResourceDependency,
  ResourceType,
  SubDescribeTable,
  Task,
  TaskList,
} from '@neo-one/server-plugin';
import { labels, utils } from '@neo-one/utils';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { BehaviorSubject, combineLatest, Observable, of as _of } from 'rxjs';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { ResourceNoStartError, ResourceNoStopError } from './errors';
import { PluginManager } from './PluginManager';
import { PortAllocator } from './PortAllocator';
import { Ready } from './Ready';

const RESOURCES_PATH = 'resources';
const RESOURCES_READY_PATH = 'ready';
const DIRECT_DEPENDENTS_PATH = 'dependents';
const DEPENDENCIES_PATH = 'dependencies';

interface ResourceAdapters<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly [resource: string]: ResourceAdapter<Resource, ResourceOptions>;
}

export interface InitError {
  readonly resourceType: string;
  readonly resource: string;
  readonly error: Error;
}

interface TaskLists {
  // tslint:disable-next-line readonly-keyword
  [resource: string]: TaskList;
}

export class ResourcesManager<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  public readonly resourceType: ResourceType<Resource, ResourceOptions>;
  public readonly masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>;
  public readonly resources$: Observable<ReadonlyArray<Resource>>;
  private readonly monitor: Monitor;
  private readonly dataPath: string;
  private readonly pluginManager: PluginManager;
  private readonly portAllocator: PortAllocator;
  private readonly plugin: Plugin;
  private readonly resourceAdapters$: BehaviorSubject<ResourceAdapters<Resource, ResourceOptions>>;
  private readonly directResourceDependents: {
    // tslint:disable-next-line readonly-keyword readonly-array
    [name: string]: ResourceDependency[];
  };
  private readonly resourceDependents: {
    // tslint:disable-next-line readonly-keyword readonly-array
    [name: string]: ResourceDependency[];
  };
  private readonly mutableCreateHooks: CreateHook[];
  private readonly resourcesPath: string;
  private readonly resourcesReady: Ready;
  private readonly directDependentsPath: string;
  private readonly dependenciesPath: string;
  private readonly createTaskList: TaskLists;
  private readonly deleteTaskList: TaskLists;
  private readonly startTaskList: TaskLists;
  private readonly stopTaskList: TaskLists;
  private readonly resourceAdaptersStarted: {
    // tslint:disable-next-line readonly-keyword
    [resource: string]: boolean;
  };

  public constructor({
    monitor,
    dataPath,
    pluginManager,
    resourceType,
    masterResourceAdapter,
    portAllocator,
  }: {
    readonly monitor: Monitor;
    readonly dataPath: string;
    readonly pluginManager: PluginManager;
    readonly resourceType: ResourceType<Resource, ResourceOptions>;
    readonly masterResourceAdapter: MasterResourceAdapter<Resource, ResourceOptions>;
    readonly portAllocator: PortAllocator;
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
    this.resourceAdapters$ = new BehaviorSubject<ResourceAdapters<Resource, ResourceOptions>>({});
    this.directResourceDependents = {};
    this.resourceDependents = {};
    this.mutableCreateHooks = [];

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
        const adapters = Object.values(resourceAdapters);
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

  public async reset(): Promise<void> {
    await this.destroy();
  }

  public async destroy(): Promise<void> {
    await this.monitor.captureLog(
      async () => {
        await Promise.all(
          Object.entries(this.resourceAdapters).map(async ([name, resourceAdapter]) => {
            // tslint:disable-next-line no-any
            await this.stop(name, {} as any)
              .toPromise()
              .catch(() => {
                // do nothing
              });
            await this.destroyName(name, resourceAdapter).catch(() => {
              // do nothing
            });
          }),
        );
      },
      {
        name: 'neo_resource_manager_destroy',
        message: `Destroyed resource manager for ${this.plugin.name} ${this.resourceType.name}`,
      },
    );
  }

  public getResources$(options: ResourceOptions): Observable<ReadonlyArray<Resource>> {
    return this.resources$.pipe(map((resources) => this.resourceType.filterResources(resources, options)));
  }

  public getResource$({
    name,
    options,
  }: {
    readonly name: string;
    readonly options: ResourceOptions;
  }): Observable<Resource | undefined> {
    return this.getResources$(options).pipe(map((resources) => resources.find((resource) => resource.name === name)));
  }

  public create(name: string, options: ResourceOptions): TaskList {
    const { create, start } = this.resourceType.getCRUD();
    const taskList = this.createTaskList[name] as TaskList | undefined;
    const shouldSkip = taskList !== undefined;
    const resourceAdapter = this.resourceAdapters[name] as ResourceAdapter<Resource, ResourceOptions> | undefined;
    const skip = () => shouldSkip || resourceAdapter !== undefined;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} is already being ${create.names.ed}.`;
      }

      if (resourceAdapter !== undefined) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} already exists.`;
      }

      return false;
    };

    let startTask;
    if (create.startOnCreate && start !== undefined) {
      startTask = {
        title: `${start.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
        skip,
        enabled: () => create.startOnCreate,
        task: () => this.start(name, options),
      };
    }

    let set = false;
    // tslint:disable-next-line no-any
    const setFromContext = (ctx: any) => {
      if (!set) {
        set = true;
        if (ctx.resourceAdapter != undefined) {
          this.resourceAdapters$.next({
            ...this.resourceAdapters,
            [name]: ctx.resourceAdapter,
          });

          const dependencies = ctx.dependencies === undefined ? [] : ctx.dependencies;
          const dependents = ctx.dependents == undefined ? [] : ctx.dependents;
          // tslint:disable-next-line no-object-mutation
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
          task: (): TaskList =>
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
          // tslint:disable-next-line no-any
          task: async (ctx: any): Promise<void> => {
            setFromContext(ctx);
            // tslint:disable-next-line no-any
            await this.getResource$({ name, options: {} as any })
              .pipe(
                filter((value) => value !== undefined),
                take(1),
              )
              .toPromise();
            const dependencies = ctx.dependencies === undefined ? [] : ctx.dependencies;
            const dependents = ctx.dependents === undefined ? [] : ctx.dependents;
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
          enabled: () => this.mutableCreateHooks.length > 0,
          task: () =>
            new TaskList({
              tasks: this.mutableCreateHooks.map((hook) =>
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
      ].filter(utils.notNull),
      // tslint:disable-next-line no-unused
      onError: (error, ctx) => {
        if (!shouldSkip) {
          setFromContext(ctx);
        }
      },
      onDone: (failed) => {
        if (!shouldSkip) {
          // tslint:disable-next-line no-dynamic-delete no-object-mutation
          delete this.createTaskList[name];
          if (failed) {
            this.delete(name, options)
              .toPromise()
              .catch(() => {
                // do nothing
              });
          }
        }
      },
    });

    if (!shouldSkip) {
      // tslint:disable-next-line no-object-mutation
      this.createTaskList[name] = createTaskList;
    }

    return createTaskList;
  }

  public delete(name: string, options: ResourceOptions): TaskList {
    const deleteTask = this.deleteTaskList[name] as TaskList | undefined;
    const shouldSkip = deleteTask !== undefined;
    const { create, start, stop, delete: del } = this.resourceType.getCRUD();
    const startTaskList = this.startTaskList[name] as TaskList | undefined;
    const startStopTasks: Task[] = [];
    if (start !== undefined) {
      // tslint:disable-next-line no-array-mutation
      startStopTasks.push({
        title: `Abort ${start.names.ing} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
        enabled: () => startTaskList !== undefined,
        task: async (): Promise<void> => {
          if (startTaskList !== undefined) {
            await startTaskList.abort();
          }
        },
      });
    }
    if (stop !== undefined) {
      // tslint:disable-next-line no-array-mutation
      startStopTasks.push({
        title: `${stop.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
        enabled: () => this.resourceAdaptersStarted[name],
        task: () => this.stop(name, options),
      });
    }
    const createTaskList = this.createTaskList[name] as TaskList | undefined;
    const resourceAdapter = this.resourceAdapters[name] as ResourceAdapter<Resource, ResourceOptions> | undefined;
    const skip = () => shouldSkip || resourceAdapter === undefined;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} is already being ${del.names.ed}.`;
      }

      if (resourceAdapter === undefined) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} does not exist.`;
      }

      return false;
    };
    const resourceDependents = this.resourceDependents[name] as ResourceDependency[] | undefined;
    const directResourceDependents = this.directResourceDependents[name] as ResourceDependency[] | undefined;
    const dependents = this.uniqueDeps(
      (resourceDependents === undefined ? [] : resourceDependents).concat(
        directResourceDependents === undefined ? [] : directResourceDependents,
      ),
    );

    const abortTasks: ReadonlyArray<Task> = [
      {
        title: `Abort ${create.names.ing} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
        enabled: () => createTaskList !== undefined,
        task: async () => {
          if (createTaskList !== undefined) {
            await createTaskList.abort();
          }
        },
      },
    ];

    const deleteTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: abortTasks.concat(startStopTasks).concat([
        {
          title: 'Delete dependent resources',
          enabled: () => dependents.length > 0,
          skip,
          task: () => this.deleteDeps(dependents),
        },

        {
          title: `${del.names.upper} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
          skip,
          task: () => {
            if (resourceAdapter !== undefined) {
              resourceAdapter.delete(options);
            }
          },
        },

        {
          title: 'Execute final cleanup',
          skip: mainSkip,
          task: async () => {
            await this.destroyName(name, resourceAdapter as ResourceAdapter<Resource, ResourceOptions>);
            await this.portAllocator.releasePort({
              plugin: this.plugin.name,
              resourceType: this.resourceType.name,
              resource: name,
            });

            await Promise.all([
              this.resourcesReady.delete(name),
              fs.remove(this.getDependenciesPath(name)),
              fs.remove(this.getDirectDependentsPath(name)),
            ]);

            // tslint:disable-next-line no-object-mutation no-dynamic-delete
            delete this.resourceDependents[name];
            // tslint:disable-next-line no-object-mutation no-dynamic-delete
            delete this.directResourceDependents[name];
          },
        },
      ]),

      onDone: () => {
        if (!shouldSkip) {
          // tslint:disable-next-line no-object-mutation no-dynamic-delete
          delete this.deleteTaskList[name];
        }
      },
    });

    if (!shouldSkip) {
      // tslint:disable-next-line no-object-mutation
      this.deleteTaskList[name] = deleteTaskList;
    }

    return deleteTaskList;
  }

  public start(name: string, options: ResourceOptions): TaskList {
    const { create, start, stop } = this.resourceType.getCRUD();
    if (start === undefined) {
      throw new ResourceNoStartError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }
    if (stop === undefined) {
      throw new ResourceNoStopError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }

    const startTaskListName = this.startTaskList[name] as TaskList | undefined;
    const shouldSkip = startTaskListName !== undefined;
    const stopTaskList = this.stopTaskList[name] as TaskList | undefined;
    const resourceAdapter = this.resourceAdapters[name] as ResourceAdapter<Resource, ResourceOptions> | undefined;
    const started = this.resourceAdaptersStarted[name];
    const directDependents = this.getStartDeps(this.directResourceDependents[name]);

    const startTaskList = new TaskList({
      freshContext: true,
      collapse: false,
      tasks: [
        {
          title: `Abort ${stop.names.ing} ${this.resourceType.names.lower} ${this.getSimpleName(name)}`,
          skip: () => shouldSkip,
          enabled: () => stopTaskList !== undefined,
          task: async () => {
            if (stopTaskList !== undefined) {
              await stopTaskList.abort();
            }
          },
        },

        {
          title: 'Start created resources',
          enabled: () => directDependents.length > 0,
          skip: () => shouldSkip || resourceAdapter === undefined || started,
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

            if (resourceAdapter === undefined) {
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
          task: () => {
            if (resourceAdapter !== undefined) {
              resourceAdapter.start(options);
            }
          },
        },
      ],

      onDone: (failed) => {
        if (!shouldSkip) {
          // tslint:disable-next-line no-object-mutation
          this.resourceAdaptersStarted[name] = true;
          // tslint:disable-next-line no-object-mutation no-dynamic-delete
          delete this.startTaskList[name];
          if (failed) {
            this.stop(name, options)
              .toPromise()
              .catch(() => {
                // do nothing
              });
          }
        }
      },
    });

    if (!shouldSkip) {
      // tslint:disable-next-line no-object-mutation
      this.startTaskList[name] = startTaskList;
    }

    return startTaskList;
  }

  public stop(name: string, options: ResourceOptions): TaskList {
    const { start, stop } = this.resourceType.getCRUD();
    if (start === undefined) {
      throw new ResourceNoStartError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }
    if (stop === undefined) {
      throw new ResourceNoStopError({
        plugin: this.plugin.name,
        resourceType: this.resourceType.names.lower,
      });
    }
    const stopTaskListName = this.stopTaskList[name] as TaskList | undefined;
    const shouldSkip = stopTaskListName !== undefined;
    const startTaskList = this.startTaskList[name] as TaskList | undefined;
    const resourceAdapter = this.resourceAdapters[name] as ResourceAdapter<Resource, ResourceOptions> | undefined;
    const skip = () => shouldSkip || resourceAdapter === undefined;
    const mainSkip = () => {
      if (shouldSkip) {
        return `${this.resourceType.names.capital} ${this.getSimpleName(name)} is already being ${stop.names.ed}.`;
      }

      if (resourceAdapter === undefined) {
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
          enabled: () => startTaskList !== undefined,
          task: async () => {
            if (startTaskList !== undefined) {
              await startTaskList.abort();
            }
          },
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
          task: () => {
            if (resourceAdapter !== undefined) {
              resourceAdapter.stop(options);
            }
          },
        },

        {
          title: 'Stop created resources',
          enabled: () => directDependents.length > 0,
          skip,
          task: () => this.stopDeps(directDependents),
        },
      ],

      onComplete: () => {
        // tslint:disable-next-line no-object-mutation
        this.resourceAdaptersStarted[name] = false;
      },
      onDone: () => {
        if (!shouldSkip) {
          // tslint:disable-next-line no-object-mutation no-dynamic-delete
          delete this.stopTaskList[name];
        }
      },
    });

    if (!shouldSkip) {
      // tslint:disable-next-line no-object-mutation
      this.stopTaskList[name] = stopTaskList;
    }

    return stopTaskList;
  }

  public addDependent(name: string, dependent: ResourceDependency): void {
    const resourceDependents = this.resourceDependents[name] as ResourceDependency[] | undefined;
    if (resourceDependents === undefined) {
      // tslint:disable-next-line no-object-mutation
      this.resourceDependents[name] = [];
    }
    // tslint:disable-next-line no-array-mutation
    this.resourceDependents[name].push(dependent);
  }

  public addCreateHook(hook: CreateHook): void {
    this.mutableCreateHooks.push(hook);
  }

  public getResourceAdapter(name: string): ResourceAdapter<Resource, ResourceOptions> {
    const adapter = this.resourceAdapters[name] as ResourceAdapter<Resource, ResourceOptions> | undefined;
    if (adapter === undefined) {
      throw new Error(`${this.resourceType.names.capital} ${name} does not exist`);
    }

    return adapter;
  }

  public getDebug(): DescribeTable {
    return Object.entries(this.resourceAdapters).map<[string, SubDescribeTable]>(([name, adapter]) => [
      name,
      { type: 'describe', table: adapter.getDebug() },
    ]);
  }

  public async init(): Promise<ReadonlyArray<InitError>> {
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
            async (name: string): Promise<InitError | undefined> => {
              try {
                const [dependencies, dependents] = await Promise.all([
                  this.readDeps(this.getDependenciesPath(name)),
                  this.readDeps(this.getDirectDependentsPath(name)),
                  this.initName(name),
                ]);

                // tslint:disable-next-line no-object-mutation
                this.directResourceDependents[name] = [...dependents];

                this.addDependents({ name, dependencies });

                return undefined;
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

        return results.filter(utils.notNull);
      },
      {
        name: 'neo_resource_manager_inititalize',
        message: 'Initializing resource manager.',
        error: 'Failed to initialize resource manager.',
      },
    );
  }

  private async initName(name: string): Promise<void> {
    const resourceAdapter = await this.masterResourceAdapter.initResourceAdapter({
      name,
      dataPath: path.resolve(this.resourcesPath, name),
    });

    this.resourceAdapters$.next({
      ...this.resourceAdapters,
      [name]: resourceAdapter,
    });
  }

  private async readDeps(depsPath: string): Promise<ReadonlyArray<ResourceDependency>> {
    try {
      // tslint:disable-next-line prefer-immediate-return
      const deps = await fs.readJSON(depsPath);

      // tslint:disable-next-line no-var-before-return
      return deps;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  private deleteDeps(deps: ReadonlyArray<ResourceDependency>): TaskList {
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

  private getStartDeps(deps: ReadonlyArray<ResourceDependency> | undefined): ReadonlyArray<ResourceDependency> {
    return (deps === undefined ? [] : deps).filter(
      ({ plugin, resourceType }) =>
        this.pluginManager
          .getResourcesManager({
            plugin,
            resourceType,
          })
          .resourceType.getCRUD().start !== undefined,
    );
  }

  private startDeps(deps: ReadonlyArray<ResourceDependency>): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
        const manager = this.pluginManager.getResourcesManager({
          plugin,
          resourceType,
        });

        const dependentResourceType = manager.resourceType;

        const { start: depStart } = dependentResourceType.getCRUD();
        if (depStart === undefined) {
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

  private getStopDeps(deps: ReadonlyArray<ResourceDependency> | undefined): ReadonlyArray<ResourceDependency> {
    return (deps === undefined ? [] : deps).filter(
      ({ plugin, resourceType }) =>
        this.pluginManager
          .getResourcesManager({
            plugin,
            resourceType,
          })
          .resourceType.getCRUD().stop !== undefined,
    );
  }

  private stopDeps(deps: ReadonlyArray<ResourceDependency>): TaskList {
    return new TaskList({
      tasks: deps.map(({ plugin, resourceType, name: dependentName }) => {
        const manager = this.pluginManager.getResourcesManager({
          plugin,
          resourceType,
        });

        const dependentResourceType = manager.resourceType;

        const { stop: depStop } = dependentResourceType.getCRUD();
        if (depStop === undefined) {
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

  private async destroyName(name: string, resourceAdapter: ResourceAdapter<Resource, ResourceOptions>): Promise<void> {
    const resourceAdapters = { ...this.resourceAdapters };
    // tslint:disable-next-line no-object-mutation no-dynamic-delete
    delete resourceAdapters[name];
    this.resourceAdapters$.next(resourceAdapters);
    await resourceAdapter.destroy();
  }

  private getSimpleName(nameIn: string): string {
    return compoundName.extract(nameIn).name;

    return name;
  }

  private getDirectDependentsPath(name: string): string {
    return path.resolve(this.directDependentsPath, `${name}.json`);
  }

  private getDependenciesPath(name: string): string {
    return path.resolve(this.dependenciesPath, `${name}.json`);
  }

  private addDependents({
    name: nameIn,
    dependencies,
  }: {
    readonly name: string;
    readonly dependencies: ReadonlyArray<ResourceDependency>;
  }): void {
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

  private uniqueDeps(deps: ReadonlyArray<ResourceDependency>): ReadonlyArray<ResourceDependency> {
    return _.uniqBy(deps, ({ plugin, resourceType, name }) => `${plugin}:${resourceType}:${name}`);
  }
}
