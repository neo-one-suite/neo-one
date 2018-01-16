/* @flow */
export default class Provider {
  async canRestore(): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  async restore(): Promise<void> {
    throw new Error('Not Implemented');
  }

  async backup(): Promise<void> {
    throw new Error('Not Implemented');
  }
}
