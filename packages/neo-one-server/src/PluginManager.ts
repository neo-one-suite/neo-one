import { Observable, ReplaySubject, Subject, combineLatest, concat, of as _of } from 'rxjs';
import { AllResources, Binary, DescribeTable, Plugin, pluginResourceTypeUtil } from '@neo-one/server-plugin';
import { Monitor } from '@neo-one/monitor';
import { PluginNotInstalledError, UnknownPluginResourceType } from '@neo-one/server-client';
import _ from 'lodash';
import fs from 'fs-extra';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import path from 'path';
import toposort from 'toposort';
import { utils } from '@neo-one/utils';
import { PluginDependencyNotMetError } from './errors';
import { PortAllocator } from './PortAllocator';
import { Ready } from './Ready';
import { ResourcesManager } from './ResourcesManager';
import { pluginsUtil } from './plugins';

const MANAGER_PATH = 'manager';
const MASTER_PATH = 'master';
const PLUGINS_READY_PATH = 'ready';

interface ResourcesManagers {
  [plugin: string]: {
    [resourceType: string]: ResourcesManager<any, any>;
  };
}

interface Plugins {
  [plugin: string]: Plugin;
}

export class PluginManager {
  private readonly monitor: Monitor;
  private readonly binary: Binary;
  private readonly portAllocator: PortAllocator;
  private readonly dataPath: string;
  private readonly resourcesManagers: ResourcesManagers;
  private readonly plugins: Plugins;
  public readonly plugins$: ReplaySubject<string>;
  private readonly ready: Ready;
  private readonly update$: Subject<void>;
  public readonly allResources$: Observable<AllResources>;

  constructor({
    monitor,
    binary,
    portAllocator,
    dataPath,
  }: {
    monitor: Monitor;
    binary: Binary;
    portAllocator: PortAllocator;
    dataPath: string;
  }) {
    this.monitor = monitor.at('plugin_manager');
    this.binary = binary;
    this.portAllocator = portAllocator;
    this.dataPath = dataPath;

    this.resourcesManagers = {};
    this.plugins = {};
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
            utils.entries(this.resourcesManagers).reduce(
              (acc, [pluginName, pluginResourcesManagers]) =>
                acc.concat(
                  utils.entries(pluginResourcesManagers).map(([resourceType, resourcesManager]) =>
                    resourcesManager.resources$.pipe(
                      map((resources) => [
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

  public get plugins(): string[] {
    return Object.keys(this.plugins);
  }

  public async init(): Promise<void> {
    await fs.ensureDir(this.ready.dir);
    const pluginNames = await this.ready.getAll();
    await this.registerPlugins([...new Set(pluginNames.concat(pluginsUtil.DEFAULT_PLUGINS))]);
  }

  public async reset(): Promise<void> {
    await Promise.all([
      Promise.all(utils.values(this.plugins).map((plugin) => plugin.reset())),
      Promise.all(
        utils
          .values(this.resourcesManagers)
          .reduce((acc, managers) => acc.concat(utils.values(managers)), [])
          .map((manager) => manager.reset()),
      ),
    ]);
  }

  public async registerPlugins(pluginNames: string[]): Promise<void> {
    const plugins = pluginNames.map((pluginName) =>
      pluginsUtil.getPlugin({
        monitor: this.monitor,
        pluginName,
      }),
    );

    const graph = plugins.reduce((acc, plugin) => acc.concat(plugin.dependencies.map((dep) => [plugin.name, dep])), []);

    const sorted = toposort(graph).reverse();
    const pluginNameToPlugin = plugins.reduce((acc, plugin) => {
      acc[plugin.name] = plugin;
      return acc;
    }, {});
    const noDepPlugins = plugins.filter((plugin) => plugin.dependencies.length === 0);

    await Promise.all(noDepPlugins.map((plugin) => this.registerPlugin(plugin)));

    for (const pluginName of sorted) {
      const plugin = pluginNameToPlugin[pluginName];
      // The later plugins will fail with missing dependency
      if (plugin != null) {
        // eslint-disable-next-line
        await this.registerPlugin(pluginNameToPlugin[pluginName]);
      }
    }
  }

  private async registerPlugin(plugin: Plugin): Promise<void> {
    for (const dependency of plugin.dependencies) {
      if (this.plugins[dependency] == null) {
        throw new PluginDependencyNotMetError({
          plugin: plugin.name,
          dependency,
        });
      }
    }

    this.plugins[plugin.name] = plugin;
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
      this.resourcesManagers[plugin.name][resourceType] = resourcesManager;
    });
    this.plugins$.next(plugin.name);
    this.update$.next();
  }

  public getResourcesManager({
    plugin: pluginName,
    resourceType: resourceTypeName,
  }: {
    plugin: string;
    resourceType: string;
  }): ResourcesManager<any, any> {
    const plugin = this.plugins[pluginName];
    if (plugin == null) {
      throw new PluginNotInstalledError(pluginName);
    }
    const resourceType = plugin.resourceTypeByName[resourceTypeName];
    if (resourceType == null) {
      throw new UnknownPluginResourceType({
        plugin: pluginName,
        resourceType: resourceTypeName,
      });
    }

    return this.resourcesManagers[pluginName][resourceTypeName];
  }

  private getResourcesManagerDataPath(options: { plugin: string; resourceType: string }): string {
    return path.resolve(this.getPluginPath(options), MANAGER_PATH);
  }

  private getMasterResourceAdapterDataPath(options: { plugin: string; resourceType: string }): string {
    return path.resolve(this.getPluginPath(options), MASTER_PATH);
  }

  private getPluginPath({ plugin, resourceType }: { plugin: string; resourceType: string }): string {
    return path.resolve(this.dataPath, pluginsUtil.cleanPluginName({ pluginName: plugin }), resourceType);
  }

  public getDebug(): DescribeTable {
    return [
      ['Binary', `${this.binary.cmd} ${this.binary.firstArgs.join(' ')}`],
      ['Port Allocator', { type: 'describe', table: this.portAllocator.getDebug() }],

      ['Resources Managers', { type: 'describe', table: this.getResourcesManagersDebug() }],
    ];
  }

  private getResourcesManagersDebug(): DescribeTable {
    return utils.entries(this.resourcesManagers).map(([pluginName, resourceTypeManagers]) => [
      pluginName.slice('@neo-one/server-plugin-'.length),
      {
        type: 'describe',
        table: utils
          .entries(resourceTypeManagers)
          .map(([resourceType, resourcesManager]) => [
            resourceType,
            { type: 'describe', table: resourcesManager.getDebug() },
          ]),
      },
    ]);
  }
}
