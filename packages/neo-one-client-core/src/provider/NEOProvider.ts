import { NetworkType } from '@neo-one/client-common';
import { DataProviderOptions } from './DataProviderBase';
import { NEODataProvider } from './NEODataProvider';
import { ProviderBase } from './ProviderBase';

/**
 * Implements the `Provider` interface expected by a `LocalUserAccountProvider` using a NEO node.
 */
export class NEOProvider extends ProviderBase<NEODataProvider> {
  public constructor(options: ReadonlyArray<DataProviderOptions | NEODataProvider> = []) {
    super();
    const networks = options.map((opts) => {
      this.mutableProviders[opts.network] = opts instanceof NEODataProvider ? opts : new NEODataProvider(opts);

      return opts.network;
    });

    this.networksInternal$.next(networks);
  }

  protected createDataProvider(options: { readonly network: NetworkType; readonly rpcURL: string }): NEODataProvider {
    return new NEODataProvider(options);
  }
}
