// tslint:disable prefer-conditional-expression no-loop-statement
import { Configuration, WALLETS } from '@neo-one/cli-common';
import { privateKeyToAddress } from '@neo-one/client-common';
import { LocalKeyStore, LocalMemoryStore, NEOONEProvider } from '@neo-one/client-core';
import { Client, LocalUserAccountProvider, UserAccountProvider, UserAccountProviders } from '@neo-one/client-full-core';
import { constants } from '@neo-one/utils';
import { Print } from './types';

const createLocalUserAccountProvider = async (config: Configuration) => {
  const keystore = new LocalKeyStore(new LocalMemoryStore());
  await Promise.all(
    WALLETS.map(async ({ name, wif }) => {
      await keystore.addUserAccount({ network: constants.LOCAL_NETWORK_NAME, privateKey: wif, name });
    }),
  );

  await keystore.addUserAccount({
    network: constants.LOCAL_NETWORK_NAME,
    privateKey: constants.PRIVATE_NET_PRIVATE_KEY,
    name: 'master',
  });

  return new LocalUserAccountProvider({
    keystore,
    provider: new NEOONEProvider([
      { network: constants.LOCAL_NETWORK_NAME, rpcURL: `http://localhost:${config.network.port}/rpc` },
    ]),
  });
};

const createNetworksUserAccountProvider = async (config: Configuration, network: string) =>
  config.networks[network].userAccountProvider();

export const loadClient = async (config: Configuration, networks: readonly string[], print: Print) => {
  if (networks.length === 1) {
    print(`Loading client for network ${networks[0]}.`);
  } else {
    print(`Loading client for networks: ${networks.join(', ')}.`);
  }

  let userAccountProviders: UserAccountProviders = {};
  let hasLocal = false;
  for (const network of networks) {
    let userAccountProvider: UserAccountProvider;
    if (network === constants.LOCAL_NETWORK_NAME) {
      hasLocal = true;
      userAccountProvider = await createLocalUserAccountProvider(config);
    } else {
      userAccountProvider = await createNetworksUserAccountProvider(config, network);
    }

    userAccountProviders = {
      ...userAccountProviders,
      [network]: userAccountProvider,
    };
  }

  const client = new Client(userAccountProviders);

  if (hasLocal) {
    await client.selectUserAccount({
      network: 'local',
      address: privateKeyToAddress(constants.PRIVATE_NET_PRIVATE_KEY),
    });
  }

  print('Loaded client.');

  return client;
};
