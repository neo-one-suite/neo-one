/* @flow */
export class CouldNotLoadSimulationError extends Error {
  code: string;

  constructor(simulationPackage: string) {
    super(
      `Could not load simulation ${simulationPackage}. Is it installed? ` +
        `Try running 'npm install -g ${simulationPackage}'.`,
    );
    this.code = 'COULD_NOT_LOAD_SIMULATION';
  }
}

export class InvalidSimulationConfigError extends Error {
  code: string;

  constructor(reason: string) {
    super(`Invalid SimulationConfig: ${reason}`);
    this.code = 'INVALID_SIMULATION_CONFIG';
  }
}

export class InvalidLanguageError extends Error {
  code: string;

  constructor(language: string) {
    super(`Invalid language specified: ${language}`);
    this.code = 'INVALID_LANGUAGE';
  }
}

export class SimulationPackageRequiredError extends Error {
  code: string;

  constructor() {
    super('Simulation package is required.');
    this.code = 'SIMULATION_PACKAGE_REQUIRED';
  }
}

export class SimulationPathRequiredError extends Error {
  code: string;

  constructor() {
    super('Simulation path is required.');
    this.code = 'SIMULATION_PATH_REQUIRED';
  }
}
