import { CustomError } from '@neo-one/utils';

export class CouldNotLoadSimulationError extends CustomError {
  public readonly code: string;

  public constructor(simulationPackage: string) {
    super(
      `Could not load simulation ${simulationPackage}. Is it installed? ` +
        `Try running 'npm install -g ${simulationPackage}'.`,
    );

    this.code = 'COULD_NOT_LOAD_SIMULATION';
  }
}

export class InvalidSimulationConfigError extends CustomError {
  public readonly code: string;

  public constructor(reason: string) {
    super(`Invalid SimulationConfig: ${reason}`);
    this.code = 'INVALID_SIMULATION_CONFIG';
  }
}

export class InvalidLanguageError extends CustomError {
  public readonly code: string;

  public constructor(language: string) {
    super(`Invalid language specified: ${language}`);
    this.code = 'INVALID_LANGUAGE';
  }
}

export class SimulationPackageRequiredError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Simulation package is required.');
    this.code = 'SIMULATION_PACKAGE_REQUIRED';
  }
}

export class SimulationPathRequiredError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Simulation path is required.');
    this.code = 'SIMULATION_PATH_REQUIRED';
  }
}
