/* @flow */
import {
  type Binary,
  type DescribeTable,
  type PortAllocator,
  type ResourceState,
  TaskList,
} from '@neo-one/server-plugin';
import type { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import _ from 'lodash';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { common, crypto } from '@neo-one/client-core';
import { createEndpoint } from '@neo-one/node-core';
import { createReadClient } from '@neo-one/client';
import { concatMap, shareReplay, switchMap } from 'rxjs/operators';
import { labels } from '@neo-one/utils';
import { timer } from 'rxjs/observable/timer';
import fs from 'fs-extra';
import path from 'path';

import { type NodeAdapter, NEOONENodeAdapter } from './node';
import type { NetworkType, NodeSettings } from './types';
import type NetworkResourceType, {
  Network,
  NetworkResourceOptions,
} from './NetworkResourceType';

import constants from './constants';

export type NodeOptions = {|
  type: NetworkType,
  name: string,
  dataPath: string,
  settings: NodeSettings,
  options: NetworkResourceOptions,
|};

const NODES_PATH = 'nodes';
const NODES_OPTIONS_PATH = 'options';

export type NetworkResourceAdapterInitOptions = {|
  name: string,
  dataPath: string,
  binary: Binary,
  portAllocator: PortAllocator,
  resourceType: NetworkResourceType,
|};

export type NetworkResourceAdapterStaticOptions = {|
  ...NetworkResourceAdapterInitOptions,
  nodesPath: string,
  nodesOptionsPath: string,
|};

export type NetworkResourceAdapterOptions = {|
  ...NetworkResourceAdapterStaticOptions,
  type: NetworkType,
  nodes: Array<NodeAdapter>,
|};

export default class NetworkResourceAdapter {
  _name: string;
  _type: NetworkType;
  _binary: Binary;
  _dataPath: string;
  _portAllocator: PortAllocator;
  _resourceType: NetworkResourceType;
  _nodesPath: string;
  _nodesOptionsPath: string;
  _state: ResourceState;
  _nodes$: BehaviorSubject<Array<NodeAdapter>>;

  resource$: Observable<Network>;

  constructor({
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
    this._name = name;
    this._type = type;
    this._binary = binary;
    this._dataPath = dataPath;
    this._portAllocator = portAllocator;
    this._resourceType = resourceType;
    this._nodesPath = nodesPath;
    this._nodesOptionsPath = nodesOptionsPath;
    this._nodes$ = new BehaviorSubject(nodesIn);
    this._state = 'stopped';

    this.resource$ = this._nodes$.pipe(
      switchMap(nodes =>
        combineLatest(
          timer(0, 2500),
          combineLatest(nodes.map(node => node.node$)),
        ).pipe(
          // eslint-disable-next-line
          concatMap(async ([time, currentNodes]) => {
            const readyNode =
              currentNodes.find(node => node.ready) ||
              currentNodes.find(node => node.live) ||
              currentNodes[0];
            let height = null;
            let peers = null;
            if (readyNode != null) {
              const client = createReadClient({
                network: this._name,
                rpcURL: readyNode.rpcAddress,
              });
              try {
                [height, peers] = await Promise.all([
                  client.getBlockCount(),
                  client.getConnectedPeers(),
                ]);
              } catch (error) {
                // ignore errors
              }
            }

            return {
              plugin: this._resourceType.plugin.name,
              resourceType: this._resourceType.name,
              name: this._name,
              baseName: this._name,
              state: this._state,
              type: this._type,
              height,
              peers: peers == null ? peers : peers.length,
              nodes: currentNodes,
            };
          }),
        ),
      ),
      shareReplay(1),
    );
  }

  get _nodes(): Array<NodeAdapter> {
    return this._nodes$.value;
  }

  static async init(
    options: NetworkResourceAdapterInitOptions,
  ): Promise<NetworkResourceAdapter> {
    const staticOptions = this._getStaticOptions(options);
    const files = await fs.readdir(staticOptions.nodesOptionsPath);
    const nodeOptionss = await Promise.all(
      files.map(file =>
        this._readNodeOptions(
          staticOptions,
          path.resolve(staticOptions.nodesOptionsPath, file),
        ),
      ),
    );
    const nodes = nodeOptionss.map(nodeOptions =>
      this._createNodeAdapter(staticOptions, nodeOptions),
    );

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

  static _getStaticOptions(
    options: NetworkResourceAdapterInitOptions,
  ): NetworkResourceAdapterStaticOptions {
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

  async destroy(): Promise<void> {
    this._nodes$.next([]);
  }

  static create(
    adapterOptions: NetworkResourceAdapterInitOptions,
    options: NetworkResourceOptions,
  ): TaskList {
    const staticOptions = this._getStaticOptions(adapterOptions);
    let type;
    let nodeSettings;
    if (staticOptions.name === constants.NETWORK_NAME.MAIN) {
      type = constants.NETWORK_TYPE.MAIN;
      nodeSettings = [
        [staticOptions.name, this._getMainSettings(staticOptions)],
      ];
    } else if (staticOptions.name === constants.NETWORK_NAME.TEST) {
      type = constants.NETWORK_TYPE.TEST;
      nodeSettings = [
        [staticOptions.name, this._getTestSettings(staticOptions)],
      ];
    } else {
      type = constants.NETWORK_TYPE.PRIVATE;
      nodeSettings = this._getPrivateNetSettings(staticOptions);
    }
    const nodeOptionss = nodeSettings.map(([name, settings]) => ({
      type,
      name,
      dataPath: path.resolve(staticOptions.nodesPath, name),
      settings,
      options,
    }));
    const nodeOptionsAndNodes = nodeOptionss.map(nodeOptions => [
      nodeOptions,
      this._createNodeAdapter(staticOptions, nodeOptions),
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
          nodes: nodeOptionsAndNodes.map(value => value[1]),
        }),
        dependencies: [],
      },
      tasks: [
        {
          title: 'Create data directories',
          task: async () => {
            await Promise.all([
              fs.ensureDir(staticOptions.nodesPath),
              fs.ensureDir(staticOptions.nodesOptionsPath),
            ]);
          },
        },
        {
          title: 'Create nodes',
          task: () =>
            new TaskList({
              tasks: nodeOptionsAndNodes.map(([nodeOptions, node]) => ({
                title: `Create node ${nodeOptions.name}`,
                task: async () => {
                  await this._writeNodeOptions(staticOptions, nodeOptions);
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

  // eslint-disable-next-line
  delete(options: NetworkResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean up local files',
          task: async () => {
            await fs.remove(this._dataPath);
          },
        },
      ],
    });
  }

  // eslint-disable-next-line
  start(options: NetworkResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Start nodes',
          task: () =>
            new TaskList({
              tasks: this._nodes.map(node => ({
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

  // eslint-disable-next-line
  stop(options: NetworkResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Stop nodes',
          task: () =>
            new TaskList({
              tasks: this._nodes.map(node => ({
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

  static _getMainSettings(
    options: NetworkResourceAdapterStaticOptions,
  ): NodeSettings {
    return {
      type: 'main',
      isTestNet: false,
      rpcPort: this._getRPCPort(options, options.name),
      listenTCPPort: this._getListenTCPPort(options, options.name),
      telemetryPort: this._getTelemetryPort(options, options.name),
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
      ].map(seed => createEndpoint(seed)),
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

  static _getTestSettings(
    options: NetworkResourceAdapterStaticOptions,
  ): NodeSettings {
    return {
      type: 'test',
      isTestNet: true,
      rpcPort: this._getRPCPort(options, options.name),
      listenTCPPort: this._getListenTCPPort(options, options.name),
      telemetryPort: this._getTelemetryPort(options, options.name),
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
      ].map(seed => createEndpoint(seed)),
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

  static _getPrivateNetSettings(
    options: NetworkResourceAdapterStaticOptions,
  ): Array<[string, NodeSettings]> {
    const primaryPrivateKey = crypto.wifToPrivateKey(
      constants.PRIVATE_NET_PRIVATE_KEY,
      common.NEO_PRIVATE_KEY_VERSION,
    );
    const primaryAddress = common.uInt160ToString(
      crypto.privateKeyToScriptHash(primaryPrivateKey),
    );
    const configuration = _.range(0, 1).map(idx => {
      const { privateKey, publicKey } = crypto.createKeyPair();
      const name = `${options.name}-${idx}`;
      return {
        name,
        rpcPort: this._getRPCPort(options, name),
        listenTCPPort: this._getListenTCPPort(options, name),
        telemetryPort: this._getTelemetryPort(options, name),
        privateKey,
        publicKey,
      };
    });
    const secondsPerBlock = 15;
    const standbyValidators = configuration.map(({ publicKey }) =>
      common.ecPointToString(publicKey),
    );

    return configuration.map(config => {
      const {
        name,
        rpcPort,
        listenTCPPort,
        telemetryPort,
        privateKey,
      } = config;
      const otherConfiguration = configuration.filter(
        ({ name: otherName }) => name !== otherName,
      );

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
        seeds: otherConfiguration.map(otherConfig =>
          createEndpoint({
            type: 'tcp',
            host: 'localhost',
            port: otherConfig.listenTCPPort,
          }),
        ),
        rpcEndpoints: otherConfiguration.map(
          otherConfig => `http://localhost:${otherConfig.rpcPort}/rpc`,
        ),
      };

      return [name, settings];
    });
  }

  static _createNodeAdapter(
    {
      resourceType,
      binary,
      portAllocator,
    }: NetworkResourceAdapterStaticOptions,
    { name, dataPath, settings, options }: NodeOptions,
  ): NodeAdapter {
    if (options.type == null || options.type === 'neo-one') {
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

  static _getRPCPort(
    options: NetworkResourceAdapterStaticOptions,
    name: string,
  ): number {
    return this._getPort(options, `${name}-rpc-http`);
  }

  static _getListenTCPPort(
    options: NetworkResourceAdapterStaticOptions,
    name: string,
  ): number {
    return this._getPort(options, `${name}-listen-tcp`);
  }

  static _getTelemetryPort(
    options: NetworkResourceAdapterStaticOptions,
    name: string,
  ): number {
    return this._getPort(options, `${name}-telemetry`);
  }

  static _getPort(
    options: NetworkResourceAdapterStaticOptions,
    name: string,
  ): number {
    return options.portAllocator.allocatePort({
      plugin: options.resourceType.plugin.name,
      resourceType: options.resourceType.name,
      resource: options.name,
      name,
    });
  }

  static async _writeNodeOptions(
    options: NetworkResourceAdapterStaticOptions,
    nodeOptions: NodeOptions,
  ): Promise<void> {
    try {
      const nodeOptionsPath = this._getNodeOptionsPath(
        options,
        nodeOptions.name,
      );
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

  static async _readNodeOptions(
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

  static _getNodeOptionsPath(
    { nodesOptionsPath }: NetworkResourceAdapterStaticOptions,
    name: string,
  ): string {
    return path.resolve(nodesOptionsPath, `${name}.json`);
  }

  getDebug(): DescribeTable {
    return [
      ['Type', this._type],
      ['Data Path', this._dataPath],
      ['Nodes Path', this._nodesPath],
      ['Nodes Options Path', this._nodesOptionsPath],
      ['State', this._state],
      [
        'Nodes',
        {
          type: 'describe',
          table: this._nodes.map(node => [
            node.name,
            { type: 'describe', table: node.getDebug() },
          ]),
        },
      ],
    ];
  }
}
