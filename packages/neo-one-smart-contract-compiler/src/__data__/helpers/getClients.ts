import { LocalKeyStore, LocalMemoryStore, NEOONEDataProvider, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider } from '@neo-one/client-full-core';

interface Options {
  readonly privateKey: string;
  readonly dataProvider: NEOONEDataProvider;
}

export const getClients = async ({ privateKey, dataProvider }: Options) => {
  const networkName = dataProvider.network;
  const masterWalletName = 'master';

  const keystore = new LocalKeyStore(new LocalMemoryStore());
  const masterWallet = await keystore.addMultiSigUserAccount({
    network: networkName,
    name: masterWalletName,
    privateKeys: [privateKey],
  });

  const provider = new NEOONEProvider([dataProvider]);

  const localUserAccountProvider = new LocalUserAccountProvider({
    keystore,
    provider,
  });
  const userAccountProviders = {
    memory: localUserAccountProvider,
  };
  const client = new Client(userAccountProviders);

  return { client, masterWallet, networkName, userAccountProviders };
};
