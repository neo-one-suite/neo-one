import { Client, LocalKeyStore, LocalMemoryStore, LocalUserAccountProvider, NEOONEProvider } from '@neo-one/client';
import { createNode } from './createNode';

export const setupTestNode = async (omitCleanup = true) => {
  const { privateKey, rpcURL, node } = await createNode(omitCleanup);
  const networkName = 'priv';
  const masterWalletName = 'master';

  const keystore = new LocalKeyStore({
    store: new LocalMemoryStore(),
  });

  const masterWallet = await keystore.addAccount({
    network: networkName,
    name: masterWalletName,
    privateKey,
  });

  const provider = new NEOONEProvider([{ network: networkName, rpcURL }]);

  const localUserAccountProvider = new LocalUserAccountProvider({
    keystore,
    provider,
  });
  const userAccountProviders = {
    memory: localUserAccountProvider,
  };
  const client = new Client(userAccountProviders);

  return { client, masterWallet, networkName, provider, keystore, privateKey, userAccountProviders, node };
};
