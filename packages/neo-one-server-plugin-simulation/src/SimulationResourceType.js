/* @flow */
import {
  type DescribeTable,
  type ListTable,
  type ResourceState,
  type MasterResourceAdapter,
  type MasterResourceAdapterOptions,
  CRUD,
  DeleteCRUD,
  DescribeCRUD,
  GetCRUD,
  ResourceType,
  StartCRUD,
  StopCRUD,
} from '@neo-one/server-plugin';

import _ from 'lodash';

import { CreateSimulationCRUD } from './crud';
import type { Language } from './types';
import MasterSimulationResourceAdapter from './MasterSimulationResourceAdapter';
import type SimulationPlugin from './SimulationPlugin';

import constants from './constants';

export type Simulation = {|
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
  simulationPackage: string,
|};
export type SimulationResourceOptions = {
  simulationPackage?: string,
  simulationPath?: string,
  language?: Language,
};

export default class SimulationResourceType extends ResourceType<
  Simulation,
  SimulationResourceOptions,
> {
  constructor({ plugin }: {| plugin: SimulationPlugin |}) {
    super({
      plugin,
      name: constants.SIMULATION_RESOURCE_TYPE,
      names: {
        capital: 'Simulation',
        capitalPlural: 'Simulations',
        lower: 'simulation',
        lowerPlural: 'simulations',
      },
    });
  }

  async createMasterResourceAdapter(
    options: MasterResourceAdapterOptions,
  ): Promise<MasterResourceAdapter<Simulation, SimulationResourceOptions>> {
    return new MasterSimulationResourceAdapter({
      resourceType: this,
      pluginManager: options.pluginManager,
    });
  }

  getCRUD(): CRUD<Simulation, SimulationResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: new StartCRUD({ resourceType: this }),
      stop: new StopCRUD({ resourceType: this }),
      delete: new DeleteCRUD({ resourceType: this }),
      create: new CreateSimulationCRUD({ resourceType: this }),
      get: new GetCRUD({ resourceType: this }),
      describe: new DescribeCRUD({ resourceType: this }),
    });
  }

  getListTable(resources: Array<Simulation>): ListTable {
    return [['Name', 'Simulation']].concat(
      _.sortBy(resources, resource => resource.name).map(resource => [
        resource.baseName,
        resource.simulationPackage,
      ]),
    );
  }

  getDescribeTable(resource: Simulation): DescribeTable {
    return [
      ['Name', resource.name],
      ['Simulation', resource.simulationPackage],
    ];
  }
}
