import { Observable } from 'rxjs';
import { CLIOption } from './CRUDBase';
import { CRUDResource, Request$Options } from './CRUDResource';
import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions, ModifyResourceResponse } from './types';

export interface DeleteCRUDOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly help?: string;
  readonly aliases?: ReadonlyArray<string>;
  readonly options?: ReadonlyArray<CLIOption>;
  readonly autocomplete?: ReadonlyArray<string>;
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
  }: DeleteCRUDOptions<Resource, ResourceOptions>) {
    super({
      name: 'delete',
      resourceType,
      help,
      aliases,
      options,
      autocomplete,
    });
  }

  public request$({
    name,
    cancel$,
    options,
    client,
  }: Request$Options<ResourceOptions>): Observable<ModifyResourceResponse> {
    return client.deleteResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
