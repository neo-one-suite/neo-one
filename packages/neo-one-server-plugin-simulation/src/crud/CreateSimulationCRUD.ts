import { CreateCRUD, GetCLIResourceOptions } from '@neo-one/server-plugin';
import * as path from 'path';
import { Simulation, SimulationResourceOptions, SimulationResourceType } from '../SimulationResourceType';

export class CreateSimulationCRUD extends CreateCRUD<Simulation, SimulationResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: SimulationResourceType }) {
    super({
      resourceType,
      extraArgs: ['<simulationPackage>'],
      startOnCreate: true,
    });
  }

  public async getCLIResourceOptions({ args }: GetCLIResourceOptions): Promise<SimulationResourceOptions> {
    const { name, simulationPackage } = args;

    return {
      simulationPackage,
      simulationPath: path.resolve(process.cwd(), name),
    };
  }
}
