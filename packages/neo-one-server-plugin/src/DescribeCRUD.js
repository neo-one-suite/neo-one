/* @flow */
import type { BaseResource, BaseResourceOptions } from './types';
import type { CLIOption } from './CRUDBase';
import CRUDResourceBase from './CRUDResourceBase';
import type ResourceType from './ResourceType';

export type DescribeCRUDOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  resourceType: ResourceType<Resource, ResourceOptions>,
  help?: string,
  aliases?: Array<string>,
  options?: Array<CLIOption>,
  autocomplete?: Array<string>,
|};

export default class DescribeCRUD<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> extends CRUDResourceBase<Resource, ResourceOptions> {
  constructor({
    resourceType,
    help,
    aliases,
    options,
    autocomplete,
  }: DescribeCRUDOptions<Resource, ResourceOptions>) {
    super({
      name: 'describe',
      resourceType,
      help: help == null ? `Describe ${resourceType.names.lower} <name>` : help,
      aliases,
      options,
      autocomplete,
    });
  }
}
