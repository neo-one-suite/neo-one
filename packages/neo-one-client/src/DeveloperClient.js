/* @flow */
import type { DeveloperProvider, Options } from './types';

export default class DeveloperClient {
  +_developerProvider: DeveloperProvider;

  constructor(developerProvider: DeveloperProvider) {
    this._developerProvider = developerProvider;
  }

  async runConsensusNow(): Promise<void> {
    await this._developerProvider.runConsensusNow();
  }

  async updateSettings(options: Options): Promise<void> {
    await this._developerProvider.updateSettings(options);
  }
}
