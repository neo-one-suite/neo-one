/* @flow */
import type {
  BaseResource,
  Client,
  ModifyResourceResponse,
} from '@neo-one/server-common';
import type { Observable } from 'rxjs/Observable';

import type { CLIOption } from './CRUDBase';
import CRUDResource from './CRUDResource';
import type ResourceType from './ResourceType';

export type DeleteCRUDOptions<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> = {|
  resourceType: ResourceType<Resource, ResourceOptions>,
  help?: string,
  aliases?: Array<string>,
  options?: Array<CLIOption>,
  autocomplete?: Array<string>,
|};

export default class DeleteCRUD<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
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
  }: {|
    name: string,
    cancel$: Observable<void>,
    options: ResourceOptions,
    client: Client,
  |}): Observable<ModifyResourceResponse> {
    return client.deleteResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
