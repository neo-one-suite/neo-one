import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const CouldNotLoadSimulationError = makeErrorWithCode(
  'COULD_NOT_LOAD_SIMULATION',
  (simulationPackage: string) =>
    `Could not load simulation ${simulationPackage}. Is it installed? ` +
    `Try running 'npm install -g ${simulationPackage}'.`,
);
