import { DeveloperProvider, PrivateNetworkSettings } from './types';

export class DeveloperClient {
  private readonly developerProvider: DeveloperProvider;

  public constructor(developerProvider: DeveloperProvider) {
    this.developerProvider = developerProvider;
  }

  public async runConsensusNow(): Promise<void> {
    await this.developerProvider.runConsensusNow();
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    await this.developerProvider.updateSettings(options);
  }

  public async getSettings(): Promise<PrivateNetworkSettings> {
    return this.developerProvider.getSettings();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardOffset(seconds);
    await this.developerProvider.runConsensusNow();
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardToTime(seconds);
    await this.developerProvider.runConsensusNow();
  }

  public async reset(): Promise<void> {
    await this.developerProvider.reset();
  }
}
