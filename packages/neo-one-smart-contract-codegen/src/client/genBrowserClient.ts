import { NetworkDefinition, Wallet } from './types';

export const genBrowserClient = ({
  localDevNetworkName,
  wallets,
  networks,
}: {
  readonly localDevNetworkName: string;
  readonly wallets: ReadonlyArray<Wallet>;
  readonly networks: ReadonlyArray<NetworkDefinition>;
}) => {
  const getDefaultUserAccountProvider = `({
    memory: new LocalUserAccountProvider({
      keystore: new LocalKeyStore(new LocalMemoryStore()),
      provider,
    }),
  });`;

  const createClient = `  const providers = [
  ${networks
    .filter(({ name }) => name !== localDevNetworkName)
    .map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`)
    .join('\n    ')}
];
if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  providers.push({ network: '${localDevNetworkName}', rpcURL: getJSONRPCLocalProviderManager() });
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
      addLocalKeysSync([
        ${wallets
          .map(({ name, wif }) => `{ network: '${localDevNetworkName}', name: '${name}', privateKey: '${wif}' },`)
          .join('\n          ')}
      ], localKeyStore);
    }
  }
}`;

  const createDeveloperClients = `({${networks
    .filter(({ name, dev }) => dev && name !== localDevNetworkName)
    .map(
      ({ name, rpcURL }) =>
        `\n  '${name}': new DeveloperClient(new NEOONEDataProvider({ network: '${name}', rpcURL: '${rpcURL}' })),`,
    )
    .join('')}
'${localDevNetworkName}': new DeveloperClient(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: getJSONRPCLocalProviderManager() })),
});`;

  return {
    js: `
import {
  addLocalKeysSync,
  Client,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEDataProvider,
} from '@neo-one/client';
import { getJSONRPCLocalProviderManager } from '@neo-one/local-singleton';

const getDefaultUserAccountProviders = (provider) => ${getDefaultUserAccountProvider}

const isLocalUserAccountProvider = (userAccountProvider) =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = (getUserAccountProviders = getDefaultUserAccountProviders) => {
  ${createClient}

  return new Client(userAccountProviders);
};

export const createDeveloperClients = () => ${createDeveloperClients}
  `,
    ts: `
import {
  addLocalKeysSync,
  Client,
  DeveloperClient,
  DeveloperClients,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEDataProvider,
  UserAccountProviders,
} from '@neo-one/client';
import { getJSONRPCLocalProviderManager } from '@neo-one/local-singleton';

export interface DefaultUserAccountProviders {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>,
}

const getDefaultUserAccountProviders = (provider: NEOONEProvider) => ${getDefaultUserAccountProvider}

const isLocalUserAccountProvider = (userAccountProvider: any): userAccountProvider is LocalUserAccountProvider =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = <TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders>(
  getUserAccountProviders: (provider: NEOONEProvider) => TUserAccountProviders = getDefaultUserAccountProviders,
): Client<TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : any, TUserAccountProviders> => {
  ${createClient}

  return new Client(userAccountProviders as any);
}

export const createDeveloperClients = (): DeveloperClients => ${createDeveloperClients}
`,
  };
};
