/* @flow */
import { take } from 'rxjs/operators';

import type {
  BaseResource,
  BaseResourceOptions,
  InteractiveCLI,
} from './types';
import CRUDBase, { type CLIOption, type NamesIn } from './CRUDBase';
import type ResourceType from './ResourceType';

export type ExecCLIOptions<ResourceOptions: BaseResourceOptions> = {|
  // Full name of the resource
  name: string,
  cli: InteractiveCLI,
  options: ResourceOptions,
|};

export type GetCLIAutocompleteOptions = {|
  cli: InteractiveCLI,
|};

export type CRUDResourceOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  name: string,
  names?: NamesIn,
  resourceType: ResourceType<Resource, ResourceOptions>,
  help: string,
  aliases?: Array<string>,
  extraArgs?: Array<string>,
  options?: Array<CLIOption>,
  autocomplete?: Array<string>,
|};

export type GetCLINameOptions<ResourceOptions: BaseResourceOptions> = {|
  baseName: string,
  cli: InteractiveCLI,
  options: ResourceOptions,
|};

export default class CRUDResourceBase<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> extends CRUDBase<Resource, ResourceOptions> {
  constructor({
    name,
    names,
    resourceType,
    help,
    aliases,
    extraArgs,
    options,
    autocomplete,
  }: CRUDResourceOptions<Resource, ResourceOptions>) {
    let command = `${name} ${resourceType.name} <name>`;
    if (extraArgs != null) {
      command += ` ${extraArgs.join(' ')}`;
    }
    super({
      name,
      names,
      command,
      resourceType,
      help,
      aliases,
      options,
      autocomplete,
    });
  }

  getCLIName({
    baseName,
  }: GetCLINameOptions<ResourceOptions>): Promise<string> {
    return Promise.resolve(baseName);
  }

  async getCLIAutocomplete(
    options: GetCLIAutocompleteOptions,
  ): Promise<Array<string>> {
    const { cli } = options;
    try {
      const resourceOptions = await this.getCLIAutocompleteResourceOptions(
        options,
      );
      const resources = await cli.client
        .getResources$({
          plugin: this.resourceType.plugin.name,
          resourceType: this.resourceType.name,
          options: resourceOptions,
        })
        .pipe(take(1))
        .toPromise()
        .then(results => results.map(result => result.baseName));
      return [...new Set(resources.concat(this.autocomplete))];
    } catch (error) {
      this.resourceType.plugin.monitor.logError({
        name: 'neo_crud_get_cli_autocomplete_error',
        message: 'Failed to fetch cli autocomplete.',
        error,
      });
      return this.autocomplete;
    }
  }

  // Extract options that will be passed to ResourceType#filterResources.
  getCLIAutocompleteResourceOptions({
    cli,
  }: GetCLIAutocompleteOptions): Promise<ResourceOptions> {
    return this.getCLIResourceOptions({ cli, args: {}, options: {} });
  }

  // Function to execute before the command. Useful if you want to do things
  // like call other commands, e.g. `activate <name>` before activating another
  // name.
  // eslint-disable-next-line
  preExecCLI(options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }

  // Function to execute after the command is complete. Useful if you want to do
  // things like call other commands, e.g. `activate <name>` after starting
  // <name>
  // eslint-disable-next-line
  postExecCLI(options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }
}
