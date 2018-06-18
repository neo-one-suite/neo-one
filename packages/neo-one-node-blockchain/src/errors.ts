import { CustomError } from '@neo-one/utils';

export class GenesisBlockNotRegisteredError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Genesis block was not registered with storage.');
    this.code = 'GENESIS_BLOCK_NOT_REGISTERED';
  }
}

export class ScriptVerifyError extends CustomError {
  public readonly code: string;

  public constructor(message: string) {
    super(message);
    this.code = 'SCRIPT_VERIFY';
  }
}

export class WitnessVerifyError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Witness verification failed.');
    this.code = 'WITNESS_VERIFY';
  }
}

export class UnknownVerifyError extends CustomError {
  public readonly code: string = 'UNKNOWN_VERIFY';
}

export class InvalidClaimError extends CustomError {
  public readonly code: string = 'INVALID_CLAIM';
}

export class CoinClaimedError extends CustomError {
  public readonly code: string = 'COIN_CLAIMED';
}

export class CoinUnspentError extends CustomError {
  public readonly code: string = 'COIN_UNSPENT';
}
