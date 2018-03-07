/* @flow */
import type { DeveloperProvider } from './types';

export default class DeveloperClient {
  +developerProvider: DeveloperProvider;

  constructor(developerProvider: DeveloperProvider) {
    this.developerProvider = developerProvider;
  }

  startConsensusNow(): void {
    this.developerProvider.startConsensusNow();
  }
}
