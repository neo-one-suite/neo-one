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
}) => {
  const createClient = (language: 'ts' | 'js') => `const providers = [
    ${networks
      .filter(({ name }) => name !== localDevNetworkName)
      .map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`)
      .join('\n    ')}
  ];
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    providers.push({ network: '${localDevNetworkName}', rpcURL: \`http://\${host}:${localDevNetworkPort}/rpc\` });
  }
  const provider = new NEOONEProvider(providers);
  const userAccountProviders = getUserAccountProviders(provider);
  const localUserAccountProviders = Object.values(userAccountProviders).filter(isLocalUserAccountProvider)${
    language === 'ts' ? ' as LocalUserAccountProvider[]' : ''
  };
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
  }`;

  const createDeveloperClients = `({${networks
    .filter(({ name, dev }) => dev && name !== localDevNetworkName)
    .map(
      ({ name, rpcURL }) =>
        `\n  '${name}': new DeveloperClient(new NEOONEDataProvider({ network: '${name}', rpcURL: '${rpcURL}' })),`,
    )
    .join('')}
  '${localDevNetworkName}': new DeveloperClient(new NEOONEDataProvider({ network: '${localDevNetworkName}', rpcURL: \`http://\${host}:${localDevNetworkPort}/rpc\` })),
});`;

  const getDefaultUserAccountProviders = (language: 'ts' | 'js') => `{
    const localUserAccountProvider = {
      memory: new LocalUserAccountProvider({
        keystore: new LocalKeyStore(new LocalMemoryStore()),
        provider,
      })};

      const dapi = typeof globalThis === 'undefined' ? undefined : ${
        language === 'ts' ? '(globalThis as any)' : 'globalThis'
      }.neoDapi;
      if (dapi !== undefined) {
        return {...localUserAccountProvider, dapi: new DapiUserAccountProvider({ dapi, provider, onError: (error) => { throw error }})}
      }

      return localUserAccountProvider;
  };`;

  return {
    js: `
import {
  Client,
  DapiUserAccountProvider,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEDataProvider,
} from '@neo-one/client';

const getDefaultUserAccountProviders = (provider) => ${getDefaultUserAccountProviders('js')}

const isLocalUserAccountProvider = (userAccountProvider) =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = (getUserAccountProvidersOrHost) => {
  let getUserAccountProviders = getDefaultUserAccountProviders;
  let host = 'localhost'
  if (typeof getUserAccountProvidersOrHost === 'string') {
    host = getUserAccountProvidersOrHost;
  } else if (getUserAccountProvidersOrHost != undefined) {
    getUserAccountProviders = getUserAccountProvidersOrHost;
  }

  ${createClient('js')}

  return new Client(userAccountProviders);
};

export const createDeveloperClients = (host = 'localhost') => ${createDeveloperClients}
  `,
    ts: `
import {
  Client,
  DapiUserAccountProvider,
  DeveloperClient,
  DeveloperClients,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEDataProvider,
  UserAccountProviders,
} from '@neo-one/client';

export interface DefaultUserAccountProviders {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>,
}

const getDefaultUserAccountProviders = (provider: NEOONEProvider) => ${getDefaultUserAccountProviders('ts')}

const isLocalUserAccountProvider = (userAccountProvider: any): userAccountProvider is LocalUserAccountProvider =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = <TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders>(
  getUserAccountProvidersOrHost: string | ((provider: NEOONEProvider) => TUserAccountProviders) = getDefaultUserAccountProviders as any,
): Client<TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : any, TUserAccountProviders> => {
  let getUserAccountProviders = getDefaultUserAccountProviders;
  let host = 'localhost'
  if (typeof getUserAccountProvidersOrHost === 'string') {
    host = getUserAccountProvidersOrHost;
  } else if (getUserAccountProvidersOrHost != undefined) {
    getUserAccountProviders = getUserAccountProvidersOrHost as any;
  }

  ${createClient('ts')}

  return new Client(userAccountProviders as any);
}

export const createDeveloperClients = (host = 'localhost'): DeveloperClients => ${createDeveloperClients}
`,
  };
};
