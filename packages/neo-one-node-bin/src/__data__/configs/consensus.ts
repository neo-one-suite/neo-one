import { createMain, serializeSettings } from '@neo-one/node-neo-settings';
import { getTestKeys } from '../getTestKeys';

const { standbyValidator, privateKeyString } = getTestKeys();

export const consensus = (rpcPort: number, path: string) => ({
  path,
  blockchain: serializeSettings(
    createMain({
      // address,
      standbyValidators: [standbyValidator],
      privateNet: true,
      millisecondsPerBlock: 5000,
    }),
  ),
  rpc: {
    http: {
      host: 'localhost',
      port: rpcPort,
    },
    readyHealthCheck: {},
    liveHealthCheck: {},
  },
  node: {
    consensus: {
      privateKey: privateKeyString,
      privateNet: true,
    },
  },
});
