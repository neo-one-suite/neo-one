import { CLIOption } from './CRUDBase';
import { CRUDResourceBase } from './CRUDResourceBase';
import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions } from './types';

export interface DescribeCRUDOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly help?: string;
  readonly aliases?: readonly string[];
  readonly options?: readonly CLIOption[];
  readonly autocomplete?: readonly string[];
  readonly hidden?: boolean;
}

export class DescribeCRUD<
  Resource extends BaseResource = BaseResource,
  ResourceOptions extends BaseResourceOptions = BaseResourceOptions
> extends CRUDResourceBase<Resource, ResourceOptions> {
  public constructor({
    resourceType,
    help = `Describe ${resourceType.names.lower} <name>`,
    aliases,
    options,
    autocomplete,
    hidden,
  }: DescribeCRUDOptions<Resource, ResourceOptions>) {
    super({
      name: 'describe',
      resourceType,
      help,
      aliases,
      options,
      autocomplete,
      hidden,
    });
  }
}
