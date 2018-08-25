import { makeErrorWithCode } from '@neo-one/utils';

export const CouldNotLoadSimulationError = makeErrorWithCode(
  'COULD_NOT_LOAD_SIMULATION',
  (simulationPackage: string) =>
    `Could not load simulation ${simulationPackage}. Is it installed? ` +
    `Try running 'npm install -g ${simulationPackage}'.`,
);
export const InvalidSimulationConfigError = makeErrorWithCode(
  'INVALID_SIMULATION_CONFIG',
  (reason: string) => `Invalid SimulationConfig: ${reason}`,
);
export const InvalidLanguageError = makeErrorWithCode(
  'INVALID_LANGUAGE',
  (language: string) => `Invalid language specified: ${language}`,
);
export const SimulationPackageRequiredError = makeErrorWithCode(
  'SIMULATION_PACKAGE_REQUIRED',
  () => 'Simulation package is required.',
);
export const SimulationPathRequiredError = makeErrorWithCode(
  'SIMULATION_PATH_REQUIRED',
  () => 'Simulation path is required.',
);
