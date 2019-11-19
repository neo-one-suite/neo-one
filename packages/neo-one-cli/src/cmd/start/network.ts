import { common, crypto } from '@neo-one/client-common';
import { cliLogger } from '@neo-one/logger';
import { FullNode } from '@neo-one/node';
import { createMain } from '@neo-one/node-neo-settings';
import yargs from 'yargs';
import { getPrimaryKeys, isRunning, start } from '../../common';
import { writePidFile } from './writePidFile';

export const command = 'network';
export const describe = 'Start a NEO•ONE development network using the project configuration.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder;
export const handler = () => {
  start(async (_cmd, config) => {
    const running = await isRunning(config.network.port);
    if (running) {
      cliLogger.info('Network is already running');

      return undefined;
    }

    const { privateKey, publicKey } = getPrimaryKeys();

    const fullNode = new FullNode({
      options: {
        path: config.network.path,
        blockchain: createMain({
          address: common.uInt160ToString(crypto.privateKeyToScriptHash(privateKey)),
          standbyValidators: [common.ecPointToString(publicKey)],
          privateNet: true,
        }),
        node: {
          consensus: {
            privateKey: common.privateKeyToString(privateKey),
            privateNet: true,
          },
        },
        rpc: {
          http: {
            port: config.network.port,
          },
          readyHealthCheck: {},
          liveHealthCheck: {},
        },
      },
    });

    await fullNode.start();

    await writePidFile('network', process, config);

    return async () => {
      await fullNode.stop();
    };
  });
};
