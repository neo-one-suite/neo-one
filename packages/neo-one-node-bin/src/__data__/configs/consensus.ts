import { createMain, serializeSettings } from '@neo-one/node-neo-settings';
import { getTestKeys } from '../getTestKeys';

const { standbyValidator, address, privateKeyString } = getTestKeys();

export const consensus = (rpcPort: number, path: string) => ({
  path,
  blockchain: serializeSettings(
    createMain({
      address,
      standbyValidators: [standbyValidator],
      privateNet: true,
      secondsPerBlock: 5,
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
