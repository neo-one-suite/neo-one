/* @flow */
import { type ChildProcess } from 'child_process';
import {
  type Binary,
  type DescribeTable,
  type PortAllocator,
  Config,
  killProcess,
} from '@neo-one/server-plugin';
import type { FullNodeEnvironment, FullNodeOptions } from '@neo-one/node';
import type { Monitor } from '@neo-one/monitor';

import _ from 'lodash';
import { createEndpoint } from '@neo-one/node-core';
import execa from 'execa';
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

const DEFAULT_RPC_URLS = [
  'http://seed1.cityofzion.io:8080',
  'http://seed2.cityofzion.io:8080',
  'http://seed3.cityofzion.io:8080',
  'http://seed4.cityofzion.io:8080',
  'http://seed5.cityofzion.io:8080',
  'https://seed1.neo.org:10332',
  'http://seed2.neo.org:10332',
  'http://seed3.neo.org:10332',
  'http://seed4.neo.org:10332',
  'http://seed5.neo.org:10332',
  'http://api.otcgo.cn:10332',
];

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
        options: { privateKey: 'default', privateNet: false },
      },
      network: {
        seeds: [
          { type: 'tcp', host: 'seed1.cityofzion.io', port: 10333 },
          { type: 'tcp', host: 'seed2.cityofzion.io', port: 10333 },
          { type: 'tcp', host: 'seed3.cityofzion.io', port: 10333 },
          { type: 'tcp', host: 'seed4.cityofzion.io', port: 10333 },
          { type: 'tcp', host: 'seed5.cityofzion.io', port: 10333 },
          { type: 'tcp', host: 'seed1.neo.org', port: 10333 },
          { type: 'tcp', host: 'seed2.neo.org', port: 10333 },
          { type: 'tcp', host: 'seed3.neo.org', port: 10333 },
          { type: 'tcp', host: 'seed4.neo.org', port: 10333 },
          { type: 'tcp', host: 'seed5.neo.org', port: 10333 },
        ].map(seed => createEndpoint(seed)),
      },
      rpcURLs: DEFAULT_RPC_URLS,
    },
    rpc: {
      server: {
        keepAliveTimeout: 60000,
      },
      liveHealthCheck: {
        rpcURLs: DEFAULT_RPC_URLS,
        offset: 1,
        timeoutMS: 5000,
      },
      readyHealthCheck: {
        rpcURLs: DEFAULT_RPC_URLS,
        offset: 1,
        timeoutMS: 5000,
      },
    },
  },
});

export const createNodeConfig = ({
  dataPath,
  defaultConfig: defaultConfigIn,
}: {|
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
              type: 'object',
              required: ['consensus', 'rpcURLs', 'network'],
              properties: {
                consensus: {
                  type: 'object',
                  required: ['enabled', 'options'],
                  properties: {
                    enabled: { type: 'boolean' },
                    options: {
                      type: 'object',
                      required: ['privateKey', 'privateNet'],
                      properties: {
                        privateKey: { type: 'string' },
                        privateNet: { type: 'boolean' },
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
                rpcURLs: { type: 'array', items: { type: 'string' } },
              },
            },
            rpc: {
              type: 'object',
              required: ['server', 'liveHealthCheck', 'readyHealthCheck'],
              properties: {
                server: {
                  type: 'object',
                  required: ['keepAliveTimeout'],
                  properties: {
                    keepAliveTimeout: { type: 'number' },
                  },
                },
                liveHealthCheck: {
                  type: 'object',
                  required: ['rpcURLs', 'offset', 'timeoutMS'],
                  properties: {
                    rpcURLs: { type: 'array', items: { type: 'string' } },
                    offset: { type: 'number' },
                    timeoutMS: { type: 'number' },
                  },
                },
                readyHealthCheck: {
                  type: 'object',
                  required: ['rpcURLs', 'offset', 'timeoutMS'],
                  properties: {
                    rpcURLs: { type: 'array', items: { type: 'string' } },
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
    configPath: dataPath,
  });

export default class NEOONENodeAdapter extends NodeAdapter {
  _config: ?Config<NodeConfig>;
  _process: ?ChildProcess;

  constructor({
    monitor,
    name,
    binary,
    dataPath,
    portAllocator,
    settings,
  }: {|
    monitor: Monitor,
    name: string,
    binary: Binary,
    dataPath: string,
    portAllocator: PortAllocator,
    settings: NodeSettings,
  |}) {
    super({
      monitor: monitor.at('neo_one_node_adapter'),
      name,
      binary,
      dataPath,
      portAllocator,
      settings,
    });
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
      const child = execa(
        this._binary.cmd,
        this._binary.firstArgs.concat(['start', 'node', this._dataPath]),
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
      telemetryAddress: `http://localhost:${
        this._settings.telemetryPort
      }/metrics`,
    };
  }

  async _isLive(timeoutMS: number): Promise<boolean> {
    return this._checkRPC('/live_health_check', timeoutMS);
  }

  async _isReady(timeoutMS: number): Promise<boolean> {
    return this._checkRPC('/ready_health_check', timeoutMS);
  }

  async _checkRPC(rpcPath: string, timeoutMS: number): Promise<boolean> {
    try {
      const response = await fetch(this._getAddress(rpcPath), {
        timeout: timeoutMS,
      });
      return response.status === 200;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') {
        this._monitor
          .withData({ [this._monitor.labels.HTTP_PATH]: rpcPath })
          .logError({
            name: 'http_client_request',
            message: 'Failed to check RPC.',
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
        telemetry: {
          port: settings.telemetryPort,
        },
      },
      options: {
        node: {
          consensus: settings.consensus,
          network: {
            seeds: (settings.seeds: $FlowFixMe),
          },
          rpcURLs: settings.rpcEndpoints,
        },
        rpc: {
          server: {
            keepAliveTimeout: 60000,
          },
          liveHealthCheck: {
            rpcURLs: settings.rpcEndpoints,
            offset: 1,
            timeoutMS: 5000,
          },
          readyHealthCheck: {
            rpcURLs: settings.rpcEndpoints,
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
