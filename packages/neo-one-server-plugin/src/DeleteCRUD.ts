import { Observable } from 'rxjs';
import { CLIOption } from './CRUDBase';
import { CRUDResource, Request$Options } from './CRUDResource';
import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions, ExecuteTaskListResponse } from './types';

export interface DeleteCRUDOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly help?: string;
  readonly aliases?: readonly string[];
  readonly options?: readonly CLIOption[];
  readonly autocomplete?: readonly string[];
  readonly hidden?: boolean;
}

export class DeleteCRUD<
  Resource extends BaseResource,
  ResourceOptions extends BaseResourceOptions
> extends CRUDResource<Resource, ResourceOptions> {
  public constructor({
    resourceType,
    help = `Deletes the ${resourceType.names.lower} called <name>`,
    aliases,
    options,
    autocomplete,
    hidden,
  }: DeleteCRUDOptions<Resource, ResourceOptions>) {
    super({
      name: 'delete',
      resourceType,
      help,
      aliases,
      options,
      autocomplete,
      hidden,
    });
  }

  public request$({
    name,
    cancel$,
    options,
    client,
  }: Request$Options<ResourceOptions>): Observable<ExecuteTaskListResponse> {
    return client.deleteResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
