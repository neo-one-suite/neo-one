import { Monitor } from '@neo-one/monitor';
import { PluginNotInstalledError, UnknownPluginResourceType } from '@neo-one/server-client';
import {
  AllResources,
  BaseResource,
  Binary,
  DescribeTable,
  Plugin,
  pluginResourceTypeUtil,
  SubDescribeTable,
} from '@neo-one/server-plugin';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { combineLatest, concat, Observable, of as _of, ReplaySubject, Subject } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import toposort from 'toposort';
import { PluginDependencyNotMetError } from './errors';
import { plugins as pluginsUtil } from './plugins';
import { PortAllocator } from './PortAllocator';
import { Ready } from './Ready';
import { ResourcesManager } from './ResourcesManager';

const MANAGER_PATH = 'manager';
const MASTER_PATH = 'master';
const PLUGINS_READY_PATH = 'ready';

interface ResourcesManagers {
  // tslint:disable-next-line readonly-keyword
  [plugin: string]: {
    // tslint:disable-next-line no-any readonly-keyword
    [resourceType: string]: ResourcesManager<any, any>;
  };
}

interface Plugins {
  // tslint:disable-next-line readonly-keyword
  [plugin: string]: Plugin;
}

export class PluginManager {
  public readonly allResources$: Observable<AllResources>;
  public mutablePlugins: Plugins;
  public readonly plugins$: ReplaySubject<string>;
  private readonly monitor: Monitor;
  private readonly binary: Binary;
  private readonly portAllocator: PortAllocator;
  private readonly dataPath: string;
  private readonly resourcesManagers: ResourcesManagers;
  private readonly ready: Ready;
  private readonly update$: Subject<void>;

  public constructor({
    monitor,
    binary,
    portAllocator,
    dataPath,
  }: {
    readonly monitor: Monitor;
    readonly binary: Binary;
    readonly portAllocator: PortAllocator;
    readonly dataPath: string;
  }) {
    this.monitor = monitor.at('plugin_manager');
    this.binary = binary;
    this.portAllocator = portAllocator;
    this.dataPath = dataPath;

    this.resourcesManagers = {};
    this.mutablePlugins = {};
    this.plugins$ = new ReplaySubject();
    this.ready = new Ready({
      dir: path.resolve(dataPath, PLUGINS_READY_PATH),
    });

    this.update$ = new Subject();
    this.allResources$ = this.update$.pipe(
      switchMap(() =>
        concat(
          _of([]),
          combineLatest(
            Object.entries(this.resourcesManagers).reduce<Array<Observable<[string, ReadonlyArray<BaseResource>]>>>(
              (acc, [pluginName, pluginResourcesManagers]) =>
                acc.concat(
                  Object.entries(pluginResourcesManagers).map(([resourceType, resourcesManager]) =>
                    resourcesManager.resources$.pipe(
                      map<ReadonlyArray<BaseResource>, [string, ReadonlyArray<BaseResource>]>((resources) => [
                        pluginResourceTypeUtil.make({
                          plugin: pluginName,
                          resourceType,
                        }),

                        resources,
                      ]),
                    ),
                  ),
                ),

              [],
            ),
          ),
        ),
      ),

      map((result) => _.fromPairs(result)),
      shareReplay(1),
    );

    this.allResources$.subscribe().unsubscribe();
  }

  public get plugins(): ReadonlyArray<string> {
    return Object.keys(this.mutablePlugins);
  }

  public async init(): Promise<void> {
    await fs.ensureDir(this.ready.dir);
    const pluginNames = await this.ready.getAll();
    await this.registerPlugins([...new Set(pluginNames.concat(pluginsUtil.DEFAULT_PLUGINS))]);
  }

  public async reset(): Promise<void> {
    await Promise.all([
      Promise.all(Object.values(this.mutablePlugins).map(async (plugin) => plugin.reset())),
      Promise.all(
        Object.values(this.resourcesManagers)
          // tslint:disable-next-line no-any
          .reduce((acc: Array<ResourcesManager<any, any>>, managers) => acc.concat(Object.values(managers)), [])
          // tslint:disable-next-line no-any
          .map(async (manager: ResourcesManager<any, any>) => {
            await manager.reset();
          }),
      ),
    ]);
  }

  public async registerPlugins(pluginNames: ReadonlyArray<string>): Promise<void> {
    const plugins = pluginNames.map((pluginName) =>
      pluginsUtil.getPlugin({
        monitor: this.monitor,
        pluginName,
      }),
    );

    const graph = plugins.reduce<ReadonlyArray<[string, string]>>(
      (acc, plugin) => acc.concat(plugin.dependencies.map<[string, string]>((dep) => [plugin.name, dep])),
      [],
    );

    const sorted = _.reverse(toposort(graph));
    const pluginNameToPlugin = plugins.reduce<{ [pluginName: string]: Plugin }>((acc, plugin) => {
      // tslint:disable-next-line no-object-mutation
      acc[plugin.name] = plugin;

      return acc;
    }, {});
    const noDepPlugins = plugins.filter((plugin) => plugin.dependencies.length === 0);

    await Promise.all(noDepPlugins.map(async (plugin) => this.registerPlugin(plugin)));

    // tslint:disable-next-line no-loop-statement
    for (const pluginName of sorted) {
      const plugin = pluginNameToPlugin[pluginName] as Plugin | undefined;
      // The later plugins will fail with missing dependency
      if (plugin !== undefined) {
        await this.registerPlugin(pluginNameToPlugin[pluginName]);
      }
    }
  }

  public getResourcesManager({
    plugin: pluginName,
    resourceType: resourceTypeName,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    // tslint:disable-next-line no-any
  }): ResourcesManager<any, any> {
    const plugin = this.mutablePlugins[pluginName];
    // tslint:disable-next-line strict-type-predicates
    if (plugin === undefined) {
      throw new PluginNotInstalledError(pluginName);
    }
    const resourceType = plugin.resourceTypeByName[resourceTypeName];
    // tslint:disable-next-line strict-type-predicates
    if (resourceType === undefined) {
      throw new UnknownPluginResourceType({
        plugin: pluginName,
        resourceType: resourceTypeName,
      });
    }

    return this.resourcesManagers[pluginName][resourceTypeName];
  }

  public getDebug(): DescribeTable {
    return [
      ['Binary', `${this.binary.cmd} ${this.binary.firstArgs.join(' ')}`],
      ['Port Allocator', { type: 'describe', table: this.portAllocator.getDebug() }],
      ['Resources Managers', { type: 'describe', table: this.getResourcesManagersDebug() }],
    ];
  }

  private async registerPlugin(plugin: Plugin): Promise<void> {
    // tslint:disable-next-line no-loop-statement
    for (const dependency of plugin.dependencies) {
      // tslint:disable-next-line strict-type-predicates
      if (this.mutablePlugins[dependency] === undefined) {
        throw new PluginDependencyNotMetError({
          plugin: plugin.name,
          dependency,
        });
      }
    }

    this.mutablePlugins[plugin.name] = plugin;
    // tslint:disable-next-line no-object-mutation
    this.resourcesManagers[plugin.name] = {};
    const resourcesManagers = await Promise.all(
      plugin.resourceTypes.map(async (resourceType) => {
        const masterResourceAdapter = await resourceType.createMasterResourceAdapter({
          pluginManager: this,
          dataPath: this.getMasterResourceAdapterDataPath({
            plugin: plugin.name,
            resourceType: resourceType.name,
          }),

          binary: this.binary,
          portAllocator: this.portAllocator,
        });

        const resourcesManager = new ResourcesManager({
          monitor: this.monitor,
          dataPath: this.getResourcesManagerDataPath({
            plugin: plugin.name,
            resourceType: resourceType.name,
          }),

          pluginManager: this,
          resourceType,
          masterResourceAdapter,
          portAllocator: this.portAllocator,
        });

        await resourcesManager.init();

        return { resourceType: resourceType.name, resourcesManager };
      }),
    );

    plugin.createHooks.forEach(({ plugin: pluginName, resourceType: resourceTypeName, hook }) => {
      this.getResourcesManager({
        plugin: pluginName,
        resourceType: resourceTypeName,
      }).addCreateHook(hook);
    });

    await this.ready.write(plugin.name);
    resourcesManagers.forEach(({ resourceType, resourcesManager }) => {
      // tslint:disable-next-line no-object-mutation
      this.resourcesManagers[plugin.name][resourceType] = resourcesManager;
    });
    this.plugins$.next(plugin.name);
    this.update$.next();
  }

  private getResourcesManagerDataPath(options: { readonly plugin: string; readonly resourceType: string }): string {
    return path.resolve(this.getPluginPath(options), MANAGER_PATH);
  }

  private getMasterResourceAdapterDataPath(options: {
    readonly plugin: string;
    readonly resourceType: string;
  }): string {
    return path.resolve(this.getPluginPath(options), MASTER_PATH);
  }

  private getPluginPath({ plugin, resourceType }: { readonly plugin: string; readonly resourceType: string }): string {
    return path.resolve(this.dataPath, pluginsUtil.cleanPluginName({ pluginName: plugin }), resourceType);
  }

  private getResourcesManagersDebug(): DescribeTable {
    return Object.entries(this.resourcesManagers).map<[string, SubDescribeTable]>(
      ([pluginName, resourceTypeManagers]) => [
        pluginName.slice('@neo-one/server-plugin-'.length),
        {
          type: 'describe',
          table: Object.entries(resourceTypeManagers).map<[string, SubDescribeTable]>(
            ([resourceType, resourcesManager]) => [
              resourceType,
              { type: 'describe', table: resourcesManager.getDebug() },
            ],
          ),
        },
      ],
    );
  }
}
