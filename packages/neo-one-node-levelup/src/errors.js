/* @flow */
import { CustomError } from '@neo-one/utils';

export class NotFoundError extends CustomError {
  code: string;

  constructor() {
    super('Not found');
    this.code = 'NOT_FOUND';
  }
}

export class UnknownTypeError extends CustomError {
  code: string;

  constructor() {
    super('Unknown type');
    this.code = 'UNKNOWN_TYPE';
  }
}

export class KeyNotFoundError extends CustomError {
  code: string;

  constructor(keyString: string) {
    super(`Key ${keyString} not found in database`);
    this.code = 'KEY_NOT_FOUND';
  }
}
