/* @flow */
export class GenesisBlockNotRegisteredError extends Error {
  code: string;

  constructor() {
    super('Genesis block was not registered with storage.');
    this.code = 'GENESIS_BLOCK_NOT_REGISTERED';
  }
}

export class ScriptVerifyError extends Error {
  code: string;

  constructor() {
    super('Script verification failed.');
    this.code = 'SCRIPT_VERIFY';
  }
}

export class WitnessVerifyError extends Error {
  code: string;

  constructor() {
    super('Witness verification failed.');
    this.code = 'WITNESS_VERIFY';
  }
}
