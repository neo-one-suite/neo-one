/* @flow */
import type { Observable } from 'rxjs/Observable';

import type { BaseResource, Progress } from './types';
import type { ResourceAdapter } from './ResourceAdapter';

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

export type ResourceAdapterReady<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> = {|
  type: 'ready',
  resourceAdapter: ResourceAdapter<Resource, ResourceOptions>,
  dependencies?: Array<ResourceDependency>,
|};

export type MasterResourceAdapter<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> = {
  // ResourceAdapter for this ResourceType.
  initResourceAdapter(
    // eslint-disable-next-line
    options: ResourceAdapterOptions,
  ): Promise<ResourceAdapter<Resource, ResourceOptions>>,

  createResourceAdapter$(
    // eslint-disable-next-line
    adapterOptions: ResourceAdapterOptions,
    // eslint-disable-next-line
    options: ResourceOptions,
  ): Observable<Progress | ResourceAdapterReady<Resource, ResourceOptions>>,
};
