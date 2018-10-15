import { DeveloperClient, NEOONEDataProvider } from '@neo-one/client';
import { constants } from '@neo-one/local';
import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { WorkerManager } from '@neo-one/worker';
import { Builder } from './build';

export class BrowserLocalClient {
  public constructor(
    private readonly builderManager: WorkerManager<typeof Builder>,
    private readonly providerManager: WorkerManager<typeof JSONRPCLocalProvider>,
  ) {}

  public async getNEOTrackerURL(): Promise<string | undefined> {
    return undefined;
  }

  public async reset(): Promise<void> {
    const developerClient = new DeveloperClient(
      new NEOONEDataProvider({ network: constants.LOCAL_NETWORK_NAME, rpcURL: this.providerManager }),
    );
    await developerClient.reset();
    await developerClient.updateSettings({ secondsPerBlock: 15 });

    await this.build();
  }

  public async build(): Promise<void> {
    return this.builderManager.getInstance().then(async (builder) => builder.build());
  }
}
