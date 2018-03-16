/* @flow */
import fs from 'fs-extra';

import type { Monitor } from '@neo-one/monitor';

import Provider from './Provider';

import type { Environment } from '../types';

export default class MultiProvider extends Provider {
  _providers: Array<Provider>;
  _environment: Environment;

  constructor({
    providers,
    environment,
  }: {|
    providers: Array<Provider>,
    environment: Environment,
  |}) {
    super();
    this._providers = providers;
    this._environment = environment;
  }

  async restore(monitor: Monitor): Promise<void> {
    for (const provider of this._providers) {
      // eslint-disable-next-line
      const canRestore = await provider.canRestore();
      if (canRestore) {
        // eslint-disable-next-line
        await provider.restore(monitor);
        break;
      }
    }
  }

  async backup(monitor: Monitor): Promise<void> {
    for (const provider of this._providers) {
      // eslint-disable-next-line
      await provider.backup(monitor);
      // eslint-disable-next-line
      await fs.remove(this._environment.tmpPath);
      // eslint-disable-next-line
      await fs.ensureDir(this._environment.tmpPath);
    }
  }
}
