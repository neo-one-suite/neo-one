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

export type StartCRUDOptions<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
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
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
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
  }: {|
    name: string,
    cancel$: Observable<void>,
    options: ResourceOptions,
    client: Client,
  |}): Observable<ModifyResourceResponse> {
    return client.startResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
