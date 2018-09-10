import { InteractiveCLIArgs } from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import * as path from 'path';
import { CouldNotLoadSimulationError } from './errors';
import { SimulationConfig } from './types';

const requireResolve = (pkg: string, requirePath: string) => path.resolve(require.resolve(pkg), requirePath);

const setupSimulation = async (pkg: string, dirName: string, config: SimulationConfig) => {
  const simulationPath = path.resolve(process.cwd(), dirName);
  await fs.ensureDir(simulationPath);
  await fs.copy(requireResolve(pkg, config.templateDir), simulationPath);
};

const tryRequireSimulation = (pkg: string): SimulationConfig => {
  try {
    const config = require(pkg);

    return config != undefined && config.default != undefined ? config.default : config;
  } catch {
    throw new CouldNotLoadSimulationError(pkg);
  }
};

export const createCommand = ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal
    .command('create simulation <dirName> <simulation>', 'Create a NEO•ONE simulation.')
    .action(async (args) => {
      const dirName = args.dirName;
      const pkg = args.simulation;
      cli.print('Loading simulation package...');
      const config = tryRequireSimulation(pkg);
      cli.print('Setting up simulation...');
      await setupSimulation(pkg, dirName, config);
      cli.print(`Created simulation in ${dirName}.`);
    });
