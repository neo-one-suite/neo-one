import { LocalKeyStore, LocalMemoryStore, NEOONEProvider } from '@neo-one/client-core';
import { LocalUserAccountProvider } from '@neo-one/client-full-core';
import prompts from 'prompts';

export const createUserAccountProviderFunc = (network: string, rpcURL: string) => async () => {
  const keystore = new LocalKeyStore(new LocalMemoryStore());
  const { privateKeys } = await prompts({
    type: 'list',
    name: 'privateKeys',
    message: `Please enter one or more private keys separated by commas for use on the "${network}" network.`,
    validate: (value) => (value.length > 0 ? true : 'Must enter at least one private key.'),
  });
  await Promise.all(privateKeys.map((privateKey: string) => keystore.addUserAccount({ network, privateKey })));

  return new LocalUserAccountProvider({
    keystore,
    provider: new NEOONEProvider([{ network, rpcURL }]),
  });
};

// tslint:disable-next-line export-name
export const defaultNetworks = {
  main: {
    userAccountProvider: createUserAccountProviderFunc('main', 'https://neotracker.io/rpc'),
  },
  test: {
    userAccountProvider: createUserAccountProviderFunc('test', 'https://testnet.neotracker.io/rpc'),
  },
  local: {
    userAccountProvider: createUserAccountProviderFunc('neo-one', 'localhost:9040'),
  },
};
