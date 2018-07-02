import {
  CRUD,
  DescribeCRUD,
  DescribeTable,
  GetCRUD,
  ListTable,
  MasterResourceAdapter,
  MasterResourceAdapterOptions,
  ResourceState,
  ResourceType,
  StopCRUD,
} from '@neo-one/server-plugin';
import * as _ from 'lodash';
import { constants } from './constants';
import { CreateNetworkCRUD, DeleteNetworkCRUD, StartNetworkCRUD } from './crud';
import { MasterNetworkResourceAdapter } from './MasterNetworkResourceAdapter';
import { NetworkPlugin } from './NetworkPlugin';
import { Node } from './node';
import { NetworkType } from './types';

export interface Network {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
  readonly type: NetworkType;
  readonly height: number | undefined;
  readonly peers: number | undefined;
  readonly nodes: ReadonlyArray<Node>;
}

export interface NetworkResourceOptions {
  readonly type?: 'neo-one';
}

export class NetworkResourceType extends ResourceType<Network, NetworkResourceOptions> {
  public constructor({ plugin }: { readonly plugin: NetworkPlugin }) {
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

  public async createMasterResourceAdapter({
    binary,
    portAllocator,
  }: MasterResourceAdapterOptions): Promise<MasterResourceAdapter<Network, NetworkResourceOptions>> {
    return new MasterNetworkResourceAdapter({
      resourceType: this,
      binary,
      portAllocator,
    });
  }

  public getCRUD(): CRUD<Network, NetworkResourceOptions> {
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

  public getListTable(resources: ReadonlyArray<Network>): ListTable {
    return [['Name', 'Type', 'Height', 'Nodes']].concat(
      _.sortBy(resources, (resource) => resource.name).map((resource) => [
        resource.name,
        resource.type,
        resource.height === undefined ? 'Unknown' : `${resource.height}`,
        resource.peers === undefined ? '0' : `${resource.peers}`,
        `${resource.nodes.length}`,
      ]),
    );
  }

  public getDescribeTable(resource: Network): DescribeTable {
    return [
      ['Name', resource.name],
      ['Type', resource.type],
      ['Height', resource.height === undefined ? 'Unknown' : `${resource.height}`],
      [
        'Nodes',
        {
          type: 'list',
          table: [['Name', 'Live', 'Ready', 'RPC', 'TCP', 'Telemetry', 'Height', 'Peers']].concat(
            _.sortBy(resource.nodes, (node) => node.name).map((node) => [
              node.name,
              node.live ? 'Yes' : 'No',
              node.ready ? 'Yes' : 'No',
              node.rpcAddress,
              node.tcpAddress,
              node.telemetryAddress,
              resource.height === undefined ? 'Unknown' : `${resource.height}`,
              resource.peers === undefined ? '0' : `${resource.peers}`,
            ]),
          ),
        },
      ],
    ];
  }
}
