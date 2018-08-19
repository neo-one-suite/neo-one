import { common, crypto } from '@neo-one/client-core';
import { FullNode } from '@neo-one/node';
import { createMain } from '@neo-one/node-neo-settings';
import _ from 'lodash';
import MemDown from 'memdown';
import { BehaviorSubject } from 'rxjs';
import { addCleanup } from './addCleanup';
import { getMonitor } from './getMonitor';

const getPort = () => _.random(10000, 50000);

const PRIVATE_KEY = 'e35fa5d1652c4c65e296c86e63a3da6939bc471b741845be636e2daa320dc770';
const PUBLIC_KEY = '0248be3c070df745a60f3b8b494efcc6caf90244d803a9a72fe95d9bae2120ec70';
const SCRIPT_HASH = '0x1d92de69e2b1d980079af8d79fbff5fe69521aab';

export const createNode = async (omitCleanup = false) => {
  const port = getPort();
  crypto.addPublicKey(common.stringToPrivateKey(PRIVATE_KEY), common.stringToECPoint(PUBLIC_KEY));

  const node = new FullNode(
    {
      monitor: getMonitor(),
      settings: createMain({
        privateNet: true,
        standbyValidators: [PUBLIC_KEY],
        address: SCRIPT_HASH,
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
              privateKey: PRIVATE_KEY,
              privateNet: true,
            },
          },
        },
      }),
      leveldown: MemDown(),
    },
    (error) => {
      // tslint:disable
      /* istanbul ignore next */
      console.error(error);
      /* istanbul ignore next */
      node.stop();
      // tslint:enable
    },
  );
  if (!omitCleanup) {
    addCleanup(async () => node.stop());
  }
  await node.start();

  return {
    privateKey: PRIVATE_KEY,
    node,
    rpcURL: `http://localhost:${port}/rpc`,
  };
};
