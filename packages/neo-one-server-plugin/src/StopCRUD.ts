import { Observable } from 'rxjs';
import { CLIOption } from './CRUDBase';
import { CRUDResource, Request$Options } from './CRUDResource';
import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions, ExecuteTaskListResponse } from './types';

export interface StopCRUDOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly name?: string;
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly help?: string;
  readonly aliases?: ReadonlyArray<string>;
  readonly options?: ReadonlyArray<CLIOption>;
  readonly autocomplete?: ReadonlyArray<string>;
}

function nameToUpper(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function nameToHelp(name: string, resourceName: string): string {
  return `${nameToUpper(name)}s a ${resourceName} called <name>`;
}

export class StopCRUD<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> extends CRUDResource<
  Resource,
  ResourceOptions
> {
  public constructor({
    name = 'stop',
    resourceType,
    help,
    aliases,
    options,
    autocomplete,
  }: StopCRUDOptions<Resource, ResourceOptions>) {
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
      help: help === undefined ? nameToHelp(name, resourceType.names.lower) : help,
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
  }: Request$Options<ResourceOptions>): Observable<ExecuteTaskListResponse> {
    return client.stopResource$({
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name,
      options,
      cancel$,
    });
  }
}
