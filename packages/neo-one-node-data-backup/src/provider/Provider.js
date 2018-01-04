/* @flow */
export default class Provider {
  async restore(): Promise<void> {
    throw new Error('Not Implemented');
  }

  async backup(): Promise<void> {
    throw new Error('Not Implemented');
  }
}
