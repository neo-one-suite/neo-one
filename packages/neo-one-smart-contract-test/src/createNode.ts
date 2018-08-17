import { common, crypto } from '@neo-one/client-core';
import { FullNode } from '@neo-one/node';
import { createMain } from '@neo-one/node-neo-settings';
import _ from 'lodash';
import MemDown from 'memdown';
import { BehaviorSubject } from 'rxjs';
import { addCleanup } from './addCleanup';
import { getMonitor } from './getMonitor';

const getPort = () => _.random(10000, 50000);

const PRIVATE_KEY = 'a01dd45345a7899b58e0e35f413beec8199b2b743b402a92b696fdecdaf7a214';
const PUBLIC_KEY = '023a0eca8e082e3315f1aba8da485d5c11389780d833e94fecc1ea84dca202d685';
const SCRIPT_HASH = '0xd6ed345f7cf3ea8c980132ddacb403ee2ab760ab';

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
