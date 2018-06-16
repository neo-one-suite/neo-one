import { CustomError } from '@neo-one/utils';

export class NotFoundError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Not found');
    this.code = 'NOT_FOUND';
  }
}

export class UnknownTypeError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Unknown type');
    this.code = 'UNKNOWN_TYPE';
  }
}

export class KeyNotFoundError extends CustomError {
  public readonly code: string;

  public constructor(keyString: string) {
    super(`Key ${keyString} not found in database`);
    this.code = 'KEY_NOT_FOUND';
  }
}

export class UnknownChangeTypeError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Unknown change type');
    this.code = 'UNKNOWN_CHANGE_TYPE';
  }
}
