import { serverLogger } from '@neo-one/logger';
import { FullNodeOptions } from '@neo-one/node';
import { createEndpoint, EndpointConfig } from '@neo-one/node-core';
import { createMain, createTest, deserializeSettings, serializeSettings } from '@neo-one/node-neo-settings';
import { Binary, Config, DescribeTable, killProcess } from '@neo-one/server-plugin';
import { Labels } from '@neo-one/utils';
import fetch from 'cross-fetch';
import execa from 'execa';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { take } from 'rxjs/operators';
import { NodeSettings } from '../types';
import { NodeAdapter, NodeStatus } from './NodeAdapter';

const logger = serverLogger.child({ component: 'neo_one_node_adapter' });

export interface NodeConfig {
  // tslint:disable-next-line no-any
  readonly options: Omit<FullNodeOptions, 'blockchain'> & { readonly blockchain: any };
}

const DEFAULT_RPC_URLS: readonly string[] = [
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

const DEFAULT_SEEDS: readonly EndpointConfig[] = [
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
  options: {
    dataPath: path.resolve(dataPath, 'node'),
    blockchain: createMain(),
    node: {
      rpcURLs: [...DEFAULT_RPC_URLS],
    },
    network: {
      seeds: DEFAULT_SEEDS.map(createEndpoint),
    },
    rpc: {
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
    },
    configPath: dataPath,
  });

export const loadNodeOptions = async ({ dataPath }: { readonly dataPath: string }): Promise<FullNodeOptions> => {
  const contents = await fs.readFile(path.join(dataPath, 'node.json'), 'utf8');

  const { options } = JSON.parse(contents);

  return {
    ...options,
    blockchain: deserializeSettings(options.blockchain),
  };
};

export class NEOONENodeAdapter extends NodeAdapter {
  private mutableConfig: Config<NodeConfig> | undefined;
  private mutableProcess: execa.ExecaChildProcess | undefined;

  public constructor({
    name,
    binary,
    dataPath,
    settings,
  }: {
    readonly name: string;
    readonly binary: Binary;
    readonly dataPath: string;
    readonly settings: NodeSettings;
  }) {
    super({
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
        ['Process ID', this.mutableProcess === undefined ? 'null' : `${this.mutableProcess.pid}`] as const,
        ['Config Path', this.mutableConfig === undefined ? 'null' : this.mutableConfig.configPath] as const,
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
          logger.info({ title: 'neo_node_adapter_node_exit' }, 'Child process exited');
          this.mutableProcess = undefined;
        })
        .catch((error: Error) => {
          logger.error({ title: 'neo_node_adapter_node_error', error }, 'Child process exited with an error.');
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
        logger.error(
          { [Labels.HTTP_PATH]: rpcPath, title: 'http_client_request_error', error },
          'Failed to check RPC.',
        );
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
    await fs.ensureDir(newNodeConfig.options.dataPath);
    await config.update({ config: newNodeConfig });

    return !_.isEqual(nodeConfig.options, newNodeConfig.options);
  }

  private createConfig(settings: NodeSettings): NodeConfig {
    const blockchainSettings = {
      test: settings.isTestNet,
      privateNet: settings.privateNet,
      secondsPerBlock: settings.secondsPerBlock,
      standbyValidators: settings.standbyValidators,
      address: settings.address,
    };

    return {
      options: {
        blockchain: serializeSettings(
          blockchainSettings.test ? createTest(blockchainSettings) : createMain(blockchainSettings),
        ),
        dataPath: path.resolve(this.dataPath, 'chain'),
        node: {
          externalPort: settings.listenTCPPort,
          consensus: settings.consensus,
          rpcURLs: settings.rpcEndpoints,
        },
        network: {
          seeds: settings.seeds,
          listenTCP: {
            port: settings.listenTCPPort,
            host: '0.0.0.0',
          },
        },
        telemetry: {
          prometheus: {
            port: settings.telemetryPort,
          },
        },
        rpc: {
          http: {
            port: settings.rpcPort,
            host: '0.0.0.0',
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
