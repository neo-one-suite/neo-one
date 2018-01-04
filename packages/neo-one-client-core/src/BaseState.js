/* @flow */
export default class BaseState {
  static VERSION = 0;
  version: number;

  constructor({ version: versionIn }: { version?: number }) {
    this.version = versionIn == null ? this.constructor.VERSION : versionIn;
  }
}
