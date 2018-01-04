import { localClient } from '@neo-one/client';

import config from './neo-one.json';

const network = config.network.name;
export const getClient = () =>
  localClient({
    options: [
      {
        network,
        rpcURL: config.network.rpcURL,
      },
    ],
  });

export const setupClient = async client => {
  await Promise.all(
    Object.keys(config.wallets).map(async name => {
      const wallet = config.wallets[name];
      await client.userAccountProvider.keystore.addAccount({
        network,
        privateKey: wallet.privateKey,
        name,
      });
    }),
  );
};

export const getContracts = client => {
  const contracts = {};
  for (const name of Object.keys(config.deployedContracts)) {
    // TODO: Hack to support new Client api, this will go away.
    contracts[name] = client.smartContract({
      networks: {
        [network]: { hash: config.deployedContracts[name].hash },
      },
      abi: config.deployedContracts[name].abi,
    });
  }

  return contracts;
};
