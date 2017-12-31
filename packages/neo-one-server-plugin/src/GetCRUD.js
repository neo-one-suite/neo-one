/* @flow */
import type { Observable } from 'rxjs/Observable';

import { map } from 'rxjs/operators';

import type {
  BaseResource,
  BaseResourceOptions,
  Client,
  InteractiveCLI,
} from './types';
import CRUDBase from './CRUDBase';
import type { CLIOption } from './CRUDBase';
import type ResourceType from './ResourceType';

export type ExecCLIOptions<ResourceOptions: BaseResourceOptions> = {|
  cli: InteractiveCLI,
  options: ResourceOptions,
|};

export type GetResources$Options<ResourceOptions: BaseResourceOptions> = {|
  client: Client,
  options: ResourceOptions,
|};

export type GetCRUDOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  resourceType: ResourceType<Resource, ResourceOptions>,
  help?: string,
  aliases?: Array<string>,
  options?: Array<CLIOption>,
  autocomplete?: Array<string>,
|};

export default class GetCRUD<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> extends CRUDBase<Resource, ResourceOptions> {
  constructor({
    resourceType,
    help,
    aliases,
    options,
    autocomplete,
  }: GetCRUDOptions<Resource, ResourceOptions>) {
    super({
      name: 'get',
      command: `get ${resourceType.name}`,
      resourceType,
      help: help == null ? `List ${resourceType.names.lowerPlural}` : help,
      aliases,
      options,
      autocomplete,
    });
  }

  // Function to execute before the command.
  // eslint-disable-next-line
  preExecCLI(options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }

  // Function to execute after the command.
  // eslint-disable-next-line
  postExecCLI(options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }

  getResources$({
    client,
    options,
  }: GetResources$Options<ResourceOptions>): Observable<Array<Resource>> {
    return client
      .getResources$({
        plugin: this.resourceType.plugin.name,
        resourceType: this.resourceType.name,
        options,
      })
      .pipe(
        map(resources => resources.map(resource => (resource: $FlowFixMe))),
      );
  }
}
