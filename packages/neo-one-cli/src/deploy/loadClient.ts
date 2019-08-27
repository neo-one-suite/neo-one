// tslint:disable prefer-conditional-expression
import { Configuration, WALLETS } from '@neo-one/cli-common';
import { LocalKeyStore, LocalMemoryStore, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider } from '@neo-one/client-full-core';
import { constants } from '@neo-one/utils';
import { Print } from './types';

const createLocalClient = async (config: Configuration) => {
  const keystore = new LocalKeyStore(new LocalMemoryStore());
  await Promise.all(
    WALLETS.map(async ({ name, wif }) => {
      await keystore.addUserAccount({ network: constants.LOCAL_NETWORK_NAME, privateKey: wif, name });
    }),
  );

  const {
    userAccount: { id },
  } = await keystore.addUserAccount({
    network: constants.LOCAL_NETWORK_NAME,
    privateKey: constants.PRIVATE_NET_PRIVATE_KEY,
    name: 'master',
  });

  const client = new Client({
    local: new LocalUserAccountProvider({
      keystore,
      provider: new NEOONEProvider([
        { network: constants.LOCAL_NETWORK_NAME, rpcURL: `http://localhost:${config.network.port}/rpc` },
      ]),
    }),
  });

  await client.selectUserAccount(id);

  return client;
};

const createNetworksClient = async (config: Configuration, network: string) => {
  const userAccountProvider = await config.networks[network].userAccountProvider();

  return new Client({ [network]: userAccountProvider });
};

export const loadClient = async (config: Configuration, network: string, print: Print) => {
  print(`Loading client for network ${network}.`);
  let client: Client;
  if (network === constants.LOCAL_NETWORK_NAME) {
    client = await createLocalClient(config);
  } else {
    client = await createNetworksClient(config, network);
  }
  print('Loaded client.');

  return client;
};
