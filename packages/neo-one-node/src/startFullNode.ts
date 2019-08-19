import {
  globalStats,
  JaegerTraceExporter,
  JaegerTraceExporterOptions,
  PrometheusExporterOptions,
  PrometheusStatsExporter,
  startTracing,
  TraceContextFormat,
  TracingConfig,
} from '@neo-one/client-switch';
import { setGlobalLogLevel } from '@neo-one/logger';
import { Blockchain } from '@neo-one/node-blockchain';
import { Settings } from '@neo-one/node-core';
import { RPCServerOptions, setupRPCServer } from '@neo-one/node-http-rpc';
import { Network, NetworkOptions } from '@neo-one/node-network';
import { dumpChain, loadChain } from '@neo-one/node-offline';
import { Node, NodeOptions } from '@neo-one/node-protocol';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
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
  readonly prometheus?: Omit<PrometheusExporterOptions, 'startServer'>;
  readonly jaeger?: Omit<JaegerTraceExporterOptions, 'serviceName'>;
  readonly tracing?: Omit<TracingConfig, 'exporter' | 'propagation' | 'logger' | 'stats'>;
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

    if (telemetry !== undefined) {
      if (telemetry.logging !== undefined && telemetry.logging.level !== undefined) {
        setGlobalLogLevel(telemetry.logging.level);
      }

      if (telemetry.prometheus !== undefined) {
        const exporter = new PrometheusStatsExporter({
          ...telemetry.prometheus,
          startServer: true,
        });

        globalStats.registerExporter(exporter);

        disposable = composeDisposables(disposable, async () => {
          await new Promise((resolve) => exporter.stopServer(resolve));
          globalStats.unregisterExporter(exporter);
        });
      }

      if (telemetry.jaeger !== undefined && telemetry.tracing !== undefined) {
        const exporter = new JaegerTraceExporter({
          ...telemetry.jaeger,
          serviceName: 'NEO-ONE',
        });

        const stopTracing = startTracing({
          ...telemetry.tracing,
          propagation: new TraceContextFormat(),
          exporter,
        });

        disposable = composeDisposables(disposable, stopTracing);
      }
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

    const blockchain = await Blockchain.create({
      settings: blockchainSettings,
      storage,
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
