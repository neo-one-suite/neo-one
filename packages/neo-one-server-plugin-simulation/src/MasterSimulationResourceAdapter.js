/* @flow */
import {
  type PluginManager,
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type TaskList,
} from '@neo-one/server-plugin';

import SimulationResourceAdapter, {
  type SimulationResourceAdapterInitOptions,
} from './SimulationResourceAdapter';
import type SimulationResourceType, {
  Simulation,
  SimulationResourceOptions,
} from './SimulationResourceType';

export default class MasterSimulationResourceAdapter {
  _resourceType: SimulationResourceType;
  _pluginManager: PluginManager;

  constructor({
    resourceType,
    pluginManager,
  }: {|
    resourceType: SimulationResourceType,
    pluginManager: PluginManager,
  |}) {
    this._resourceType = resourceType;
    this._pluginManager = pluginManager;
  }

  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Simulation, SimulationResourceOptions>> {
    return SimulationResourceAdapter.init(
      this._getResourceAdapterOptions(options),
    );
  }

  createResourceAdapter(
    adapterOptions: ResourceAdapterOptions,
    options: SimulationResourceOptions,
  ): TaskList {
    return SimulationResourceAdapter.create(
      this._getResourceAdapterOptions(adapterOptions),
      options,
    );
  }

  _getResourceAdapterOptions(
    options: ResourceAdapterOptions,
  ): SimulationResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      resourceType: this._resourceType,
      pluginManager: this._pluginManager,
    };
  }
}
