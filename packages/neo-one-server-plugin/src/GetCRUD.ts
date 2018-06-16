import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CLIOption, CRUDBase } from './CRUDBase';
import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions, Client, InteractiveCLI } from './types';

export interface ExecCLIOptions<ResourceOptions extends BaseResourceOptions> {
  readonly cli: InteractiveCLI;
  readonly options: ResourceOptions;
}

export interface GetResources$Options<ResourceOptions extends BaseResourceOptions> {
  readonly client: Client;
  readonly options: ResourceOptions;
}

export interface GetCRUDOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly help?: string;
  readonly aliases?: ReadonlyArray<string>;
  readonly options?: ReadonlyArray<CLIOption>;
  readonly autocomplete?: ReadonlyArray<string>;
}

export class GetCRUD<
  Resource extends BaseResource = BaseResource,
  ResourceOptions extends BaseResourceOptions = BaseResourceOptions
> extends CRUDBase<Resource, ResourceOptions> {
  public constructor({
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
      help: help === undefined ? `List ${resourceType.names.lowerPlural}` : help,
      aliases,
      options,
      autocomplete,
    });
  }

  // Function to execute before the command.
  public async preExecCLI(_options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }

  // Function to execute after the command.
  public async postExecCLI(_options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }

  public getResources$({
    client,
    options,
  }: GetResources$Options<ResourceOptions>): Observable<ReadonlyArray<Resource>> {
    return client
      .getResources$({
        plugin: this.resourceType.plugin.name,
        resourceType: this.resourceType.name,
        options,
      })
      .pipe(map((resources) => resources.map((resource) => resource as Resource)));
  }
}
