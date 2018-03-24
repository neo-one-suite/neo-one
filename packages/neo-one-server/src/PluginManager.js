/* @flow */
import type { Observable } from 'rxjs/Observable';
import {
  type AllResources,
  type Binary,
  type DescribeTable,
  type Plugin,
  pluginResourceTypeUtil,
} from '@neo-one/server-plugin';
import type { Monitor } from '@neo-one/monitor';
import {
  PluginNotInstalledError,
  UnknownPluginResourceType,
} from '@neo-one/server-client';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';

import _ from 'lodash';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { concat } from 'rxjs/observable/concat';
import fs from 'fs-extra';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { of as _of } from 'rxjs/observable/of';
import path from 'path';
import toposort from 'toposort';
import { utils } from '@neo-one/utils';

import { PluginDependencyNotMetError } from './errors';
import type PortAllocator from './PortAllocator';
import Ready from './Ready';
import ResourcesManager from './ResourcesManager';

import pluginsUtil from './plugins';

const MANAGER_PATH = 'manager';
const MASTER_PATH = 'master';
const PLUGINS_READY_PATH = 'ready';

type ResourcesManagers = {
  [plugin: string]: {
    [resourceType: string]: ResourcesManager<*, *>,
  },
};
type Plugins = { [plugin: string]: Plugin };

export default class PluginManager {
  _monitor: Monitor;
  _binary: Binary;
  _portAllocator: PortAllocator;
  _dataPath: string;

  _resourcesManagers: ResourcesManagers;
  _plugins: Plugins;
  plugins$: ReplaySubject<string>;
  _ready: Ready;
  _update$: Subject<void>;

  allResources$: Observable<AllResources>;

  constructor({
    monitor,
    binary,
    portAllocator,
    dataPath,
  }: {|
    monitor: Monitor,
    binary: Binary,
    portAllocator: PortAllocator,
    dataPath: string,
  |}) {
    this._monitor = monitor.at('plugin_manager');
    this._binary = binary;
    this._portAllocator = portAllocator;
    this._dataPath = dataPath;

    this._resourcesManagers = {};
    this._plugins = {};
    this.plugins$ = new ReplaySubject();
    this._ready = new Ready({
      dir: path.resolve(dataPath, PLUGINS_READY_PATH),
    });
    this._update$ = new Subject();
    this.allResources$ = this._update$.pipe(
      switchMap(() =>
        concat(
          _of([]),
          combineLatest(
            utils.entries(this._resourcesManagers).reduce(
              (acc, [pluginName, pluginResourcesManagers]) =>
                acc.concat(
                  utils
                    .entries(pluginResourcesManagers)
                    .map(([resourceType, resourcesManager]) =>
                      resourcesManager.resources$.pipe(
                        map(resources => [
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
      map(result => _.fromPairs(result)),
      shareReplay(1),
    );
    this.allResources$.subscribe().unsubscribe();
  }

  get plugins(): Array<string> {
    return Object.keys(this._plugins);
  }

  async init(): Promise<void> {
    await fs.ensureDir(this._ready.dir);
    const pluginNames = await this._ready.getAll();
    await this.registerPlugins([
      ...new Set(pluginNames.concat(pluginsUtil.DEFAULT_PLUGINS)),
    ]);
  }

  async reset(): Promise<void> {
    await Promise.all([
      Promise.all(utils.values(this._plugins).map(plugin => plugin.reset())),
      Promise.all(
        utils
          .values(this._resourcesManagers)
          .reduce((acc, managers) => acc.concat(utils.values(managers)), [])
          .map(manager => manager.reset()),
      ),
    ]);
  }

  async registerPlugins(pluginNames: Array<string>): Promise<void> {
    const plugins = pluginNames.map(pluginName =>
      pluginsUtil.getPlugin({
        monitor: this._monitor,
        pluginName,
      }),
    );
    const graph = plugins.reduce(
      (acc, plugin) =>
        acc.concat(plugin.dependencies.map(dep => [plugin.name, dep])),
      [],
    );

    const sorted = toposort(graph).reverse();
    const pluginNameToPlugin = plugins.reduce((acc, plugin) => {
      acc[plugin.name] = plugin;
      return acc;
    }, {});
    const noDepPlugins = plugins.filter(
      plugin => plugin.dependencies.length === 0,
    );
    await Promise.all(noDepPlugins.map(plugin => this._registerPlugin(plugin)));
    for (const pluginName of sorted) {
      const plugin = pluginNameToPlugin[pluginName];
      // The later plugins will fail with missing dependency
      if (plugin != null) {
        // eslint-disable-next-line
        await this._registerPlugin(pluginNameToPlugin[pluginName]);
      }
    }
  }

  async _registerPlugin(plugin: Plugin): Promise<void> {
    for (const dependency of plugin.dependencies) {
      if (this._plugins[dependency] == null) {
        throw new PluginDependencyNotMetError({
          plugin: plugin.name,
          dependency,
        });
      }
    }

    this._plugins[plugin.name] = plugin;
    this._resourcesManagers[plugin.name] = {};
    const resourcesManagers = await Promise.all(
      plugin.resourceTypes.map(async resourceType => {
        const masterResourceAdapter = await resourceType.createMasterResourceAdapter(
          {
            pluginManager: this,
            dataPath: this._getMasterResourceAdapterDataPath({
              plugin: plugin.name,
              resourceType: resourceType.name,
            }),
            binary: this._binary,
            portAllocator: this._portAllocator,
          },
        );
        const resourcesManager = new ResourcesManager({
          monitor: this._monitor,
          dataPath: this._getResourcesManagerDataPath({
            plugin: plugin.name,
            resourceType: resourceType.name,
          }),
          pluginManager: this,
          resourceType,
          masterResourceAdapter,
          portAllocator: this._portAllocator,
        });
        await resourcesManager.init();

        return { resourceType: resourceType.name, resourcesManager };
      }),
    );
    plugin.createHooks.forEach(
      ({ plugin: pluginName, resourceType: resourceTypeName, hook }) => {
        this.getResourcesManager({
          plugin: pluginName,
          resourceType: resourceTypeName,
        }).addCreateHook(hook);
      },
    );
    await this._ready.write(plugin.name);
    resourcesManagers.forEach(({ resourceType, resourcesManager }) => {
      this._resourcesManagers[plugin.name][resourceType] = resourcesManager;
    });
    this.plugins$.next(plugin.name);
    this._update$.next();
  }

  getResourcesManager({
    plugin: pluginName,
    resourceType: resourceTypeName,
  }: {|
    plugin: string,
    resourceType: string,
  |}): ResourcesManager<*, *> {
    const plugin = this._plugins[pluginName];
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

    return this._resourcesManagers[pluginName][resourceTypeName];
  }

  _getResourcesManagerDataPath(options: {|
    plugin: string,
    resourceType: string,
  |}): string {
    return path.resolve(this._getPluginPath(options), MANAGER_PATH);
  }

  _getMasterResourceAdapterDataPath(options: {|
    plugin: string,
    resourceType: string,
  |}): string {
    return path.resolve(this._getPluginPath(options), MASTER_PATH);
  }

  _getPluginPath({
    plugin,
    resourceType,
  }: {|
    plugin: string,
    resourceType: string,
  |}): string {
    return path.resolve(
      this._dataPath,
      pluginsUtil.cleanPluginName({ pluginName: plugin }),
      resourceType,
    );
  }

  getDebug(): DescribeTable {
    return [
      ['Binary', `${this._binary.cmd} ${this._binary.firstArgs.join(' ')}`],
      [
        'Port Allocator',
        { type: 'describe', table: this._portAllocator.getDebug() },
      ],
      [
        'Resources Managers',
        { type: 'describe', table: this._getResourcesManagersDebug() },
      ],
    ];
  }

  _getResourcesManagersDebug(): DescribeTable {
    return utils
      .entries(this._resourcesManagers)
      .map(([pluginName, resourceTypeManagers]) => [
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
