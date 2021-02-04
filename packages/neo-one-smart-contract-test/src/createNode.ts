import { common, crypto } from '@neo-one/client-common';
import { FullNode } from '@neo-one/node';
import { createPriv } from '@neo-one/node-neo-settings';
import { constants } from '@neo-one/utils';
import _ from 'lodash';
import MemDown from 'memdown';

const getPort = () => _.random(10000, 50000);

export const createNode = async () => {
  const port = getPort();
  const privateKey = constants.PRIVATE_NET_PRIVATE_KEY;
  crypto.addPublicKey(common.stringToPrivateKey(privateKey), common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY));

  const node = new FullNode({
    options: {
      blockchain: createPriv({
        standbyValidators: [constants.PRIVATE_NET_PUBLIC_KEY],
        extraCommitteeMembers: [],
      }),
      path: '/tmp/fakePath/',
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

  await node.start();

  return {
    privateKey,
    node,
    rpcURL: `http://localhost:${port}/rpc`,
  };
};
