import {
  DeveloperClient,
  LocalKeyStore,
  LocalMemoryStore,
  NEOONEDataProvider,
  NEOONEProvider,
} from '@neo-one/client-core';
import { Client, LocalUserAccountProvider } from '@neo-one/client-full-core';

export const getClients = async (provider: NEOONEDataProvider, masterPrivateKey: string) => {
  const client = new Client({
    memory: new LocalUserAccountProvider({
      keystore: new LocalKeyStore({ store: new LocalMemoryStore() }),
      provider: new NEOONEProvider([provider]),
    }),
  });
  const developerClient = new DeveloperClient(provider);
  const masterWallet = await client.providers.memory.keystore.addAccount({
    network: provider.network,
    privateKey: masterPrivateKey,
  });

  return { client, developerClient, masterWallet };
};
