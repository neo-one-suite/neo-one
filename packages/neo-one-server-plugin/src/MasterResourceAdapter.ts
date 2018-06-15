import { ResourceAdapter } from './ResourceAdapter';
import { TaskList } from './TaskList';
import { BaseResource, BaseResourceOptions } from './types';

export interface ResourceAdapterOptions {
  readonly name: string;

  readonly dataPath: string;
}

export interface ResourceDependency {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
}

export interface MasterResourceAdapter<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly initResourceAdapter: (
    options: ResourceAdapterOptions,
  ) => Promise<ResourceAdapter<Resource, ResourceOptions>>;

  readonly createResourceAdapter: (adapterOptions: ResourceAdapterOptions, options: ResourceOptions) => TaskList;
}
