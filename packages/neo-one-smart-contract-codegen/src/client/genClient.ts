import { getRelativeImport } from '../utils';

export interface NetworkDefinition {
  readonly name: string;
  readonly rpcURL: string;
  readonly dev: boolean;
}

export const genClient = ({
  localDevNetworkName,
  masterPrivateKey,
  networks,
  clientPath,
  projectIDPath,
  httpServerPort,
}: {
  readonly localDevNetworkName: string;
  readonly masterPrivateKey: string;
  readonly networks: ReadonlyArray<NetworkDefinition>;
  readonly clientPath: string;
  readonly projectIDPath: string;
  readonly httpServerPort: number;
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
import { ${mutableImports.join(', ')} } from '@neo-one/client';
import { projectID } from '${getRelativeImport(clientPath, projectIDPath)}';

const getDefaultUserAccountProviders = (provider) => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore({ store: new LocalMemoryStore() }),
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
  if (process.env.NODE_ENV !== 'production') {
    providers.push(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, port: ${httpServerPort} }));
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
        localKeyStore.addAccount({
          network: '${localDevNetworkName}',
          name: 'master',
          privateKey: '${masterPrivateKey}',
        }).catch(() => {
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
  '${localDevNetworkName}': new DeveloperClient(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, port: ${httpServerPort} })),
});

export const createOneClients = () => ({
  '${localDevNetworkName}': new OneClient(${httpServerPort}),
})
  `,
    ts: `
import { ${mutableImports.join(', ')}, NEOONEDataProviderOptions, UserAccountProvider } from '@neo-one/client';
import { projectID } from '${getRelativeImport(clientPath, projectIDPath)}';

export type DefaultUserAccountProviders = {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>,
}
const getDefaultUserAccountProviders = (provider: NEOONEProvider): DefaultUserAccountProviders => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore({ store: new LocalMemoryStore() }),
    provider,
  }),
});

const isLocalUserAccountProvider = (userAccountProvider: UserAccountProvider): userAccountProvider is LocalUserAccountProvider<any, any> =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = <TUserAccountProviders extends { readonly [K: string]: UserAccountProvider } = DefaultUserAccountProviders>(
  getUserAccountProviders: (provider: NEOONEProvider) => TUserAccountProviders = getDefaultUserAccountProviders as any,
): Client<TUserAccountProviders> => {
  const providers: Array<NEOONEOneDataProvider | NEOONEDataProviderOptions> = [
    ${networks
      .filter(({ name }) => name !== localDevNetworkName)
      .map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`)
      .join('\n    ')}
  ];
  if (process.env.NODE_ENV !== 'production') {
    providers.push(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, port: ${httpServerPort} }));
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
        localKeyStore.addAccount({
          network: '${localDevNetworkName}',
          name: 'master',
          privateKey: '${masterPrivateKey}',
        }).catch(() => {
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
  '${localDevNetworkName}': new DeveloperClient(new NEOONEOneDataProvider({ network: '${localDevNetworkName}', projectID, port: ${httpServerPort} })),
});

export const createOneClients = (): { [network: string]: OneClient } => ({
  '${localDevNetworkName}': new OneClient(${httpServerPort}),
})
`,
  };
};
