import { NetworkDefinition, Wallet } from './types';

export const genClient = ({
  localDevNetworkName,
  localDevNetworkPort,
  wallets,
  networks,
}: {
  readonly localDevNetworkName: string;
  readonly localDevNetworkPort: number;
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

const getDefaultUserAccountProviders = (provider) => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore(new LocalMemoryStore()),
    provider,
  }),
});

const isLocalUserAccountProvider = (userAccountProvider) =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = (getUserAccountProvidersOrHost) => {
  let getUserAccountProviders = getDefaultUserAccountProviders;
  let host = 'localhost'
  if (typeof getUserAccountProvidersOrHost === 'string') {
    host = getUserAccountProvidersOrHost;
  } else if (getUserAccountProvidersOrHost !== undefined) {
    getUserAccountProviders = getUserAccountProvidersOrHost;
  }
  const providers = [
    ${networks
      .filter(({ name }) => name !== localDevNetworkName)
      .map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`)
      .join('\n    ')}
  ];
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    providers.push(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: \`http://\${host}:${localDevNetworkPort}/rpc\` }));
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

export const createDeveloperClients = (host = 'localhost') => ({${networks
    .filter(({ name, dev }) => dev && name !== localDevNetworkName)
    .map(
      ({ name, rpcURL }) =>
        `\n  '${name}': new DeveloperClient(new NEOONEDataProvider({ network: '${name}', rpcURL: '${rpcURL}' })),`,
    )
    .join('')}
  '${localDevNetworkName}': new DeveloperClient(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: \`http://\${host}:${localDevNetworkPort}/rpc\` })),
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
  getUserAccountProvidersOrHost?: string | ((provider: NEOONEProvider) => TUserAccountProviders),
) => Client<TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : never, TUserAccountProviders>;

export const createDeveloperClients: (host?: string) => DeveloperClients;
`,
});
