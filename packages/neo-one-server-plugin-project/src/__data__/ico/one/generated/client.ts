// tslint:disable
/* eslint-disable */
import {
  Client,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEOneDataProvider,
  OneClient,
  NEOONEDataProviderOptions,
  UserAccountProvider,
} from '@neo-one/client';
import { projectID } from './projectID';

export type DefaultUserAccountProviders = {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
};
const getDefaultUserAccountProviders = (provider: NEOONEProvider): DefaultUserAccountProviders => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore({ store: new LocalMemoryStore() }),
    provider,
  }),
});

const isLocalUserAccountProvider = (
  userAccountProvider: UserAccountProvider,
): userAccountProvider is LocalUserAccountProvider<any, any> => userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = <
  TUserAccountProviders extends { readonly [K: string]: UserAccountProvider } = DefaultUserAccountProviders
>(
  getUserAccountProviders: (provider: NEOONEProvider) => TUserAccountProviders = getDefaultUserAccountProviders as any,
): Client<TUserAccountProviders> => {
  const providers: Array<NEOONEOneDataProvider | NEOONEDataProviderOptions> = [];
  if (process.env.NODE_ENV !== 'production') {
    providers.push(new NEOONEOneDataProvider({ network: 'local', projectID, port: 15495 }));
  }
  const provider = new NEOONEProvider(providers);

  const userAccountProviders = getUserAccountProviders(provider);
  const localUserAccountProviders = Object.values(userAccountProviders).filter(isLocalUserAccountProvider);
  const localUserAccountProvider = localUserAccountProviders.find(
    (userAccountProvider) => userAccountProvider.keystore instanceof LocalKeyStore,
  );

  if (process.env.NODE_ENV !== 'production') {
    if (localUserAccountProvider !== undefined) {
      const localKeyStore = localUserAccountProvider.keystore;
      if (localKeyStore instanceof LocalKeyStore) {
        localKeyStore
          .addAccount({
            network: 'local',
            name: 'master',
            privateKey: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
          })
          .catch(() => {
            // do nothing
          });
      }
    }
  }
  return new Client(userAccountProviders);
};

export const createDeveloperClients = (): { [network: string]: DeveloperClient } => ({
  local: new DeveloperClient(new NEOONEOneDataProvider({ network: 'local', projectID, port: 15495 })),
});

export const createOneClients = (): { [network: string]: OneClient } => ({
  local: new OneClient(15495),
});
