/* @flow */
import type { Observable } from 'rxjs/Observable';

import type { BaseResource, Client, ModifyResourceResponse } from './types';
import type { CLIOption } from './CRUDBase';
import CRUDResource from './CRUDResource';
import type { GetCLIAutocompleteOptions } from './CRUDResourceBase';
import type ResourceType from './ResourceType';

export type CreateCRUDOptions<
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

export default class CreateCRUD<
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
  }: CreateCRUDOptions<Resource, ResourceOptions>) {
    super({
      name: 'create',
      resourceType,
      help:
        help == null
          ? `Creates a ${resourceType.names.lower} called <name>`
          : help,
      aliases,
      options,
      autocomplete,
    });
  }

  getAutocomplete(
    // eslint-disable-next-line
    options: GetCLIAutocompleteOptions,
  ): Promise<Array<string>> {
    return Promise.resolve(this.autocomplete);
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
    return client.createResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
