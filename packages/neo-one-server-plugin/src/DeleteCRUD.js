/* @flow */
import type { Observable } from 'rxjs/Observable';

import type {
  BaseResource,
  BaseResourceOptions,
  ModifyResourceResponse,
} from './types';
import type { CLIOption } from './CRUDBase';
import CRUDResource, { type Request$Options } from './CRUDResource';
import type ResourceType from './ResourceType';

export type DeleteCRUDOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  resourceType: ResourceType<Resource, ResourceOptions>,
  help?: string,
  aliases?: Array<string>,
  options?: Array<CLIOption>,
  autocomplete?: Array<string>,
|};

export default class DeleteCRUD<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> extends CRUDResource<Resource, ResourceOptions> {
  constructor({
    resourceType,
    help,
    aliases,
    options,
    autocomplete,
  }: DeleteCRUDOptions<Resource, ResourceOptions>) {
    super({
      name: 'delete',
      resourceType,
      help:
        help == null
          ? `Deletes the ${resourceType.names.lower} called <name>`
          : help,
      aliases,
      options,
      autocomplete,
    });
  }

  request$({
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
