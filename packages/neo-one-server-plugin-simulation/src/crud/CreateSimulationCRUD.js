/* @flow */
import { type GetCLIResourceOptions, CreateCRUD } from '@neo-one/server-plugin';

import path from 'path';

import type SimulationResourceType, {
  Simulation,
  SimulationResourceOptions,
} from '../SimulationResourceType';

export default class CreateSimulationCRUD extends CreateCRUD<
  Simulation,
  SimulationResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: SimulationResourceType |}) {
    super({
      resourceType,
      extraArgs: ['<simulationPackage>'],
      startOnCreate: true,
    });
  }

  async getCLIResourceOptions({
    args,
  }: GetCLIResourceOptions): Promise<SimulationResourceOptions> {
    const { name, simulationPackage } = args;

    return {
      simulationPackage,
      simulationPath: path.resolve(process.cwd(), name),
    };
  }
}
