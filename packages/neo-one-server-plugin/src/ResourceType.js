/* @flow */
import type { Observable } from 'rxjs/Observable';

import { map, take } from 'rxjs/operators';

import type {
  BaseResource,
  BaseResourceOptions,
  Binary,
  Client,
  DescribeTable,
  ListTable,
  PluginManager,
  PortAllocator,
} from './types';
import CRUD from './CRUD';
import type Plugin from './Plugin';
import type { MasterResourceAdapter } from './MasterResourceAdapter';

export type ResourceTypeOptions = {|
  +plugin: Plugin,
  // Name of the resource type. This is used for all commands which are
  // formatted like `<crud> <resource type name> ...`
  +name: string,
  // Names used for display.
  +names: {|
    // Capital form of the name, e.g. `Network`
    +capital: string,
    // Capital plural form of the name, e.g. `Networks`
    +capitalPlural: string,
    // Lowercase form of the name, e.g. `network`
    +lower: string,
    // Lowercase plural form of the name, e.g. `networks`
    +lowerPlural: string,
  |},
|};

export type MasterResourceAdapterOptions = {|
  // PluginManager
  pluginManager: PluginManager,
  // Data path to store all data for the master adapter.
  dataPath: string,
  // Binary to use to execute commands, e.g. added by Plugin#commands
  binary: Binary,
  // Allocate ports for the resource.
  portAllocator: PortAllocator,
|};

export type GetResource$Options<ResourceOptions: BaseResourceOptions> = {|
  name: string,
  client: Client,
  options: ResourceOptions,
|};

export default class ResourceType<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> {
  +plugin: Plugin;
  +name: string;
  +names: {|
    +capital: string,
    +capitalPlural: string,
    +lower: string,
    +lowerPlural: string,
  |};

  constructor({ plugin, name, names }: ResourceTypeOptions) {
    this.plugin = plugin;
    this.name = name;
    this.names = names;
  }

  // Filter resources for return by getResources$. Passed the options given by
  // CRUDCLI#getOptions or CRUDCLI#getAutocompleteOptions.
  filterResources(
    resources: Array<Resource>,
    // eslint-disable-next-line
    options: ResourceOptions,
  ): Array<Resource> {
    return resources;
  }

  getResource$({
    name,
    client,
    options,
  }: GetResource$Options<ResourceOptions>): Observable<?Resource> {
    return client
      .getResource$({
        plugin: this.plugin.name,
        resourceType: this.name,
        name,
        options,
      })
      .pipe(map(resource => (resource: $FlowFixMe)));
  }

  getResource({
    name,
    client,
    options,
  }: GetResource$Options<ResourceOptions>): Promise<?Resource> {
    return this.getResource$({
      name,
      client,
      options,
    })
      .pipe(take(1))
      .toPromise();
  }

  createMasterResourceAdapter(
    // eslint-disable-next-line
    options: MasterResourceAdapterOptions,
  ): Promise<MasterResourceAdapter<Resource, ResourceOptions>> {
    return Promise.reject(new Error('Not Implemented'));
  }

  // CRUD for this ResourceType.
  getCRUD(): CRUD<Resource, ResourceOptions> {
    return new CRUD({ resourceType: this });
  }

  // Format the resource information into a table, the first element in the
  // array will be the header. Must always return an array with at least one
  // element (the header).
  getListTable(resources: Array<Resource>): ListTable {
    return [['Name']].concat(resources.map(resource => [resource.baseName]));
  }

  // Format the resource information into a vertical table. Nested tables
  // can also be used as a value.
  getDescribeTable(resource: Resource): DescribeTable {
    return [['Name', resource.baseName]];
  }
}
