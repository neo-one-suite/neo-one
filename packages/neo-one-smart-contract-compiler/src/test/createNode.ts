import { FullNode } from '@neo-one/node';
import fetch from 'cross-fetch';
import { BehaviorSubject } from 'rxjs';

import { addressToScriptHash, createPrivateKey, privateKeyToAddress, privateKeyToPublicKey } from '@neo-one/client';
import { createMain } from '@neo-one/node-neo-settings';
import _ from 'lodash';
import MemDown from 'memdown';

import { getMonitor } from '../test/getMonitor';
import { addCleanup } from './addCleanup';

const getPort = () => _.random(10000, 50000);

const until = async (func: () => Promise<void>, timeoutMSIn?: number) => {
  const start = Date.now();
  const timeoutMS = timeoutMSIn === undefined ? 60 * 1000 : timeoutMSIn;
  let finalError;
  // tslint:disable-next-line no-loop-statement
  while (Date.now() - start < timeoutMS) {
    try {
      await func();

      return;
    } catch (error) {
      finalError = error;
      await new Promise<void>((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw finalError;
};

const createCheckReady = (port: number) => async () => {
  const response = await fetch(`http://localhost:${port}/rpc`);
  if (response.status !== 405) {
    throw Error(`Node is not ready: ${response.status}. ${response.statusText}`);
  }
};

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
      leveldown: MemDown(),
    },
    (error) => {
      // tslint:disable-next-line
      console.error(error);
      // tslint:disable-next-line
      node.stop();
    },
  );
  addCleanup(async () => node.stop());
  node.start();

  await until(createCheckReady(port), 60000);

  // tslint:disable-next-line no-http-string
  return { privateKey, node, rpcURL: `http://localhost:${port}/rpc` };
};
