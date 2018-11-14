import { Monitor } from '@neo-one/monitor';
import { FullNodeEnvironment, FullNodeOptions } from '@neo-one/node';
import { createEndpoint, EndpointConfig } from '@neo-one/node-core';
import { Binary, Config, DescribeTable, killProcess } from '@neo-one/server-plugin';
import fetch from 'cross-fetch';
import execa from 'execa';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { take } from 'rxjs/operators';
import { NodeSettings } from '../types';
import { NodeAdapter, NodeStatus } from './NodeAdapter';

export interface NodeConfig {
  readonly log: {
    readonly level: string;
    readonly maxSize: number;
    readonly maxFiles: number;
  };

  readonly settings: {
    readonly test?: boolean;
    readonly privateNet?: boolean;
    readonly secondsPerBlock?: number;
    readonly standbyValidators?: ReadonlyArray<string>;
    readonly address?: string;
  };

  readonly environment: FullNodeEnvironment;
  readonly options: FullNodeOptions;
}

const DEFAULT_RPC_URLS: ReadonlyArray<string> = [
  'http://node1.nyc3.bridgeprotocol.io:10332',
  'http://node2.nyc3.bridgeprotocol.io:10332',
  'https://seed1.switcheo.network:10331',
  'https://seed2.switcheo.network:10331',
  'https://seed3.switcheo.network:10331',
  'http://seed1.aphelion-neo.com:10332',
  'http://seed2.aphelion-neo.com:10332',
  'http://seed3.aphelion-neo.com:10332',
  'http://seed4.aphelion-neo.com:10332',
];

const DEFAULT_SEEDS: ReadonlyArray<EndpointConfig> = [
  { type: 'tcp', host: 'node1.nyc3.bridgeprotocol.io', port: 10333 },
  { type: 'tcp', host: 'node2.nyc3.bridgeprotocol.io', port: 10333 },
  { type: 'tcp', host: 'seed1.switcheo.com', port: 10333 },
  { type: 'tcp', host: 'seed2.switcheo.com', port: 10333 },
  { type: 'tcp', host: 'seed3.switcheo.com', port: 10333 },
  { type: 'tcp', host: 'seed1.aphelion-neo.com', port: 10333 },
  { type: 'tcp', host: 'seed2.aphelion-neo.com', port: 10333 },
  { type: 'tcp', host: 'seed3.aphelion-neo.com', port: 10333 },
  { type: 'tcp', host: 'seed4.aphelion-neo.com', port: 10333 },
];

const makeDefaultConfig = (dataPath: string): NodeConfig => ({
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
    node: {},
    network: {},
  },
  options: {
    node: {
      consensus: {
        enabled: false,
        options: { privateKey: 'default', privateNet: false },
      },
      rpcURLs: [...DEFAULT_RPC_URLS],
    },
    network: {
      seeds: DEFAULT_SEEDS.map(createEndpoint),
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
  defaultConfig = makeDefaultConfig(dataPath),
}: {
  readonly dataPath: string;
  readonly defaultConfig?: NodeConfig;
}): Config<NodeConfig> =>
  new Config({
    name: 'node',
    defaultConfig,
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
          required: ['dataPath', 'rpc', 'node', 'network'],
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
              required: [],
              properties: {
                externalPort: { type: 'number' },
              },
            },
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
        options: {
          type: 'object',
          required: ['node', 'network', 'rpc'],
          properties: {
            node: {
              type: 'object',
              required: ['consensus', 'rpcURLs'],
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
                rpcURLs: { type: 'array', items: { type: 'string' } },
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

export class NEOONENodeAdapter extends NodeAdapter {
  private mutableConfig: Config<NodeConfig> | undefined;
  private mutableProcess: execa.ExecaChildProcess | undefined;

  public constructor({
    monitor,
    name,
    binary,
    dataPath,
    settings,
  }: {
    readonly monitor: Monitor;
    readonly name: string;
    readonly binary: Binary;
    readonly dataPath: string;
    readonly settings: NodeSettings;
  }) {
    super({
      monitor: monitor.at('neo_one_node_adapter'),
      name,
      binary,
      dataPath,
      settings,
    });
  }

  public getDebug(): DescribeTable {
    return super
      .getDebug()
      .concat([
        ['Process ID', this.mutableProcess === undefined ? 'null' : `${this.mutableProcess.pid}`],
        ['Config Path', this.mutableConfig === undefined ? 'null' : this.mutableConfig.configPath],
      ]);
  }

  public getNodeStatus(): NodeStatus {
    return {
      rpcAddress: this.getAddress('/rpc'),
      tcpAddress: `localhost:${this.mutableSettings.listenTCPPort}`,
      telemetryAddress: `http://localhost:${this.mutableSettings.telemetryPort}/metrics`,
    };
  }

  protected async isLive(): Promise<boolean> {
    return this.checkRPC('/live_health_check');
  }

  protected async isReady(): Promise<boolean> {
    return this.checkRPC('/ready_health_check');
  }

  protected async createInternal(): Promise<void> {
    await this.writeSettings(this.mutableSettings);
  }

  protected async updateInternal(settings: NodeSettings): Promise<void> {
    const restart = await this.writeSettings(settings);
    if (restart && this.mutableProcess !== undefined) {
      await this.stop();
      await this.start();
    }
  }

  protected async startInternal(): Promise<void> {
    if (this.mutableProcess === undefined) {
      const child = execa(this.binary.cmd, this.binary.firstArgs.concat(['start', 'node', this.dataPath]), {
        // @ts-ignore
        windowsHide: true,
        stdio: 'ignore',
      });

      this.mutableProcess = child;
      // tslint:disable-next-line no-floating-promises
      child
        .then(() => {
          this.monitor.log({
            name: 'neo_node_adapter_node_exit',
            message: 'Child process exited',
          });

          this.mutableProcess = undefined;
        })
        .catch((error: Error) => {
          this.monitor.logError({
            name: 'neo_node_adapter_node_error',
            message: 'Child process exited with an error.',
            error,
          });

          this.mutableProcess = undefined;
        });
    }
  }

  protected async stopInternal(): Promise<void> {
    const child = this.mutableProcess;
    this.mutableProcess = undefined;
    if (child !== undefined) {
      await killProcess(child.pid);
    }
  }

  private async checkRPC(rpcPath: string): Promise<boolean> {
    try {
      const response = await fetch(this.getAddress(rpcPath));

      return response.ok;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') {
        this.monitor.withData({ [this.monitor.labels.HTTP_PATH]: rpcPath }).logError({
          name: 'http_client_request',
          message: 'Failed to check RPC.',
          error,
        });
      }

      return false;
    }
  }

  private getAddress(rpcPath: string): string {
    return `http://localhost:${this.mutableSettings.rpcPort}${rpcPath}`;
  }

  private async writeSettings(settings: NodeSettings): Promise<boolean> {
    let config = this.mutableConfig;
    if (config === undefined) {
      config = createNodeConfig({
        dataPath: this.dataPath,
        defaultConfig: this.createConfig(settings),
      });

      this.mutableConfig = config;
    }

    const nodeConfig = await config.config$.pipe(take(1)).toPromise();
    const newNodeConfig = this.createConfig(settings);
    await fs.ensureDir(newNodeConfig.environment.dataPath);
    await config.update({ config: newNodeConfig });

    return !(
      _.isEqual(nodeConfig.settings, newNodeConfig.settings) &&
      _.isEqual(nodeConfig.environment, newNodeConfig.environment)
    );
  }

  private createConfig(settings: NodeSettings): NodeConfig {
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
        dataPath: path.resolve(this.dataPath, 'chain'),
        rpc: {
          http: {
            port: settings.rpcPort,
            host: '0.0.0.0',
          },
        },
        node: {
          externalPort: settings.listenTCPPort,
        },
        network: {
          listenTCP: {
            port: settings.listenTCPPort,
            host: '0.0.0.0',
          },
        },
        telemetry: {
          port: settings.telemetryPort,
        },
      },
      options: {
        node: {
          consensus: settings.consensus,
          rpcURLs: settings.rpcEndpoints,
        },
        network: {
          seeds: settings.seeds,
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
}
