import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { CRUD } from './CRUD';
import { MasterResourceAdapter } from './MasterResourceAdapter';
import { Plugin } from './Plugin';
import {
  BaseResource,
  BaseResourceOptions,
  Binary,
  Client,
  DescribeTable,
  ListTable,
  PluginManager,
  PortAllocator,
} from './types';

export interface ResourceTypeOptions {
  readonly plugin: Plugin;
  readonly name: string;
  readonly names: {
    readonly capital: string;
    readonly capitalPlural: string;
    readonly lower: string;
    readonly lowerPlural: string;
  };
}

export interface MasterResourceAdapterOptions {
  readonly pluginManager: PluginManager;
  readonly dataPath: string;
  readonly binary: Binary;
  readonly portAllocator: PortAllocator;
}

export interface GetResource$Options<ResourceOptions extends BaseResourceOptions> {
  readonly name: string;
  readonly client: Client;
  readonly options: ResourceOptions;
}

export class ResourceType<
  Resource extends BaseResource = BaseResource,
  ResourceOptions extends BaseResourceOptions = BaseResourceOptions
> {
  public readonly plugin: Plugin;
  public readonly name: string;
  public readonly names: {
    readonly capital: string;
    readonly capitalPlural: string;
    readonly lower: string;
    readonly lowerPlural: string;
  };

  public constructor({ plugin, name, names }: ResourceTypeOptions) {
    this.plugin = plugin;
    this.name = name;
    this.names = names;
  }

  // Filter resources for return by getResources$. Passed the options given by
  // CRUDCLI#getOptions or CRUDCLI#getAutocompleteOptions.
  public filterResources(resources: readonly Resource[], _options: ResourceOptions): readonly Resource[] {
    return resources;
  }

  public getResource$({
    name,
    client,
    options,
  }: GetResource$Options<ResourceOptions>): Observable<Resource | undefined> {
    return client
      .getResource$({
        plugin: this.plugin.name,
        resourceType: this.name,
        name,
        options,
      })
      .pipe(map((resource) => resource as Resource | undefined));
  }

  public async getResource({
    name,
    client,
    options,
  }: GetResource$Options<ResourceOptions>): Promise<Resource | undefined> {
    return this.getResource$({
      name,
      client,
      options,
    })
      .pipe(take(1))
      .toPromise();
  }

  public async createMasterResourceAdapter(
    _options: MasterResourceAdapterOptions,
  ): Promise<MasterResourceAdapter<Resource, ResourceOptions>> {
    return Promise.reject(new Error('Not Implemented'));
  }

  // CRUD for this ResourceType.
  public getCRUD(): CRUD<Resource, ResourceOptions> {
    return new CRUD({ resourceType: this });
  }

  // Format the resource information into a table, the first element in the
  // array will be the header. Must always return an array with at least one
  // element (the header).
  public getListTable(resources: readonly Resource[]): ListTable {
    return [['Name']].concat(resources.map((resource) => [resource.baseName]));
  }

  // Format the resource information into a vertical table. Nested tables
  // can also be used as a value.
  public getDescribeTable(resource: Resource): DescribeTable {
    return [['Name', resource.baseName]];
  }
}
