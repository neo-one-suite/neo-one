/* @flow */
export class NotFoundError extends Error {
  code: string;

  constructor() {
    super('Not found');
    this.code = 'NOT_FOUND';
  }
}

export class UnknownTypeError extends Error {
  code: string;

  constructor() {
    super('Unknown type');
    this.code = 'UNKNOWN_TYPE';
  }
}

export class KeyNotFoundError extends Error {
  code: string;

  constructor(keyString: string) {
    super(`Key ${keyString} not found in database`);
    this.code = 'KEY_NOT_FOUND';
  }
}
