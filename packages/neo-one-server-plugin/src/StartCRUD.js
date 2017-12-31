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

export type StartCRUDOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  name?: string,
  resourceType: ResourceType<Resource, ResourceOptions>,
  help?: string,
  aliases?: Array<string>,
  options?: Array<CLIOption>,
  autocomplete?: Array<string>,
|};

export default class StartCRUD<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> extends CRUDResource<Resource, ResourceOptions> {
  constructor({
    name: nameIn,
    resourceType,
    help,
    aliases,
    options,
    autocomplete,
  }: StartCRUDOptions<Resource, ResourceOptions>) {
    const name = nameIn == null ? 'start' : nameIn;
    const nameUpper = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    super({
      name,
      resourceType,
      help:
        help == null
          ? `${nameUpper}s the ${resourceType.names.lower} called <name>`
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
    return client.startResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
