/* @flow */
import type { BaseResource, BaseResourceOptions } from './types';
import type { ResourceAdapter } from './ResourceAdapter';
import type TaskList from './TaskList';

export type ResourceAdapterOptions = {|
  // Full name of the resource.
  name: string,
  // Data path to store all data for the resource.
  dataPath: string,
|};

export type ResourceDependency = {|
  plugin: string,
  resourceType: string,
  name: string,
|};

export type MasterResourceAdapter<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {
  // ResourceAdapter for this ResourceType.
  initResourceAdapter(
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Resource, ResourceOptions>>,

  createResourceAdapter(
    adapterOptions: ResourceAdapterOptions,
    options: ResourceOptions,
  ): TaskList,
};
