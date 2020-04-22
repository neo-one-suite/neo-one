import { NetworkType } from '@neo-one/client-common';
import { DataProviderOptions } from './DataProviderBase';
import { NEOONEDataProvider } from './NEOONEDataProvider';
import { ProviderBase } from './ProviderBase';

/**
 * Implements the `Provider` interface expected by a `LocalUserAccountProvider` using a NEO•ONE node.
 */
export class NEOONEProvider extends ProviderBase<NEOONEDataProvider> {
  public constructor(options: ReadonlyArray<DataProviderOptions | NEOONEDataProvider> = []) {
    super();
    const networks = options.map((opts) => {
      this.mutableProviders[opts.network] = opts instanceof NEOONEDataProvider ? opts : new NEOONEDataProvider(opts);

      return opts.network;
    });

    this.networksInternal$.next(networks);
  }

  protected createDataProvider(options: {
    readonly network: NetworkType;
    readonly rpcURL: string;
  }): NEOONEDataProvider {
    return new NEOONEDataProvider(options);
  }
}
