import { CustomError } from '@neo-one/utils';
import { ContractParameterTypeJSON } from './contractParameter';
import { ContractParameter } from './types';

export class InvalidFormatError extends CustomError {
  public readonly code: string;

  public constructor(reason?: string) {
    super(`Invalid format${reason === undefined ? '.' : `: ${reason}`}`);
    this.code = 'INVALID_FORMAT';
  }
}

export class VerifyError extends CustomError {
  public readonly code: string;

  public constructor(reason: string) {
    super(`Verification failed: ${reason}`);
    this.code = 'VERIFY';
  }
}

export class UnsignedBlockError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Block script does not exist because it has not been signed.');
    this.code = 'UNSIGNED_BLOCK';
  }
}

export class TooManyPublicKeysError extends CustomError {
  public readonly code: string = 'TOO_MANY_PUBLIC_KEYS';
}

export class InvalidNumberOfKeysError extends CustomError {
  public readonly code: string = 'INVALID_NUMBER_OF_KEYS';
}

export class InvalidContractParameterError extends CustomError {
  public readonly parameter: ContractParameter;
  public readonly expected: ReadonlyArray<ContractParameterTypeJSON>;
  public readonly code: string;

  public constructor(parameter: ContractParameter, expected: ReadonlyArray<ContractParameterTypeJSON>) {
    super(`Expected one of ${JSON.stringify(expected)} ` + `ContractParameterTypes, found ${parameter.type}`);

    this.parameter = parameter;
    this.expected = expected;
    this.code = 'INVALID_CONTRACT_PARAMETER';
  }
}
