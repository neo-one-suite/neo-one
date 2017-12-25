/* @flow */
import type { Observable } from 'rxjs/Observable';

import { map } from 'rxjs/operators';

import type {
  BaseResource,
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

// flowlint-next-line unclear-type:off
export type GetResource$Options<ResourceOptions: Object> = {|
  name: string,
  client: Client,
  options: ResourceOptions,
|};

export default class ResourceType<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
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
  // eslint-disable-next-line
  getListTable(resources: Array<Resource>): ListTable {
    return [['Name']].concat(resources.map(resource => [resource.baseName]));
  }

  // Format the resource information into a vertical table. Nested tables
  // can also be used as a value.
  // eslint-disable-next-line
  getDescribeTable(resource: Resource): DescribeTable {
    return [['Name', resource.baseName]];
  }
}
