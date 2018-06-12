import { CustomError } from '@neo-one/utils';

export class InvalidFormatError extends CustomError {
  public readonly code: string;

  constructor(reason?: string) {
    super(`Invalid format${reason == null ? '.' : `: ${reason}`}`);
    this.code = 'INVALID_FORMAT';
  }
}

export class VerifyError extends CustomError {
  public readonly code: string;

  constructor(reason: string) {
    super(`Verification failed: ${reason}`);
    this.code = 'VERIFY';
  }
}

export class UnsignedBlockError extends CustomError {
  public readonly code: string;

  constructor() {
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
