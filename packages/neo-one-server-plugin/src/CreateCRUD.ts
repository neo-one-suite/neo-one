import { Observable } from 'rxjs';
import { CLIOption } from './CRUDBase';
import { CRUDResource, Request$Options } from './CRUDResource';
import { GetCLIAutocompleteOptions } from './CRUDResourceBase';
import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions, ModifyResourceResponse } from './types';

export interface CreateCRUDOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly name?: string;
  readonly help?: string;
  readonly aliases?: ReadonlyArray<string>;
  readonly extraArgs?: ReadonlyArray<string>;
  readonly options?: ReadonlyArray<CLIOption>;
  readonly autocomplete?: ReadonlyArray<string>;
  readonly startOnCreate?: boolean;
}

function nameToUpper(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function nameToHelp(name: string, resourceName: string): string {
  return `${nameToUpper(name)}s a ${resourceName} called <name>`;
}

export class CreateCRUD<
  Resource extends BaseResource,
  ResourceOptions extends BaseResourceOptions
> extends CRUDResource<Resource, ResourceOptions> {
  public readonly startOnCreate: boolean;

  public constructor({
    resourceType,
    name = 'create',
    help = nameToHelp(name, resourceType.names.lower),
    aliases,
    extraArgs,
    options,
    autocomplete,
    startOnCreate = false,
  }: CreateCRUDOptions<Resource, ResourceOptions>) {
    super({
      name,
      resourceType,
      help,
      aliases,
      extraArgs,
      options,
      autocomplete,
    });

    this.startOnCreate = startOnCreate;
  }

  public async getAutocomplete(_options: GetCLIAutocompleteOptions): Promise<ReadonlyArray<string>> {
    return Promise.resolve(this.autocomplete);
  }

  public request$({
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
