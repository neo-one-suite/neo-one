import { DeveloperProvider, Options } from './types';

export class DeveloperClient {
  private readonly developerProvider: DeveloperProvider;

  constructor(developerProvider: DeveloperProvider) {
    this.developerProvider = developerProvider;
  }

  public async runConsensusNow(): Promise<void> {
    await this.developerProvider.runConsensusNow();
  }

  public async updateSettings(options: Options): Promise<void> {
    await this.developerProvider.updateSettings(options);
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardOffset(seconds);
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardToTime(seconds);
  }

  public async reset(): Promise<void> {
    await this.developerProvider.reset();
  }
}
