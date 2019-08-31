/* @hash 06f90343402b78aef506c07458daeda4 */
// tslint:disable
/* eslint-disable */
import {
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

export interface DefaultUserAccountProviders {
  readonly memory: LocalUserAccountProvider<LocalKeyStore, NEOONEProvider>;
}

const getDefaultUserAccountProviders = (provider: NEOONEProvider) => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore(new LocalMemoryStore()),
    provider,
  }),
});

const isLocalUserAccountProvider = (userAccountProvider: any): userAccountProvider is LocalUserAccountProvider =>
  userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = <TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders>(
  getUserAccountProvidersOrHost:
    | string
    | ((provider: NEOONEProvider) => TUserAccountProviders) = getDefaultUserAccountProviders as any,
): Client<
  TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : never,
  TUserAccountProviders
> => {
  let getUserAccountProviders = getDefaultUserAccountProviders;
  let host = 'localhost';
  if (typeof getUserAccountProvidersOrHost === 'string') {
    host = getUserAccountProvidersOrHost;
  } else if (getUserAccountProvidersOrHost !== undefined) {
    getUserAccountProviders = getUserAccountProvidersOrHost as any;
  }

  const providers = [];
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    providers.push({ network: 'local', rpcURL: `http://${host}:10000/rpc` });
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
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'master',
            privateKey: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'alfa',
            privateKey: 'KyX5sPKRpAMb3XAFLUrHv7u1LxKkKFrpyJDgE4kceRX9FRJ4WRCQ',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'bravo',
            privateKey: 'L5LfJc2Ngsxu8ZFMvnJbYJ1QdQCstzRXmKLybsFS1aQFURkJ5CHS',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'charlie',
            privateKey: 'KxCH2Ei4TLqp2Qa7swz9bstQc5uREiCpvzvL9R6xLX8X5U8ZqeBj',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'delta',
            privateKey: 'KyVvngWhhfHiociMuwyLmGw8xTu9myKXRnvv5Fes9jDMa2Zyc6P9',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'echo',
            privateKey: 'L37qr7PWqWmgjUPfRC9mS78GjRxgGi4azySCsLUBMAa5hMka2JEm',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'foxtrot',
            privateKey: 'KwFf8gdSWxvC5Pp8AidNdF6mHqjH3CukyF3RnfwS5vzMQKLGTP13',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'golf',
            privateKey: 'Kyn2BN3QuHGYgkt9qJgvwzY8yH4xgTUAKwnGhvU1w8Nh3JnivrAr',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'hotel',
            privateKey: 'L5UXfz1xyzDkghGwistNMCV8pbpU4fg14Ez9rfo1y4KgwiadnWX3',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'india',
            privateKey: 'L5Yoq3X4ojx2FvZZxHbMcvT6var4LaXKHEpMYyyxw4jjhSUNJTRa',
          }),
          localKeyStore.addUserAccount({
            network: 'local',
            name: 'juliett',
            privateKey: 'L1DWex8PtmQJH4GYK9YAuyzmotyL6anY937LxJF54iaALrTtxsD6',
          }),
        ]).catch(() => {
          // do nothing
        });
      }
    }
  }

  return new Client(userAccountProviders as any);
};

export const createDeveloperClients = (host = 'localhost'): DeveloperClients => ({
  local: new DeveloperClient(new NEOONEDataProvider({ network: 'local', rpcURL: `http://${host}:10000/rpc` })),
});
