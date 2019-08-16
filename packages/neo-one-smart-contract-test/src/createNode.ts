import { common, crypto, privateKeyToScriptHash, wifToPrivateKey } from '@neo-one/client-common';
import { FullNode } from '@neo-one/node';
import { createMain } from '@neo-one/node-neo-settings';
import { constants } from '@neo-one/utils';
import _ from 'lodash';
import MemDown from 'memdown';
import { addCleanup } from './addCleanup';

const getPort = () => _.random(10000, 50000);

export const createNode = async () => {
  const port = getPort();
  const privateKey = wifToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY);
  crypto.addPublicKey(
    common.stringToPrivateKey(wifToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY)),
    common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
  );

  const node = new FullNode({
    options: {
      blockchain: createMain({
        privateNet: true,
        standbyValidators: [constants.PRIVATE_NET_PUBLIC_KEY],
        address: privateKeyToScriptHash(privateKey),
      }),
      dataPath: '/tmp/fakePath/',
      rpc: {
        http: {
          port,
          host: 'localhost',
        },
      },
      node: {
        consensus: {
          privateKey,
          privateNet: true,
        },
      },
    },
    leveldown: MemDown(),
  });
  addCleanup(async () => node.stop());
  await node.start();

  return {
    privateKey,
    node,
    rpcURL: `http://localhost:${port}/rpc`,
  };
};
