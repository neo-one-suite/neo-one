import { createReadClient } from '@neo-one/client';
import { common, crypto } from '@neo-one/client-core';
import { createEndpoint } from '@neo-one/node-core';
import { Binary, DescribeTable, PortAllocator, ResourceState, TaskList } from '@neo-one/server-plugin';
import { labels } from '@neo-one/utils';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import { BehaviorSubject, combineLatest, Observable, timer } from 'rxjs';
import { concatMap, shareReplay, switchMap } from 'rxjs/operators';
import { constants } from './constants';
import { Network, NetworkResourceOptions, NetworkResourceType } from './NetworkResourceType';
import { NEOONENodeAdapter, NodeAdapter } from './node';
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
  readonly nodes: ReadonlyArray<NodeAdapter>;
}

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
    let type: string;
    let nodeSettings;
    if (staticOptions.name === constants.NETWORK_NAME.MAIN) {
      type = constants.NETWORK_TYPE.MAIN;
      nodeSettings = [[staticOptions.name, this.getMainSettings(staticOptions)]];
    } else if (staticOptions.name === constants.NETWORK_NAME.TEST) {
      type = constants.NETWORK_TYPE.TEST;
      nodeSettings = [[staticOptions.name, this.getTestSettings(staticOptions)]];
    } else {
      type = constants.NETWORK_TYPE.PRIVATE;
      nodeSettings = this.getPrivateNetSettings(staticOptions);
    }

    const nodeOptionss = nodeSettings.map(([name, settings]) => ({
      type,
      name,
      dataPath: path.resolve(staticOptions.nodesPath, name),
      settings,
      options,
    }));

    const nodeOptionsAndNodes = nodeOptionss.map((nodeOptions) => [
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

        {
          title: 'Wait for network to be alive',
          task: () =>
            new TaskList({
              tasks: nodeOptionsAndNodes.map(([nodeOptions, node]) => ({
                title: `Waiting for node ${nodeOptions.name}`,
                task: async () => {
                  await node.live(5);
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
  ): ReadonlyArray<[string, NodeSettings]> {
    const primaryPrivateKey = crypto.wifToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY, common.NEO_PRIVATE_KEY_VERSION);

    const primaryAddress = common.uInt160ToString(crypto.privateKeyToScriptHash(primaryPrivateKey));

    const configuration = _.range(0, 1).map((idx) => {
      const { privateKey, publicKey } = crypto.createKeyPair();
      const name = `${options.name}-${idx}`;

      return {
        name,
        rpcPort: this.getRPCPort(options, name),
        listenTCPPort: this.getListenTCPPort(options, name),
        telemetryPort: this.getTelemetryPort(options, name),
        privateKey,
        publicKey,
      };
    });
    const secondsPerBlock = 15;
    const standbyValidators = configuration.map(({ publicKey }) => common.ecPointToString(publicKey));

    return configuration.map((config) => {
      const { name, rpcPort, listenTCPPort, telemetryPort, privateKey } = config;
      const otherConfiguration = configuration.filter(({ name: otherName }) => name !== otherName);

      const settings = {
        type: 'private',
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

      return [name, settings];
    });
  }

  private static getMainSettings(options: NetworkResourceAdapterStaticOptions): NodeSettings {
    return {
      type: 'main',
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
      ].map(createEndpoint),
      rpcEndpoints: [
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
      ],
    };
  }

  private static getTestSettings(options: NetworkResourceAdapterStaticOptions): NodeSettings {
    return {
      type: 'test',
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

      seeds: [
        { type: 'tcp', host: 'seed1.neo.org', port: 20333 },
        { type: 'tcp', host: 'seed2.neo.org', port: 20333 },
        { type: 'tcp', host: 'seed3.neo.org', port: 20333 },
        { type: 'tcp', host: 'seed4.neo.org', port: 20333 },
        { type: 'tcp', host: 'seed5.neo.org', port: 20333 },
      ].map(createEndpoint),
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
    { resourceType, binary, portAllocator }: NetworkResourceAdapterStaticOptions,
    { name, dataPath, settings, options }: NodeOptions,
  ): NodeAdapter {
    if (options.type === undefined || options.type === 'neo-one') {
      return new NEOONENodeAdapter({
        monitor: resourceType.plugin.monitor,
        name,
        binary,
        dataPath,
        portAllocator,
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
  private readonly binary: Binary;
  private readonly dataPath: string;
  private readonly portAllocator: PortAllocator;
  private readonly resourceType: NetworkResourceType;
  private readonly nodesPath: string;
  private readonly nodesOptionsPath: string;
  private readonly state: ResourceState;
  private readonly nodes$: BehaviorSubject<ReadonlyArray<NodeAdapter>>;

  public constructor({
    name,
    type,
    binary,
    dataPath,
    portAllocator,
    resourceType,
    nodesPath,
    nodesOptionsPath,
    nodes: nodesIn,
  }: NetworkResourceAdapterOptions) {
    this.name = name;
    this.type = type;
    this.binary = binary;
    this.dataPath = dataPath;
    this.portAllocator = portAllocator;
    this.resourceType = resourceType;
    this.nodesPath = nodesPath;
    this.nodesOptionsPath = nodesOptionsPath;
    this.nodes$ = new BehaviorSubject(nodesIn);
    this.state = 'stopped';

    this.resource$ = this.nodes$.pipe(
      switchMap((nodes) =>
        combineLatest(timer(0, 2500), combineLatest(nodes.map((node) => node.node$))).pipe(
          // tslint:disable-next-line no-unused
          concatMap(async ([time, currentNodes]) => {
            const readyNode =
              currentNodes.find((node) => node.ready) || currentNodes.find((node) => node.live) || currentNodes[0];
            let height;
            let peers;
            // tslint:disable-next-line strict-type-predicates
            if (readyNode !== undefined) {
              const client = createReadClient({
                network: this.name,
                rpcURL: readyNode.rpcAddress,
              });

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
            };
          }),
        ),
      ),

      shareReplay(1),
    );
  }

  public getDebug(): DescribeTable {
    return [
      ['Type', this.type],
      ['Data Path', this.dataPath],
      ['Nodes Path', this.nodesPath],
      ['Nodes Options Path', this.nodesOptionsPath],
      ['State', this.state],
      [
        'Nodes',
        {
          type: 'describe',
          table: this.nodes.map((node) => [node.name, { type: 'describe', table: node.getDebug() }]),
        },
      ],
    ];
  }

  private get nodes(): ReadonlyArray<NodeAdapter> {
    return this.nodes$.value;
  }

  public async destroy(): Promise<void> {
    this.nodes$.next([]);
  }

  // tslint:disable-next-line no-unused
  public delete(options: NetworkResourceOptions): TaskList {
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

  // tslint:disable-next-line no-unused
  public start(options: NetworkResourceOptions): TaskList {
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
      ],
    });
  }

  // tslint:disable-next-line no-unused
  public stop(options: NetworkResourceOptions): TaskList {
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
