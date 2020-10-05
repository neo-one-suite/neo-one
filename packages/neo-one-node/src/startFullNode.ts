import { setGlobalLogLevel } from '@neo-one/logger';
import { Blockchain } from '@neo-one/node-blockchain';
import { Settings } from '@neo-one/node-core';
import { RPCServerOptions, setupRPCServer } from '@neo-one/node-http-rpc';
import { NativeContainer } from '@neo-one/node-native';
import { Network, NetworkOptions } from '@neo-one/node-network';
import { dumpChain, loadChain } from '@neo-one/node-offline';
import { Node, NodeOptions } from '@neo-one/node-protocol';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { Dispatcher } from '@neo-one/node-vm';
import { composeDisposables, Disposable, noopDisposable } from '@neo-one/utils';
import { AbstractLevelDOWN } from 'abstract-leveldown';
import fs from 'fs-extra';
import LevelDOWN from 'leveldown';
import LevelUp from 'levelup';

export interface LoggingOptions {
  readonly level?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
}

export interface TelemetryOptions {
  readonly logging?: LoggingOptions;
}

export interface Options {
  readonly path: string;
  readonly blockchain: Settings;
  readonly node?: NodeOptions;
  readonly network?: NetworkOptions;
  readonly rpc?: RPCServerOptions;
  readonly telemetry?: TelemetryOptions;
}

export interface FullNodeOptions {
  readonly options: Options;
  readonly chainFile?: string;
  readonly dumpChainFile?: string;
  readonly leveldown?: AbstractLevelDOWN;
}

export const startFullNode = async ({
  options: {
    path: dataPath,
    blockchain: blockchainSettings,
    telemetry,
    node: nodeOptions = {},
    network: networkOptions = {},
    rpc: rpcOptions = {},
  },
  chainFile,
  dumpChainFile,
  leveldown: customLeveldown,
}: FullNodeOptions): Promise<Disposable> => {
  let disposable = noopDisposable;
  try {
    await fs.ensureDir(dataPath);

    if (telemetry !== undefined && telemetry.logging !== undefined && telemetry.logging.level !== undefined) {
      setGlobalLogLevel(telemetry.logging.level);
    }

    const levelDown = customLeveldown === undefined ? LevelDOWN(dataPath) : customLeveldown;
    disposable = composeDisposables(disposable, async () => {
      await new Promise((resolve, reject) => {
        levelDown.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    const storage = levelupStorage({
      db: LevelUp(levelDown),
      context: { messageMagic: blockchainSettings.messageMagic },
    });

    disposable = composeDisposables(disposable, async () => {
      await storage.close();
    });

    const native = new NativeContainer(blockchainSettings);

    const vm = new Dispatcher({ levelDBPath: dataPath });

    const blockchain = await Blockchain.create({
      settings: blockchainSettings,
      storage,
      native,
      vm,
    });

    disposable = composeDisposables(disposable, async () => {
      await blockchain.stop();
    });

    if (chainFile !== undefined) {
      await loadChain({
        chain: { format: 'raw', path: chainFile },
        blockchain,
      });
    }

    if (dumpChainFile !== undefined) {
      await dumpChain({
        path: dumpChainFile,
        blockchain,
      });
    }

    const node = new Node({
      blockchain,
      options: nodeOptions,
      createNetwork: (options) =>
        new Network({
          options: networkOptions,
          ...options,
        }),
    });
    const nodeDisposable = await node.start();
    disposable = composeDisposables(disposable, nodeDisposable);

    const rpcDisposable = await setupRPCServer({
      blockchain,
      node,
      options: rpcOptions,
    });
    disposable = composeDisposables(disposable, rpcDisposable);

    return disposable;
  } catch (err) {
    await disposable();
    throw err;
  }
};
