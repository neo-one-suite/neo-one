/* @flow */
import fs from 'fs-extra';

import Provider from './Provider';

import type { Environment } from '../types';

export default class MultiProvider extends Provider {
  _primary: Provider;
  _other: Array<Provider>;
  _environment: Environment;

  constructor({
    primary,
    other,
    environment,
  }: {|
    primary: Provider,
    other: Array<Provider>,
    environment: Environment,
  |}) {
    super();
    this._primary = primary;
    this._other = other;
    this._environment = environment;
  }

  async restore(): Promise<void> {
    await this._primary.restore();
  }

  async backup(): Promise<void> {
    const providers = [this._primary].concat(this._other);
    for (const provider of providers) {
      /* eslint-disable */
      await provider.backup();
      await fs.remove(this._environment.tmpPath);
      await fs.ensureDir(this._environment.tmpPath);
      /* eslint-enable */
    }
  }
}
