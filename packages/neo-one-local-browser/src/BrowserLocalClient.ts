import { DeveloperClient, NEOONEDataProvider } from '@neo-one/client';
import { constants } from '@neo-one/local';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { Builder, BuildResult } from './build';

export class BrowserLocalClient {
  public constructor(private readonly builder: Builder, private readonly provider: JSONRPCLocalProvider) {}

  public async getNEOTrackerURL(): Promise<string | undefined> {
    return undefined;
  }

  public async reset(): Promise<void> {
    const developerClient = new DeveloperClient(
      new NEOONEDataProvider({ network: constants.LOCAL_NETWORK_NAME, rpcURL: this.provider }),
    );
    await developerClient.reset();
    await developerClient.updateSettings({ secondsPerBlock: 15 });

    await this.build();
  }

  public async build(): Promise<BuildResult> {
    return this.builder.build();
  }
}
