/* @flow */
import type { Observable } from 'rxjs/Observable';

import type { BaseResource, ModifyResourceResponse } from './types';
import type { CLIOption } from './CRUDBase';
import CRUDResource, { type Request$Options } from './CRUDResource';
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
  extraArgs?: Array<string>,
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
    extraArgs,
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
      extraArgs,
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
  }: Request$Options<ResourceOptions>): Observable<ModifyResourceResponse> {
    return client.createResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
