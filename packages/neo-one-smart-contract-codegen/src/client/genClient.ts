import { getRelativeImport } from '../utils';
import { NetworkDefinition, Wallet } from './types';

export const genClient = ({
  localDevNetworkName,
  wallets,
  networks,
  clientPath,
  projectIDPath,
  httpServerPort,
  browser,
}: {
  readonly localDevNetworkName: string;
  readonly wallets: readonly Wallet[];
  readonly networks: readonly NetworkDefinition[];
  readonly clientPath: string;
  readonly projectIDPath: string;
  readonly httpServerPort: number;
  readonly browser: boolean;
}) => {
  const mutableImports = [
    'Client',
    'DeveloperClient',
    'LocalKeyStore',
    'LocalMemoryStore',
    'LocalUserAccountProvider',
    'NEOONEProvider',
    'NEOONEOneDataProvider',
    'OneClient',
  ];

  if (networks.some(({ name, dev }) => dev && name !== localDevNetworkName)) {
    mutableImports.push('NEOONEDataProvider');
  }

  return {
    js: `
import { ${mutableImports.join(', ')} } from '@neo-one/client${browser ? '-browserify' : ''}';
import { projectID } from '${getRelativeImport(clientPath, projectIDPath)}';

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
    providers.push(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, host, port: ${httpServerPort} }));
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

export const createDeveloperClients = (host = 'localhost') => ({${networks
      .filter(({ name, dev }) => dev && name !== localDevNetworkName)
      .map(
        ({ name, rpcURL }) =>
          `\n  '${name}': new DeveloperClient(new NEOONEDataProvider({ network: '${name}', rpcURL: '${rpcURL}' })),`,
      )
      .join('')}
  '${localDevNetworkName}': new DeveloperClient(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, host, port: ${httpServerPort} })),
});

export const createLocalClients = (host = 'localhost') => {
  const client = new OneClient(${httpServerPort}, host);
  return {
    '${localDevNetworkName}': {
      getNEOTrackerURL: async () => {
        const result = await client.request({
          plugin: '@neo-one/server-plugin-project',
          options: { type: 'neotracker', projectID },
        });

        return result.response;
      },
      reset: async () => {
        await client.executeTaskList({
          plugin: '@neo-one/server-plugin-project',
          options: {
            command: 'reset',
            projectID,
          },
        });
      },
    },
  };
};
  `,
    ts: `
import { ${mutableImports.join(
      ', ',
    )}, LocalClient, NEOONEDataProviderOptions, UserAccountProvider, UserAccountProviders } from '@neo-one/client${
      browser ? '-browserify' : ''
    }';
import { projectID } from '${getRelativeImport(clientPath, projectIDPath)}';

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
  getUserAccountProvidersOrHost?: string | ((provider: NEOONEProvider) => TUserAccountProviders),
): Client<TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : never, TUserAccountProviders> => {
  let getUserAccountProviders = getDefaultUserAccountProviders as any;
  let host = 'localhost'
  if (typeof getUserAccountProvidersOrHost === 'string') {
    host = getUserAccountProvidersOrHost;
  } else if (getUserAccountProvidersOrHost !== undefined) {
    getUserAccountProviders = getUserAccountProvidersOrHost;
  }
  const providers: Array<NEOONEOneDataProvider | NEOONEDataProviderOptions> = [
    ${networks
      .filter(({ name }) => name !== localDevNetworkName)
      .map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`)
      .join('\n    ')}
  ];
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    providers.push(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, host, port: ${httpServerPort} }));
  }
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
}

export const createDeveloperClients = (host = 'localhost'): { [network: string]: DeveloperClient } => ({${networks
      .filter(({ name, dev }) => dev && name !== localDevNetworkName)
      .map(
        ({ name, rpcURL }) =>
          `\n  '${name}': new DeveloperClient(new NEOONEDataProvider({ network: '${name}', rpcURL: '${rpcURL}' })),`,
      )
      .join('')}
  '${localDevNetworkName}': new DeveloperClient(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, host, port: ${httpServerPort} })),
});

export const createLocalClients = (host = 'localhost'): { [network: string]: LocalClient } => {
  const client = new OneClient(${httpServerPort}, host);
  return {
    '${localDevNetworkName}': {
      getNEOTrackerURL: async () => {
        const result = await client.request({
          plugin: '@neo-one/server-plugin-project',
          options: { type: 'neotracker', projectID },
        });

        return result.response;
      },
      reset: async () => {
        await client.executeTaskList({
          plugin: '@neo-one/server-plugin-project',
          options: {
            command: 'reset',
            projectID,
          },
        });
      },
    },
  };
};
`,
  };
};
