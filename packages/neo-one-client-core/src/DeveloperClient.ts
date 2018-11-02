import { DeveloperProvider, PrivateNetworkSettings } from '@neo-one/client-common';
import { enqueuePostPromiseJob } from '@neo-one/utils';

export class DeveloperClient {
  private readonly developerProvider: DeveloperProvider;
  private mutableRunConsensusNow: Promise<void> | undefined;

  public constructor(developerProvider: DeveloperProvider) {
    this.developerProvider = developerProvider;
  }

  public async runConsensusNow(): Promise<void> {
    if (this.mutableRunConsensusNow === undefined) {
      this.mutableRunConsensusNow = new Promise((resolve, reject) => {
        enqueuePostPromiseJob(() => {
          this.runConsensusNowInternal()
            .then(resolve)
            .catch(reject);
        });
      });
    }

    return this.mutableRunConsensusNow;
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    await this.developerProvider.updateSettings(options);
  }

  public async getSettings(): Promise<PrivateNetworkSettings> {
    return this.developerProvider.getSettings();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardOffset(seconds);
    await this.runConsensusNow();
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardToTime(seconds);
    await this.runConsensusNow();
  }

  public async reset(): Promise<void> {
    await this.developerProvider.reset();
  }

  private async runConsensusNowInternal(): Promise<void> {
    await this.developerProvider.runConsensusNow();
    this.mutableRunConsensusNow = undefined;
  }
}
