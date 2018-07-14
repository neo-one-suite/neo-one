import { Monitor } from '@neo-one/monitor';
import { PluginNotInstalledError, UnknownPluginResourceType } from '@neo-one/server-client';
import {
  AllResources,
  BaseResource,
  Binary,
  DescribeTable,
  Plugin,
  pluginResourceTypeUtil,
  ResourceType,
  SubDescribeTable,
} from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
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
    // tslint:disable-next-line readonly-keyword
    [resourceType: string]: ResourcesManager;
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
  private readonly mutableResourceManagers: ResourcesManagers;
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

    this.mutableResourceManagers = {};
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
            Object.entries(this.mutableResourceManagers).reduce<
              Array<Observable<[string, ReadonlyArray<BaseResource>]>>
            >(
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
        Object.values(this.mutableResourceManagers)
          .reduce((acc: ReadonlyArray<ResourcesManager>, managers) => acc.concat(Object.values(managers)), [])
          .map(async (manager: ResourcesManager) => {
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
    const pluginNameToPlugin = plugins.reduce<{ [pluginName: string]: Plugin }>(
      (acc, plugin) => ({
        ...acc,
        [plugin.name]: plugin,
      }),
      {},
    );
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
  }): ResourcesManager {
    const plugin = this.mutablePlugins[pluginName] as Plugin | undefined;
    if (plugin === undefined) {
      throw new PluginNotInstalledError(pluginName);
    }
    const resourceType = plugin.resourceTypeByName[resourceTypeName] as ResourceType | undefined;
    if (resourceType === undefined) {
      throw new UnknownPluginResourceType({
        plugin: pluginName,
        resourceType: resourceTypeName,
      });
    }

    return this.mutableResourceManagers[pluginName][resourceTypeName];
  }

  public getDebug(): DescribeTable {
    return [
      ['Binary', `${this.binary.cmd} ${this.binary.firstArgs.join(' ')}`],
      ['Port Allocator', { type: 'describe', table: this.portAllocator.getDebug() }],
      ['Resources Managers', { type: 'describe', table: this.getResourcesManagersDebug() }],
    ];
  }

  private async registerPlugin(plugin: Plugin): Promise<void> {
    plugin.dependencies.forEach((dependency) => {
      if ((this.mutablePlugins[dependency] as Plugin | undefined) === undefined) {
        throw new PluginDependencyNotMetError({
          plugin: plugin.name,
          dependency,
        });
      }
    });

    this.mutablePlugins[plugin.name] = plugin;
    this.mutableResourceManagers[plugin.name] = {};
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
      this.mutableResourceManagers[plugin.name][resourceType] = resourcesManager;
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
    return Object.entries(this.mutableResourceManagers).map<[string, SubDescribeTable]>(
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
