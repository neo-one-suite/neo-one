import { getClients as getClientsBase } from '@neo-one/cli-common';
import { NEOONEDataProvider } from '@neo-one/client';
import { common, crypto } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';

export const getClients = async (project: string) => {
  crypto.addPublicKey(
    common.stringToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY),
    common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
  );

  const config = await one.getProjectConfig(project);

  return getClientsBase(
    new NEOONEDataProvider({
      network: constants.LOCAL_NETWORK_NAME,
      rpcURL: `http://localhost:${config.network.port}/rpc`,
    }),
    constants.PRIVATE_NET_PRIVATE_KEY,
  );
};
