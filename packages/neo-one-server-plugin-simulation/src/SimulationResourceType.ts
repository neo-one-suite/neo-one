import {
  CRUD,
  DeleteCRUD,
  DescribeCRUD,
  DescribeTable,
  GetCRUD,
  ListTable,
  MasterResourceAdapter,
  MasterResourceAdapterOptions,
  ResourceState,
  ResourceType,
  StartCRUD,
  StopCRUD,
} from '@neo-one/server-plugin';
import _ from 'lodash';
import { constants } from './constants';
import { CreateSimulationCRUD } from './crud';
import { MasterSimulationResourceAdapter } from './MasterSimulationResourceAdapter';
import { SimulationPlugin } from './SimulationPlugin';
import { Language } from './types';
export interface Simulation {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
  readonly simulationPackage: string;
}
export interface SimulationResourceOptions {
  readonly simulationPackage?: string;
  readonly simulationPath?: string;
  readonly language?: Language;
}

export class SimulationResourceType extends ResourceType<Simulation, SimulationResourceOptions> {
  public constructor({ plugin }: { readonly plugin: SimulationPlugin }) {
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

  public async createMasterResourceAdapter(
    options: MasterResourceAdapterOptions,
  ): Promise<MasterResourceAdapter<Simulation, SimulationResourceOptions>> {
    return new MasterSimulationResourceAdapter({
      resourceType: this,
      pluginManager: options.pluginManager,
    });
  }

  public getCRUD(): CRUD<Simulation, SimulationResourceOptions> {
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

  public getListTable(resources: ReadonlyArray<Simulation>): ListTable {
    return [['Name', 'Simulation']].concat(
      _.sortBy(resources, (resource) => resource.name).map((resource) => [
        resource.baseName,
        resource.simulationPackage,
      ]),
    );
  }

  public getDescribeTable(resource: Simulation): DescribeTable {
    return [['Name', resource.name], ['Simulation', resource.simulationPackage]];
  }
}
