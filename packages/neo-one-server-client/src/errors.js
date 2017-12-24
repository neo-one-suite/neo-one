/* @flow */
// eslint-disable-next-line
export class ReadError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
