/* @flow */
import type { Monitor } from '@neo-one/monitor';

export default class Provider {
  async canRestore(): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  async restore(monitor: Monitor): Promise<void> {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  async backup(monitor: Monitor): Promise<void> {
    throw new Error('Not Implemented');
  }
}
