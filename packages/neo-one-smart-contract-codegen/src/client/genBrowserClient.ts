import { NetworkDefinition, Wallet } from './types';

export const genBrowserClient = ({
  localDevNetworkName,
  wallets,
  networks,
}: {
  readonly localDevNetworkName: string;
  readonly wallets: ReadonlyArray<Wallet>;
  readonly networks: ReadonlyArray<NetworkDefinition>;
}) => ({
  js: `
import {
  Client,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEDataProvider,
} from '@neo-one/client';
import { getJSONRPCLocalProviderManager } from '@neo-one/local-singleton';

const getDefaultUserAccountProviders = (provider) => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore(new LocalMemoryStore()),
    provider,
  }),
});

const isLocalUserAccountProvider = (userAccountProvider) =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = (getUserAccountProviders = getDefaultUserAccountProviders) => {
  const providers = [
    ${networks
      .filter(({ name }) => name !== localDevNetworkName)
      .map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`)
      .join('\n    ')}
  ];
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    providers.push(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: getJSONRPCLocalProviderManager() }));
  }
  const provider = new NEOONEProvider(providers);
  const userAccountProviders = getUserAccountProviders(provider);
  const localUserAccountProviders = Object.values(userAccountProviders).filter(isLocalUserAccountProvider);
  const localUserAccountProvider = localUserAccountProviders.find(
    (userAccountProvider) => userAccountProvider.keystore instanceof LocalKeyStore,
  );
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    if (localUserAccountProvider !== undefined) {
      const localKeyStore = localUserAccountProvider.keystore;
      if (localKeyStore instanceof LocalKeyStore) {
        Promise.all([
          ${wallets
            .map(
              ({ name, wif }) =>
                `localKeyStore.addUserAccount({ network: '${localDevNetworkName}', name: '${name}', privateKey: '${wif}' }),`,
            )
            .join('\n          ')}
        ]).catch(() => {
          // do nothing
        });
      }
    }
  }

  return new Client(userAccountProviders);
};

export const createDeveloperClients = () => ({${networks
    .filter(({ name, dev }) => dev && name !== localDevNetworkName)
    .map(
      ({ name, rpcURL }) =>
        `\n  '${name}': new DeveloperClient(new NEOONEDataProvider({ network: '${name}', rpcURL: '${rpcURL}' })),`,
    )
    .join('')}
  '${localDevNetworkName}': new DeveloperClient(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: getJSONRPCLocalProviderManager() })),
});
  `,
  ts: `
import {
  DeveloperClients,
  LocalKeyStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  UserAccountProviders,
} from '@neo-one/client';

export interface DefaultUserAccountProviders {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>,
}

export const createClient: <TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders>(
  getUserAccountProviders?: (provider: NEOONEProvider) => TUserAccountProviders,
) => Client<TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : never, TUserAccountProviders>;

export const createDeveloperClients: () => DeveloperClients;
`,
});
