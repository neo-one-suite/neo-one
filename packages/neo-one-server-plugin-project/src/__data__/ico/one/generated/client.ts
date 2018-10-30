/* @hash 83bfde457ae311a31347a44614332db3 */
// tslint:disable
/* eslint-disable */
import {
  Client,
  DeveloperClient,
  LocalClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEOneDataProvider,
  OneClient,
  NEOONEDataProviderOptions,
  UserAccountProvider,
  UserAccountProviders,
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

export const createClient = <TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders>(
  getUserAccountProviders: (provider: NEOONEProvider) => TUserAccountProviders = getDefaultUserAccountProviders as any,
): Client<
  TUserAccountProviders extends UserAccountProviders<infer TUserAccountProvider> ? TUserAccountProvider : never,
  TUserAccountProviders
> => {
  const providers: Array<NEOONEOneDataProvider | NEOONEDataProviderOptions> = [];
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    providers.push(new NEOONEOneDataProvider({ network: 'local', projectID, port: 48242 }));
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
          localKeyStore.addAccount({
            network: 'local',
            name: 'master',
            privateKey: 'L4qhHtwbiAMu1nrSmsTP5a3dJbxA3SNS6oheKnKd8E7KTJyCLcUv',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'alfa',
            privateKey: 'KyX5sPKRpAMb3XAFLUrHv7u1LxKkKFrpyJDgE4kceRX9FRJ4WRCQ',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'bravo',
            privateKey: 'L5LfJc2Ngsxu8ZFMvnJbYJ1QdQCstzRXmKLybsFS1aQFURkJ5CHS',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'charlie',
            privateKey: 'KxCH2Ei4TLqp2Qa7swz9bstQc5uREiCpvzvL9R6xLX8X5U8ZqeBj',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'delta',
            privateKey: 'KyVvngWhhfHiociMuwyLmGw8xTu9myKXRnvv5Fes9jDMa2Zyc6P9',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'echo',
            privateKey: 'L37qr7PWqWmgjUPfRC9mS78GjRxgGi4azySCsLUBMAa5hMka2JEm',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'foxtrot',
            privateKey: 'KwFf8gdSWxvC5Pp8AidNdF6mHqjH3CukyF3RnfwS5vzMQKLGTP13',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'golf',
            privateKey: 'Kyn2BN3QuHGYgkt9qJgvwzY8yH4xgTUAKwnGhvU1w8Nh3JnivrAr',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'hotel',
            privateKey: 'L5UXfz1xyzDkghGwistNMCV8pbpU4fg14Ez9rfo1y4KgwiadnWX3',
          }),
          localKeyStore.addAccount({
            network: 'local',
            name: 'india',
            privateKey: 'L5Yoq3X4ojx2FvZZxHbMcvT6var4LaXKHEpMYyyxw4jjhSUNJTRa',
          }),
          localKeyStore.addAccount({
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
  return new Client(userAccountProviders);
};

export const createDeveloperClients = (): { [network: string]: DeveloperClient } => ({
  local: new DeveloperClient(new NEOONEOneDataProvider({ network: 'local', projectID, port: 48242 })),
});

export const createLocalClients = (): { [network: string]: LocalClient } => {
  const client = new OneClient(48242);
  return {
    local: {
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
