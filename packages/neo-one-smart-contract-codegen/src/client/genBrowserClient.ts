import { NetworkDefinition, Wallet } from './types';

export const genBrowserClient = ({
  localDevNetworkName,
  wallets,
  networks,
}: {
  readonly localDevNetworkName: string;
  readonly wallets: readonly Wallet[];
  readonly networks: readonly NetworkDefinition[];
}) => {
  const mutableImports = [
    'Client',
    'DeveloperClient',
    'LocalKeyStore',
    'LocalMemoryStore',
    'LocalUserAccountProvider',
    'NEOONEProvider',
    'NEOONEDataProvider',
  ];

  return {
    js: `
import { ${mutableImports.join(', ')} } from '@neo-one/client';
import { getBrowserLocalClient, getJSONRPCLocalProviderManager } from '@neo-one/local-singleton';

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
  providers.push(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: getJSONRPCLocalProviderManager() }));
  const provider = new NEOONEProvider(providers);
  const userAccountProviders = getUserAccountProviders(provider);
  const localUserAccountProviders = Object.keys(userAccountProviders).map((key) => userAccountProviders[key]).filter(isLocalUserAccountProvider);
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
              ({ name, privateKey }) =>
                `localKeyStore.addUserAccount({ network: '${localDevNetworkName}', name: '${name}', privateKey: '${privateKey}' }),`,
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

export const createLocalClients = () => ({
  '${localDevNetworkName}': getBrowserLocalClient(),
})
  `,
    ts: `
import { ${mutableImports.join(
      ', ',
    )}, LocalClient, NEOONEDataProviderOptions, UserAccountProvider, UserAccountProviders } from '@neo-one/client';
import { getBrowserLocalClient, getJSONRPCLocalProviderManager } from '@neo-one/local-singleton';

export type DefaultUserAccountProviders = {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>,
}
const getDefaultUserAccountProviders = (provider: NEOONEProvider): DefaultUserAccountProviders => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore(new LocalMemoryStore()),
    provider,
  }),
});

const isLocalUserAccountProvider = (userAccountProvider: UserAccountProvider): userAccountProvider is LocalUserAccountProvider<any, any> =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = <TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders>(
  getUserAccountProviders: (provider: NEOONEProvider) => TUserAccountProviders = getDefaultUserAccountProviders as any,
): Client<TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : never, TUserAccountProviders> => {
  const providers: Array<NEOONEDataProvider | NEOONEDataProviderOptions> = [
    ${networks
      .filter(({ name }) => name !== localDevNetworkName)
      .map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`)
      .join('\n    ')}
  ];
  providers.push(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: getJSONRPCLocalProviderManager() }));
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
              ({ name, privateKey }) =>
                `localKeyStore.addUserAccount({ network: '${localDevNetworkName}', name: '${name}', privateKey: '${privateKey}' }),`,
            )
            .join('\n          ')}
        ]).catch(() => {
          // do nothing
        });
      }
    }
  }
  return new Client(userAccountProviders);
}

export const createDeveloperClients = (): { [network: string]: DeveloperClient } => ({${networks
      .filter(({ name, dev }) => dev && name !== localDevNetworkName)
      .map(
        ({ name, rpcURL }) =>
          `\n  '${name}': new DeveloperClient(new NEOONEDataProvider({ network: '${name}', rpcURL: '${rpcURL}' })),`,
      )
      .join('')}
  '${localDevNetworkName}': new DeveloperClient(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: getJSONRPCLocalProviderManager() })),
});

export const createLocalClients = (): { [network: string]: LocalClient } => ({
  '${localDevNetworkName}': getBrowserLocalClient(),
})
`,
  };
};
