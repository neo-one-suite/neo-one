/* @flow */
import {
  type ResourceAdapter,
  type ResourceAdapterOptions,
  type ResourceAdapterReady,
  CRUD,
  DescribeCRUD,
  GetCRUD,
  ResourceType,
  StopCRUD,
} from '@neo-one/server';
import type { Observable } from 'rxjs/Observable';
import {
  type DescribeTable,
  type ListTable,
  type Progress,
  type ResourceState,
} from '@neo-one/server-common';

import _ from 'lodash';

import { CreateNetworkCRUD, DeleteNetworkCRUD, StartNetworkCRUD } from './crud';
import type NetworkPlugin from './NetworkPlugin';
import NetworkResourceAdapter, {
  type NetworkResourceAdapterInitOptions,
} from './NetworkResourceAdapter';
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

  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Network, NetworkResourceOptions>> {
    return NetworkResourceAdapter.init(
      this._getResourceAdapterOptions(options),
    );
  }

  createResourceAdapter$(
    adapterOptions: ResourceAdapterOptions,
    options: NetworkResourceOptions,
  ): Observable<
    Progress | ResourceAdapterReady<Network, NetworkResourceOptions>,
  > {
    return NetworkResourceAdapter.create$(
      this._getResourceAdapterOptions(adapterOptions),
      options,
    );
  }

  _getResourceAdapterOptions(
    options: ResourceAdapterOptions,
  ): NetworkResourceAdapterInitOptions {
    return {
      name: options.name,
      dataPath: options.dataPath,
      binary: options.binary,
      portAllocator: options.portAllocator,
      resourceType: this,
    };
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
    return [['Name', 'Type', 'Nodes']].concat(
      _.sortBy(resources, resource => resource.name).map(resource => [
        resource.name,
        resource.type,
        `${resource.nodes.length}`,
      ]),
    );
  }

  getDescribeTable(resource: Network): DescribeTable {
    return [
      ['Name', resource.name],
      ['Type', resource.type],
      [
        'Nodes',
        {
          type: 'list',
          table: [['Name', 'Live', 'Ready', 'RPC', 'TCP']].concat(
            _.sortBy(resource.nodes, node => node.name).map(node => [
              node.name,
              node.live ? 'Yes' : 'No',
              node.ready ? 'Yes' : 'No',
              node.rpcAddress,
              node.tcpAddress,
            ]),
          ),
        },
      ],
    ];
  }
}
