export interface NetworkDefinition {
  readonly name: string;
  readonly rpcURL: string;
}

export const genClient = ({
  devNetworkName,
  masterPrivateKey,
  networks,
}: {
  readonly devNetworkName: string;
  readonly masterPrivateKey: string;
  readonly networks: ReadonlyArray<NetworkDefinition>;
}): string =>
  `
import { Client, LocalKeyStore, LocalMemoryStore, LocalUserAccountProvider, NEOONEProvider, UserAccountProvider } from '@neo-one/client';

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
  const provider = new NEOONEProvider([
    ${networks.map(({ name, rpcURL }) => `{ network: '${name}', rpcURL: '${rpcURL}' },`).join('\n    ')}
  ]);
  const userAccountProviders = getUserAccountProviders(provider);

  const localUserAccountProviders = Object.values(userAccountProviders).filter(isLocalUserAccountProvider);
  const localUserAccountProvider = localUserAccountProviders.find(
    (userAccountProvider) => userAccountProvider.keystore instanceof LocalKeyStore,
  );
  if (localUserAccountProvider !== undefined) {
    const localKeyStore = localUserAccountProvider.keystore;
    if (localKeyStore instanceof LocalKeyStore) {
      localKeyStore.addAccount({
        network: '${devNetworkName}',
        name: 'master',
        privateKey: '${masterPrivateKey}',
      }).catch(() => {
        // do nothing
      });
    }
  }

  return new Client(userAccountProviders);
}
`;
