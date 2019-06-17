import { common, crypto } from '@neo-one/client-common';
import { NEOONEDataProvider } from '@neo-one/client-core';
import { ReadClient } from '@neo-one/client-full-core';
import { createEndpoint, EndpointConfig } from '@neo-one/node-core';
import {
  Binary,
  DescribeTable,
  PortAllocator,
  ResourceState,
  SubDescribeTable,
  TaskList,
} from '@neo-one/server-plugin';
import { labels, mergeScanLatest, utils } from '@neo-one/utils';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BehaviorSubject, combineLatest, Observable, timer } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { constants } from './constants';
import { Network, NetworkResourceOptions, NetworkResourceType } from './NetworkResourceType';
import { NEOONENodeAdapter, Node, NodeAdapter } from './node';
import { NetworkType, NodeSettings } from './types';

export interface NodeOptions {
  readonly type: NetworkType;
  readonly name: string;
  readonly dataPath: string;
  readonly settings: NodeSettings;
  readonly options: NetworkResourceOptions;
}

const NODES_PATH = 'nodes';
const NODES_OPTIONS_PATH = 'options';

export interface NetworkResourceAdapterInitOptions {
  readonly name: string;
  readonly dataPath: string;
  readonly binary: Binary;
  readonly portAllocator: PortAllocator;
  readonly resourceType: NetworkResourceType;
}

export interface NetworkResourceAdapterStaticOptions extends NetworkResourceAdapterInitOptions {
  readonly nodesPath: string;
  readonly nodesOptionsPath: string;
}

export interface NetworkResourceAdapterOptions extends NetworkResourceAdapterStaticOptions {
  readonly type: NetworkType;
  readonly nodes: readonly NodeAdapter[];
}

const DEFAULT_MAIN_SEEDS: readonly EndpointConfig[] = [
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

const DEFAULT_TEST_SEEDS: readonly EndpointConfig[] = [
  { type: 'tcp', host: 'seed1.neo.org', port: 20333 },
  { type: 'tcp', host: 'seed2.neo.org', port: 20333 },
  { type: 'tcp', host: 'seed3.neo.org', port: 20333 },
  { type: 'tcp', host: 'seed4.neo.org', port: 20333 },
  { type: 'tcp', host: 'seed5.neo.org', port: 20333 },
];

export class NetworkResourceAdapter {
  public static async init(options: NetworkResourceAdapterInitOptions): Promise<NetworkResourceAdapter> {
    const staticOptions = this.getStaticOptions(options);
    const files = await fs.readdir(staticOptions.nodesOptionsPath);
    const nodeOptionss = await Promise.all(
      files.map(async (file) =>
        this.readNodeOptions(staticOptions, path.resolve(staticOptions.nodesOptionsPath, file)),
      ),
    );

    const nodes = nodeOptionss.map((nodeOptions) => this.createNodeAdapter(staticOptions, nodeOptions));

    return new this({
      name: staticOptions.name,
      binary: staticOptions.binary,
      dataPath: staticOptions.dataPath,
      portAllocator: staticOptions.portAllocator,
      resourceType: staticOptions.resourceType,
      nodesPath: staticOptions.nodesPath,
      nodesOptionsPath: staticOptions.nodesOptionsPath,
      type: nodeOptionss[0].type,
      nodes,
    });
  }

  public static create(adapterOptions: NetworkResourceAdapterInitOptions, options: NetworkResourceOptions): TaskList {
    const staticOptions = this.getStaticOptions(adapterOptions);
    let type: NodeOptions['type'];
    let nodeSettings: ReadonlyArray<readonly [string, NodeSettings]>;
    if (staticOptions.name === constants.NETWORK_NAME.MAIN) {
      type = NetworkType.Main;
      nodeSettings = [[staticOptions.name, this.getMainSettings(staticOptions)] as const];
    } else if (staticOptions.name === constants.NETWORK_NAME.TEST) {
      type = NetworkType.Test;
      nodeSettings = [[staticOptions.name, this.getTestSettings(staticOptions)] as const];
    } else {
      type = NetworkType.Private;
      nodeSettings = this.getPrivateNetSettings(staticOptions);
    }

    const nodeOptionss = nodeSettings.map<NodeOptions>(([name, settings]) => ({
      type,
      name,
      dataPath: path.resolve(staticOptions.nodesPath, name),
      settings,
      options,
    }));

    const nodeOptionsAndNodes = nodeOptionss.map<[NodeOptions, NodeAdapter]>((nodeOptions) => [
      nodeOptions,
      this.createNodeAdapter(staticOptions, nodeOptions),
    ]);

    return new TaskList({
      initialContext: {
        resourceAdapter: new this({
          name: staticOptions.name,
          binary: staticOptions.binary,
          dataPath: staticOptions.dataPath,
          portAllocator: staticOptions.portAllocator,
          resourceType: staticOptions.resourceType,
          nodesPath: staticOptions.nodesPath,
          nodesOptionsPath: staticOptions.nodesOptionsPath,
          type: nodeSettings[0][1].type,
          nodes: nodeOptionsAndNodes.map((value) => value[1]),
        }),

        dependencies: [],
      },
      tasks: [
        {
          title: 'Create data directories',
          task: async () => {
            await Promise.all([fs.ensureDir(staticOptions.nodesPath), fs.ensureDir(staticOptions.nodesOptionsPath)]);
          },
        },
        {
          title: 'Create nodes',
          task: () =>
            new TaskList({
              tasks: nodeOptionsAndNodes.map(([nodeOptions, node]) => ({
                title: `Create node ${nodeOptions.name}`,
                task: async () => {
                  await this.writeNodeOptions(staticOptions, nodeOptions);
                  await node.create();
                },
              })),

              concurrent: true,
            }),
        },
      ],
    });
  }

  private static getStaticOptions(options: NetworkResourceAdapterInitOptions): NetworkResourceAdapterStaticOptions {
    return {
      name: options.name,
      binary: options.binary,
      dataPath: options.dataPath,
      portAllocator: options.portAllocator,
      resourceType: options.resourceType,
      nodesPath: path.resolve(options.dataPath, NODES_PATH),
      nodesOptionsPath: path.resolve(options.dataPath, NODES_OPTIONS_PATH),
    };
  }

  private static getPrivateNetSettings(
    options: NetworkResourceAdapterStaticOptions,
  ): ReadonlyArray<readonly [string, NodeSettings]> {
    const primaryPrivateKey = crypto.wifToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY, common.NEO_PRIVATE_KEY_VERSION);
    const primaryPublicKey = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
    crypto.addPublicKey(primaryPrivateKey, primaryPublicKey);

    const primaryAddress = common.uInt160ToString(crypto.privateKeyToScriptHash(primaryPrivateKey));

    const configurationName = `${options.name}-0`;
    const configuration = [
      {
        name: configurationName,
        rpcPort: this.getRPCPort(options, configurationName),
        listenTCPPort: this.getListenTCPPort(options, configurationName),
        telemetryPort: this.getTelemetryPort(options, configurationName),
        privateKey: primaryPrivateKey,
        publicKey: primaryPublicKey,
      },
    ];
    const secondsPerBlock = 15;
    const standbyValidators = configuration.map(({ publicKey }) => common.ecPointToString(publicKey));

    return configuration.map<readonly [string, NodeSettings]>((config) => {
      const { name, rpcPort, listenTCPPort, telemetryPort, privateKey } = config;
      const otherConfiguration = configuration.filter(({ name: otherName }) => name !== otherName);

      const settings = {
        type: NetworkType.Private,
        isTestNet: false,
        rpcPort,
        listenTCPPort,
        telemetryPort,
        privateNet: true,
        secondsPerBlock,
        standbyValidators,
        address: primaryAddress,
        consensus: {
          enabled: true,
          options: {
            privateKey: common.privateKeyToString(privateKey),
            privateNet: true,
          },
        },

        seeds: otherConfiguration.map((otherConfig) =>
          createEndpoint({
            type: 'tcp',
            host: 'localhost',
            port: otherConfig.listenTCPPort,
          }),
        ),

        rpcEndpoints: otherConfiguration.map((otherConfig) => `http://localhost:${otherConfig.rpcPort}/rpc`),
      };

      return [name, settings] as const;
    });
  }

  private static getMainSettings(options: NetworkResourceAdapterStaticOptions): NodeSettings {
    return {
      type: NetworkType.Main,
      isTestNet: false,
      rpcPort: this.getRPCPort(options, options.name),
      listenTCPPort: this.getListenTCPPort(options, options.name),
      telemetryPort: this.getTelemetryPort(options, options.name),
      consensus: {
        enabled: false,
        options: {
          privateKey: 'doesntmatter',
          privateNet: false,
        },
      },
      seeds: DEFAULT_MAIN_SEEDS.map(createEndpoint),
      rpcEndpoints: [
        'http://node1.nyc3.bridgeprotocol.io:10332',
        'http://node2.nyc3.bridgeprotocol.io:10332',
        'https://seed1.switcheo.network:10331',
        'https://seed2.switcheo.network:10331',
        'https://seed3.switcheo.network:10331',
        'http://seed1.aphelion-neo.com:10332',
        'http://seed2.aphelion-neo.com:10332',
        'http://seed3.aphelion-neo.com:10332',
        'http://seed4.aphelion-neo.com:10332',
      ],
    };
  }

  private static getTestSettings(options: NetworkResourceAdapterStaticOptions): NodeSettings {
    return {
      type: NetworkType.Test,
      isTestNet: true,
      rpcPort: this.getRPCPort(options, options.name),
      listenTCPPort: this.getListenTCPPort(options, options.name),
      telemetryPort: this.getTelemetryPort(options, options.name),
      consensus: {
        enabled: false,
        options: {
          privateKey: 'doesntmatter',
          privateNet: false,
        },
      },

      seeds: DEFAULT_TEST_SEEDS.map(createEndpoint),
      rpcEndpoints: [
        'http://test1.cityofzion.io:8880',
        'http://test2.cityofzion.io:8880',
        'http://test3.cityofzion.io:8880',
        'http://test4.cityofzion.io:8880',
        'http://test5.cityofzion.io:8880',
        'https://seed1.neo.org:20332',
        'http://seed2.neo.org:20332',
        'http://seed3.neo.org:20332',
        'http://seed4.neo.org:20332',
        'http://seed5.neo.org:20332',
      ],
    };
  }

  private static createNodeAdapter(
    { resourceType, binary }: NetworkResourceAdapterStaticOptions,
    { name, dataPath, settings, options }: NodeOptions,
  ): NodeAdapter {
    if (options.type === undefined || options.type === 'neo-one') {
      return new NEOONENodeAdapter({
        monitor: resourceType.plugin.monitor,
        name,
        binary,
        dataPath,
        settings,
      });
    }

    throw new Error(`Unknown Node type ${options.type}`);
  }

  private static getRPCPort(options: NetworkResourceAdapterStaticOptions, name: string): number {
    return this.getPort(options, `${name}-rpc-http`);
  }

  private static getListenTCPPort(options: NetworkResourceAdapterStaticOptions, name: string): number {
    return this.getPort(options, `${name}-listen-tcp`);
  }

  private static getTelemetryPort(options: NetworkResourceAdapterStaticOptions, name: string): number {
    return this.getPort(options, `${name}-telemetry`);
  }

  private static getPort(options: NetworkResourceAdapterStaticOptions, name: string): number {
    return options.portAllocator.allocatePort({
      plugin: options.resourceType.plugin.name,
      resourceType: options.resourceType.name,
      resource: options.name,
      name,
    });
  }

  private static async writeNodeOptions(
    options: NetworkResourceAdapterStaticOptions,
    nodeOptions: NodeOptions,
  ): Promise<void> {
    try {
      const nodeOptionsPath = this.getNodeOptionsPath(options, nodeOptions.name);

      await fs.writeFile(nodeOptionsPath, JSON.stringify(nodeOptions));
    } catch (error) {
      options.resourceType.plugin.monitor
        .withData({
          [labels.NODE_NAME]: nodeOptions.name,
        })
        .logError({
          name: 'neo_network_resource_adapter_write_node_options_error',
          message: 'Failed to persist node options',
          error,
        });

      throw error;
    }
  }

  private static async readNodeOptions(
    { resourceType }: NetworkResourceAdapterStaticOptions,
    nodeOptionsPath: string,
  ): Promise<NodeOptions> {
    try {
      const contents = await fs.readFile(nodeOptionsPath, 'utf8');

      return JSON.parse(contents);
    } catch (error) {
      resourceType.plugin.monitor
        .withData({
          [labels.NODE_OPTIONSPATH]: nodeOptionsPath,
        })
        .logError({
          name: 'neo_network_resource_adapter_read_node_options_error',
          message: 'Failed to read node options.',
          error,
        });

      throw error;
    }
  }

  private static getNodeOptionsPath({ nodesOptionsPath }: NetworkResourceAdapterStaticOptions, name: string): string {
    return path.resolve(nodesOptionsPath, `${name}.json`);
  }

  public readonly resource$: Observable<Network>;
  private readonly name: string;
  private readonly type: NetworkType;
  private readonly dataPath: string;
  private readonly resourceType: NetworkResourceType;
  private readonly nodesPath: string;
  private readonly nodesOptionsPath: string;
  private readonly state: ResourceState;
  private readonly nodes$: BehaviorSubject<readonly NodeAdapter[]>;

  public constructor({
    name,
    type,
    dataPath,
    resourceType,
    nodesPath,
    nodesOptionsPath,
    nodes: nodesIn,
  }: NetworkResourceAdapterOptions) {
    this.name = name;
    this.type = type;
    this.dataPath = dataPath;
    this.resourceType = resourceType;
    this.nodesPath = nodesPath;
    this.nodesOptionsPath = nodesOptionsPath;
    this.nodes$ = new BehaviorSubject(nodesIn);
    this.state = 'stopped';

    this.resource$ = this.nodes$.pipe(
      switchMap((nodes) =>
        combineLatest([timer(0, 2500), combineLatest(nodes.map((node) => node.node$))]).pipe(
          mergeScanLatest<[number, readonly Node[]], Network>(
            // tslint:disable-next-line no-unused
            async (_prev, [_time, currentNodes]): Promise<Network> => {
              const readyNode =
                currentNodes.find((node) => node.ready) ||
                currentNodes.find((node) => node.live) ||
                (currentNodes[0] as Node | undefined);
              let height;
              let peers;
              if (readyNode !== undefined) {
                const client = new ReadClient(
                  new NEOONEDataProvider({
                    network: this.name,
                    rpcURL: readyNode.rpcAddress,
                  }),
                );

                try {
                  [height, peers] = await Promise.all([client.getBlockCount(), client.getConnectedPeers()]);
                } catch {
                  // ignore errors
                }
              }

              return {
                plugin: this.resourceType.plugin.name,
                resourceType: this.resourceType.name,
                name: this.name,
                baseName: this.name,
                state: this.state,
                type: this.type,
                height,
                peers: peers === undefined ? peers : peers.length,
                nodes: currentNodes,
                live: this.live,
                ready: this.ready,
              };
            },
          ),
        ),
      ),
      shareReplay(1),
    );
  }

  public getDebug(): DescribeTable {
    return [
      ['Type', this.type] as const,
      ['Data Path', this.dataPath] as const,
      ['Nodes Path', this.nodesPath] as const,
      ['Nodes Options Path', this.nodesOptionsPath] as const,
      ['State', this.state] as const,
      [
        'Nodes',
        {
          type: 'describe',
          table: this.nodes.map<readonly [string, SubDescribeTable]>(
            (node) => [node.name, { type: 'describe', table: node.getDebug() }] as const,
          ),
        },
      ] as const,
    ];
  }

  private get nodes(): readonly NodeAdapter[] {
    return this.nodes$.value;
  }

  public async destroy(): Promise<void> {
    this.nodes$.next([]);
  }

  public delete(_options: NetworkResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean up local files',
          task: async () => {
            await fs.remove(this.dataPath);
          },
        },
      ],
    });
  }

  public start(_options: NetworkResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Start nodes',
          task: () =>
            new TaskList({
              tasks: this.nodes.map((node) => ({
                title: `Start node ${node.name}`,
                task: async () => {
                  await node.start();
                },
              })),
              concurrent: true,
            }),
        },
        {
          title: 'Wait for network to be alive',
          task: async () => {
            const start = utils.nowSeconds();
            await this.live();
            this.resourceType.plugin.monitor.log({
              name: 'neo_network_resource_adapter_node_live',
              message: `Started in ${utils.nowSeconds() - start} seconds`,
            });
          },
        },
      ],
    });
  }

  public readonly live = async () => {
    await Promise.all(
      this.nodes.map(async (node) => {
        try {
          await node.live(30);
        } catch {
          await node.stop();
          await node.start();
          await node.live(30);
        }
      }),
    );
  };

  public readonly ready = async () => {
    await Promise.all(
      this.nodes.map(async (node) => {
        try {
          await node.ready(30);
        } catch {
          await node.stop();
          await node.start();
          await node.ready(30);
        }
      }),
    );
  };

  public stop(_options: NetworkResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Stop nodes',
          task: () =>
            new TaskList({
              tasks: this.nodes.map((node) => ({
                title: `Stop node ${node.name}`,
                task: async () => {
                  await node.stop();
                },
              })),
              concurrent: true,
            }),
        },
      ],
    });
  }
}
