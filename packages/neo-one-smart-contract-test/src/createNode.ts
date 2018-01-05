import { BehaviorSubject } from 'rxjs';
import FullNode from '@neo-one/node';

import _ from 'lodash';
import { createMain } from '@neo-one/node-neo-settings';
import {
  addressToScriptHash,
  createPrivateKey,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '@neo-one/client';
import memdown from 'memdown';

import { addCleanup } from './cleanupTest';
import { getMonitor } from './getMonitor';

const getPort = () => _.random(10000, 50000);

export const createNode = async () => {
  const privateKey = createPrivateKey();
  const port = getPort();

  const node = new FullNode(
    {
      monitor: getMonitor(),
      settings: createMain({
        privateNet: true,
        standbyValidators: [privateKeyToPublicKey(privateKey)],
        address: addressToScriptHash(privateKeyToAddress(privateKey)),
      }),
      environment: {
        dataPath: '/tmp/fakePath/',
        rpc: {
          http: {
            port,
            host: 'localhost',
          },
        },
      },
      options$: new BehaviorSubject({
        node: {
          consensus: {
            enabled: true,
            options: {
              privateKey,
              privateNet: true,
            },
          },
        },
      }),
      leveldown: memdown(),
    },
    (error) => {
      // tslint:disable-next-line
      console.error(error);
      node.stop();
    },
  );
  addCleanup(() => node.stop());
  node.start();

  return { privateKey, node, rpcURL: `http://localhost:${port}/rpc` };
};
