import { DeveloperProvider, PrivateNetworkSettings } from '@neo-one/client-common';

/**
 * Client which controls a development network.
 */
export class DeveloperClient {
  private readonly developerProvider: DeveloperProvider;
  private mutableRunConsensusNow: Promise<void> | undefined;

  public constructor(developerProvider: DeveloperProvider) {
    this.developerProvider = developerProvider;
  }

  /**
   * Trigger consensus to run immediately.
   */
  public async runConsensusNow(): Promise<void> {
    if (this.mutableRunConsensusNow === undefined) {
      this.mutableRunConsensusNow = this.runConsensusNowInternal();
    }

    return this.mutableRunConsensusNow;
  }

  /**
   * Update settings for the private network.
   */
  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    await this.developerProvider.updateSettings(options);
  }

  /**
   * Get the current settings of the private network.
   */
  public async getSettings(): Promise<PrivateNetworkSettings> {
    return this.developerProvider.getSettings();
  }

  /**
   * Fast forward the local network by `seconds` into the future.
   */
  public async fastForwardOffset(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardOffset(seconds);
    await this.runConsensusNow();
  }

  /**
   * Fast forward to a particular unix timestamp in the future.
   */
  public async fastForwardToTime(seconds: number): Promise<void> {
    await this.developerProvider.fastForwardToTime(seconds);
    await this.runConsensusNow();
  }

  /**
   * Reset the local network to it's initial state starting at the genesis block.
   */
  public async reset(): Promise<void> {
    await this.developerProvider.reset();
  }

  /**
   * Fetch the NEO tracker URL for the project.
   */
  public async getNEOTrackerURL(): Promise<string | undefined> {
    return this.developerProvider.getNEOTrackerURL();
  }

  /**
   * Reset the project this network is associated with to it's initial state.
   */
  public async resetProject(): Promise<void> {
    await this.developerProvider.resetProject();
  }

  private async runConsensusNowInternal(): Promise<void> {
    await this.developerProvider.runConsensusNow();
    this.mutableRunConsensusNow = undefined;
  }
}

/**
 * An object of `DeveloperClient`s.
 */
export interface DeveloperClients {
  readonly [network: string]: DeveloperClient;
}
