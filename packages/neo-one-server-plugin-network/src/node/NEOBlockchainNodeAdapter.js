/* @flow */
// flowlint untyped-import:off
import { type ChildProcess, spawn } from 'child_process';
import {
  type Binary,
  type DescribeTable,
  type Log,
  type PortAllocator,
  Config,
  killProcess,
} from '@neo-one/server-plugin';
import type { FullNodeEnvironment, FullNodeOptions } from '@neo-one/full-node';

import _ from 'lodash';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { take } from 'rxjs/operators';

import NodeAdapter, { type NodeStatus } from './NodeAdapter';
import type { NodeSettings } from '../types';

export type NodeConfig = {|
  log: {|
    level: string,
    maxSize: number,
    maxFiles: number,
  |},
  settings: {|
    test: boolean,
    privateNet?: boolean,
    secondsPerBlock?: number,
    standbyValidators?: Array<string>,
    address?: string,
  |},
  environment: FullNodeEnvironment,
  options: FullNodeOptions,
|};

const defaultConfig = (dataPath: string) => ({
  log: {
    level: 'info',
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
  },
  settings: {
    test: false,
  },
  environment: {
    dataPath: path.resolve(dataPath, 'node'),
    rpc: {},
    node: { network: {} },
  },
  options: {
    node: {
      consensus: {
        enabled: false,
        options: { privateKey: 'default' },
      },
      network: {
        seeds: ([
          'tcp:seed1.neo.org:10333',
          'tcp:seed2.neo.org:10333',
          'tcp:seed3.neo.org:10333',
          'tcp:seed4.neo.org:10333',
          'tcp:seed5.neo.org:10333',
        ]: $FlowFixMe),
      },
    },
    rpc: {
      server: {
        keepAliveTimeout: 60000,
      },
      readyHealthCheck: {
        rpcEndpoints: [
          'http://seed1.cityofzion.io:8080',
          'http://seed2.cityofzion.io:8080',
          'http://seed3.cityofzion.io:8080',
          'http://seed4.cityofzion.io:8080',
          'http://seed5.cityofzion.io:8080',
          'http://seed1.neo.org:10332',
          'http://seed2.neo.org:10332',
          'http://seed3.neo.org:10332',
          'http://seed4.neo.org:10332',
          'http://seed5.neo.org:10332',
        ],
        offset: 1,
        timeoutMS: 5000,
      },
    },
  },
});

export const createNodeConfig = ({
  log,
  dataPath,
  defaultConfig: defaultConfigIn,
}: {|
  log: Log,
  dataPath: string,
  defaultConfig?: NodeConfig,
|}): Config<NodeConfig> =>
  new Config({
    name: 'node',
    defaultConfig: defaultConfigIn || defaultConfig(dataPath),
    schema: {
      type: 'object',
      required: ['log'],
      properties: {
        log: {
          type: 'object',
          required: ['level', 'maxSize', 'maxFiles'],
          properties: {
            level: { type: 'string' },
            maxSize: { type: 'number' },
            maxFiles: { type: 'number' },
          },
        },
        settings: {
          type: 'object',
          required: ['test'],
          properties: {
            test: { type: 'boolean' },
            privateNet: { type: 'boolean' },
            secondsPerBlock: { type: 'number' },
            standbyValidators: { type: 'array', items: { type: 'string' } },
          },
        },
        environment: {
          type: 'object',
          required: ['dataPath', 'rpc', 'node'],
          properties: {
            dataPath: { type: 'string' },
            rpc: {
              type: 'object',
              required: [],
              properties: {
                http: {
                  type: 'object',
                  required: ['host', 'port'],
                  properties: {
                    host: { type: 'string' },
                    port: { type: 'number' },
                  },
                },
                https: {
                  type: 'object',
                  required: ['host', 'port', 'key', 'cert'],
                  properties: {
                    host: { type: 'string' },
                    port: { type: 'number' },
                    key: { type: 'string' },
                    cert: { type: 'string' },
                  },
                },
              },
            },
            node: {
              type: 'object',
              required: ['network'],
              properties: {
                network: {
                  type: 'object',
                  required: [],
                  properties: {
                    listenTCP: {
                      type: 'object',
                      required: ['port'],
                      properties: {
                        host: { type: 'string' },
                        port: { type: 'number' },
                      },
                    },
                    externalEndpoints: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    connectPeersDelayMS: { type: 'number' },
                    socketTimeoutMS: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        options: {
          type: 'object',
          required: ['node', 'rpc'],
          properties: {
            node: {
              consensus: {
                type: 'object',
                required: ['enabled', 'options'],
                properties: {
                  enabled: { type: 'boolean' },
                  options: {
                    type: 'object',
                    required: ['privateKey'],
                    properties: {
                      privateKey: { type: 'string' },
                    },
                  },
                },
              },
              network: {
                type: 'object',
                required: ['seeds'],
                properties: {
                  seeds: { type: 'array', items: { type: 'string' } },
                  maxConnectedPeers: { type: 'number' },
                },
              },
            },
            rpc: {
              type: 'object',
              required: ['server', 'readyHealthCheck'],
              properties: {
                server: {
                  type: 'object',
                  required: ['keepAliveTimeout'],
                  properties: {
                    keepAliveTimeout: { type: 'number' },
                  },
                },
                readyHealthCheck: {
                  type: 'object',
                  required: ['rpcEndpoints', 'offset', 'timeoutMS'],
                  properties: {
                    rpcEndpoints: { type: 'array', items: { type: 'string' } },
                    offset: { type: 'number' },
                    timeoutMS: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    log,
    configPath: dataPath,
  });

export default class NEOBlockchainNodeAdapter extends NodeAdapter {
  _config: ?Config<NodeConfig>;
  _process: ?ChildProcess;

  constructor({
    log,
    name,
    binary,
    dataPath,
    portAllocator,
    settings,
  }: {|
    log: Log,
    name: string,
    binary: Binary,
    dataPath: string,
    portAllocator: PortAllocator,
    settings: NodeSettings,
  |}) {
    super({ log, name, binary, dataPath, portAllocator, settings });
    this._config = null;
    this._process = null;
  }

  async _create(): Promise<void> {
    await this._writeSettings(this._settings);
  }

  async _update(settings: NodeSettings): Promise<void> {
    const restart = await this._writeSettings(settings);
    if (restart && this._process != null) {
      await this.stop();
      await this.start();
    }
  }

  async _start(): Promise<void> {
    if (this._process == null) {
      // eslint-disable-next-line
      const child = spawn(
        this._binary.cmd,
        [this._binary.firstArg, 'start', 'node', this._dataPath],
        {
          windowsHide: true,
          stdio: 'ignore',
        },
      );
      this._process = child;
    }
  }

  async _stop(): Promise<void> {
    const child = this._process;
    this._process = null;
    if (child != null) {
      await killProcess(child.pid);
    }
  }

  _getNodeStatus(): NodeStatus {
    return {
      rpcAddress: this._getAddress('/rpc'),
      tcpAddress: `localhost:${this._settings.listenTCPPort}`,
    };
  }

  async _isLive(): Promise<boolean> {
    return this._checkRPC('/live_health_check');
  }

  async _isReady(): Promise<boolean> {
    return this._checkRPC('/ready_health_check');
  }

  async _checkRPC(rpcPath: string): Promise<boolean> {
    try {
      const response = await fetch(this._getAddress(rpcPath), { timeout: 500 });
      return response.status === 200;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') {
        this._log({
          event: 'NEO_BLOCKCHAIN_NODE_ADAPTER_CHECK_RPC_ERROR',
          rpcPath,
          error,
        });
      }
      return false;
    }
  }

  _getAddress(rpcPath: string): string {
    return `http://localhost:${this._settings.rpcPort}${rpcPath}`;
  }

  async _writeSettings(settings: NodeSettings): Promise<boolean> {
    let config = this._config;
    if (config == null) {
      config = createNodeConfig({
        log: this._log,
        dataPath: this._dataPath,
        defaultConfig: this._createConfig(settings),
      });
      this._config = config;
    }

    const nodeConfig = await config.config$.pipe(take(1)).toPromise();
    const newNodeConfig = this._createConfig(settings);
    await fs.ensureDir(newNodeConfig.environment.dataPath);
    await config.update({ config: newNodeConfig });

    return !(
      _.isEqual(nodeConfig.settings, newNodeConfig.settings) &&
      _.isEqual(nodeConfig.environment, newNodeConfig.environment)
    );
  }

  _createConfig(settings: NodeSettings): NodeConfig {
    return {
      log: {
        level: 'info',
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
      settings: {
        test: settings.isTestNet,
        privateNet: settings.privateNet,
        secondsPerBlock: settings.secondsPerBlock,
        standbyValidators: settings.standbyValidators,
        address: settings.address,
      },
      environment: {
        dataPath: path.resolve(this._dataPath, 'chain'),
        rpc: {
          http: {
            port: settings.rpcPort,
            host: '0.0.0.0',
          },
        },
        node: {
          network: {
            listenTCP: {
              port: settings.listenTCPPort,
              host: '0.0.0.0',
            },
          },
        },
      },
      options: {
        node: {
          consensus: settings.consensus,
          network: {
            seeds: (settings.seeds: $FlowFixMe),
          },
        },
        rpc: {
          server: {
            keepAliveTimeout: 60000,
          },
          readyHealthCheck: {
            rpcEndpoints: settings.rpcEndpoints,
            offset: 1,
            timeoutMS: 5000,
          },
        },
      },
    };
  }

  getDebug(): DescribeTable {
    return super
      .getDebug()
      .concat([
        ['Process ID', this._process == null ? 'null' : `${this._process.pid}`],
        [
          'Config Path',
          this._config == null ? 'null' : this._config._configPath,
        ],
      ]);
  }
}
