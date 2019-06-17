/* @hash 82e65d744664bb1ee01e6daa52474eb7 */
// tslint:disable
/* eslint-disable */
import {
  Client,
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  LocalUserAccountProvider,
  NEOONEProvider,
  NEOONEOneDataProvider,
  OneClient,
} from '@neo-one/client';
import { projectID } from './projectID';

const getDefaultUserAccountProviders = (provider) => ({
  memory: new LocalUserAccountProvider({
    keystore: new LocalKeyStore(new LocalMemoryStore()),
    provider,
  }),
});

const isLocalUserAccountProvider = (userAccountProvider) => userAccountProvider instanceof LocalUserAccountProvider;

export const createClient = (getUserAccountProvidersOrHost) => {
  let getUserAccountProviders = getDefaultUserAccountProviders;
  let host = 'localhost';
  if (typeof getUserAccountProvidersOrHost === 'string') {
    host = getUserAccountProvidersOrHost;
  } else if (getUserAccountProvidersOrHost !== undefined) {
    getUserAccountProviders = getUserAccountProvidersOrHost;
  }
  const providers = [];
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    providers.push(new NEOONEOneDataProvider({ network: 'local', projectID, host, port: 10001 }));
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

  return new Client(userAccountProviders);
};

export const createDeveloperClients = (host = 'localhost') => ({
  local: new DeveloperClient(new NEOONEOneDataProvider({ network: 'local', projectID, host, port: 10001 })),
});

export const createLocalClients = (host = 'localhost') => {
  const client = new OneClient(10001, host);
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
