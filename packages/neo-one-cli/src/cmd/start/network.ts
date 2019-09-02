import { common, crypto } from '@neo-one/client-common';
import { cliLogger } from '@neo-one/logger';
import { FullNode } from '@neo-one/node';
import { createMain } from '@neo-one/node-neo-settings';
import * as fs from 'fs-extra';
import net from 'net';
import * as nodePath from 'path';
import yargs from 'yargs';
import { getNetworkProcessIDFile, getPrimaryKeys, start } from '../../common';

async function isRunning(port: number) {
  let resolve: (running: boolean) => void;
  let reject: (err: Error) => void;
  // tslint:disable-next-line promise-must-complete
  const promise = new Promise<boolean>((resolver, rejector) => {
    resolve = resolver;
    reject = rejector;
  });

  const cleanup = () => {
    client.removeAllListeners('connect');
    client.removeAllListeners('error');
    client.end();
    client.destroy();
    client.unref();
  };

  const onConnect = () => {
    resolve(true);
    cleanup();
  };

  const onError = (error: Error) => {
    // tslint:disable-next-line no-any
    if ((error as any).code !== 'ECONNREFUSED') {
      reject(error);
    } else {
      resolve(false);
    }
    cleanup();
  };

  const client = new net.Socket();
  client.once('connect', onConnect);
  client.once('error', onError);
  client.connect({ port, host: '127.0.0.1' });

  return promise;
}

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

    const pidFile = getNetworkProcessIDFile(config);
    await fs.ensureDir(nodePath.dirname(pidFile));
    await fs.writeFile(pidFile, process.pid);

    return async () => {
      await fullNode.stop();
    };
  });
};
