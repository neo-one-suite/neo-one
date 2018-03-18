/* @flow */
import {
  type DescribeTable,
  type ListTable,
  type ResourceState,
  type MasterResourceAdapter,
  type MasterResourceAdapterOptions,
  CRUD,
  DescribeCRUD,
  GetCRUD,
  ResourceType,
  StopCRUD,
} from '@neo-one/server-plugin';

import _ from 'lodash';

import { CreateNetworkCRUD, DeleteNetworkCRUD, StartNetworkCRUD } from './crud';
import MasterNetworkResourceAdapter from './MasterNetworkResourceAdapter';
import type NetworkPlugin from './NetworkPlugin';
import { type Node } from './node';
import type { NetworkType } from './types';

import constants from './constants';

export type Network = {|
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
  type: NetworkType,
  height: ?number,
  peers: ?number,
  nodes: Array<Node>,
|};
export type NetworkResourceOptions = {
  type?: 'neo-one',
};

export default class NetworkResourceType extends ResourceType<
  Network,
  NetworkResourceOptions,
> {
  constructor({ plugin }: {| plugin: NetworkPlugin |}) {
    super({
      plugin,
      name: constants.NETWORK_RESOURCE_TYPE,
      names: {
        capital: 'Network',
        capitalPlural: 'Networks',
        lower: 'network',
        lowerPlural: 'networks',
      },
    });
  }

  async createMasterResourceAdapter({
    binary,
    portAllocator,
  }: MasterResourceAdapterOptions): Promise<
    MasterResourceAdapter<Network, NetworkResourceOptions>,
  > {
    return new MasterNetworkResourceAdapter({
      resourceType: this,
      binary,
      portAllocator,
    });
  }

  getCRUD(): CRUD<Network, NetworkResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: new StartNetworkCRUD({ resourceType: this }),
      stop: new StopCRUD({
        resourceType: this,
        aliases: ['stop net'],
      }),
      delete: new DeleteNetworkCRUD({ resourceType: this }),
      create: new CreateNetworkCRUD({ resourceType: this }),
      get: new GetCRUD({
        resourceType: this,
        aliases: ['get net'],
      }),
      describe: new DescribeCRUD({
        resourceType: this,
        aliases: ['describe net'],
      }),
    });
  }

  getListTable(resources: Array<Network>): ListTable {
    return [['Name', 'Type', 'Height', 'Nodes']].concat(
      _.sortBy(resources, resource => resource.name).map(resource => [
        resource.name,
        resource.type,
        resource.height == null ? 'Unknown' : `${resource.height}`,
        resource.peers == null ? '0' : `${resource.peers}`,
        `${resource.nodes.length}`,
      ]),
    );
  }

  getDescribeTable(resource: Network): DescribeTable {
    return [
      ['Name', resource.name],
      ['Type', resource.type],
      ['Height', resource.height == null ? 'Unknown' : `${resource.height}`],
      [
        'Nodes',
        {
          type: 'list',
          table: [
            [
              'Name',
              'Live',
              'Ready',
              'RPC',
              'TCP',
              'Telemetry',
              'Height',
              'Peers',
            ],
          ].concat(
            _.sortBy(resource.nodes, node => node.name).map(node => [
              node.name,
              node.live ? 'Yes' : 'No',
              node.ready ? 'Yes' : 'No',
              node.rpcAddress,
              node.tcpAddress,
              node.telemetryAddress,
              resource.height == null ? 'Unknown' : `${resource.height}`,
              resource.peers == null ? '0' : `${resource.peers}`,
            ]),
          ),
        },
      ],
    ];
  }
}
