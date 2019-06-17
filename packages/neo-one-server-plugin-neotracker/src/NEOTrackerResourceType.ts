import {
  CRUD,
  DeleteCRUD,
  DescribeCRUD,
  DescribeTable,
  GetCRUD,
  ListTable,
  MasterResourceAdapter,
  MasterResourceAdapterOptions,
  ResourceState,
  ResourceType,
  StartCRUD,
  StopCRUD,
} from '@neo-one/server-plugin';
import _ from 'lodash';
import { constants, NetworkType } from './constants';
import { CreateNEOTrackerCRUD } from './crud';
import { MasterNEOTrackerResourceAdapter } from './MasterNEOTrackerResourceAdapter';
import { NEOTrackerPlugin } from './NEOTrackerPlugin';

export interface NEOTracker {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
  readonly neotrackerPath: string;
  readonly dbPath: string;
  readonly network: NetworkType;
  readonly rpcURL: string;
  readonly port: number;
  readonly metricsPort: number;
  readonly live: boolean;
  readonly url: string;
  readonly reset: () => Promise<void>;
}

export interface NEOTrackerResourceOptions {
  readonly network?: string;
}

export class NEOTrackerResourceType extends ResourceType<NEOTracker, NEOTrackerResourceOptions> {
  public constructor({ plugin }: { readonly plugin: NEOTrackerPlugin }) {
    super({
      plugin,
      name: constants.NEOTRACKER_RESOURCE_TYPE,
      names: {
        capital: 'NEOTracker',
        capitalPlural: 'NEOTrackers',
        lower: 'neotracker',
        lowerPlural: 'neotrackers',
      },
    });
  }

  public async createMasterResourceAdapter({
    pluginManager,
    portAllocator,
  }: MasterResourceAdapterOptions): Promise<MasterResourceAdapter<NEOTracker, NEOTrackerResourceOptions>> {
    return new MasterNEOTrackerResourceAdapter({ pluginManager, resourceType: this, portAllocator });
  }

  public getCRUD(): CRUD<NEOTracker, NEOTrackerResourceOptions> {
    return new CRUD({
      resourceType: this,
      start: new StartCRUD({ resourceType: this }),
      stop: new StopCRUD({ resourceType: this }),
      delete: new DeleteCRUD({ resourceType: this }),
      create: new CreateNEOTrackerCRUD({ resourceType: this }),
      get: new GetCRUD({ resourceType: this }),
      describe: new DescribeCRUD({ resourceType: this }),
    });
  }

  public getListTable(resources: readonly NEOTracker[]): ListTable {
    return [['Name', 'Type', 'URL', 'Live']].concat(
      _.sortBy(resources, (resource) => resource.name).map((resource) => [
        resource.name,
        resource.network,
        resource.url,
        resource.live ? 'Yes' : 'No',
      ]),
    );
  }

  public getDescribeTable(resource: NEOTracker): DescribeTable {
    return [
      ['Name', resource.name] as const,
      ['Type', resource.network] as const,
      ['URL', resource.url] as const,
      ['Live', resource.live ? 'Yes' : 'No'] as const,
    ];
  }
}
