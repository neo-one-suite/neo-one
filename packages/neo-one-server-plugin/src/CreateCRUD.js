/* @flow */
import type { Observable } from 'rxjs/Observable';

import type {
  BaseResource,
  BaseResourceOptions,
  ModifyResourceResponse,
} from './types';
import type { CLIOption } from './CRUDBase';
import CRUDResource, { type Request$Options } from './CRUDResource';
import type { GetCLIAutocompleteOptions } from './CRUDResourceBase';
import type ResourceType from './ResourceType';

export type CreateCRUDOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  resourceType: ResourceType<Resource, ResourceOptions>,
  name?: string,
  help?: string,
  aliases?: Array<string>,
  extraArgs?: Array<string>,
  options?: Array<CLIOption>,
  autocomplete?: Array<string>,
  startOnCreate?: boolean,
|};

export default class CreateCRUD<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> extends CRUDResource<Resource, ResourceOptions> {
  startOnCreate: boolean;

  constructor({
    resourceType,
    name: nameIn,
    help,
    aliases,
    extraArgs,
    options,
    autocomplete,
    startOnCreate,
  }: CreateCRUDOptions<Resource, ResourceOptions>) {
    const name = nameIn == null ? 'create' : nameIn;
    const nameUpper = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    super({
      name: name || 'create',
      resourceType,
      help:
        help == null
          ? `${nameUpper}s a ${resourceType.names.lower} called <name>`
          : help,
      aliases,
      extraArgs,
      options,
      autocomplete,
    });
    this.startOnCreate = startOnCreate == null ? false : startOnCreate;
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
