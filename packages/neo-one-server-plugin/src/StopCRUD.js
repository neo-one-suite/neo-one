/* @flow */
import type { Observable } from 'rxjs/Observable';

import type { BaseResource, Client, ModifyResourceResponse } from './types';
import type { CLIOption } from './CRUDBase';
import CRUDResource from './CRUDResource';
import type ResourceType from './ResourceType';

export type StopCRUDOptions<
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

export default class StopCRUD<
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
  }: StopCRUDOptions<Resource, ResourceOptions>) {
    const name = nameIn == null ? 'stop' : nameIn;
    const nameUpper = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    super({
      name,
      names:
        name === 'stop'
          ? {
              ing: 'stopping',
              ingUpper: 'Stopping',
              ed: 'stopped',
              edUpper: 'Stopped',
            }
          : undefined,
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
    return client.stopResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
