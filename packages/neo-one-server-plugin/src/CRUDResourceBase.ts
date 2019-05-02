import { take } from 'rxjs/operators';
import { CLIOption, CRUDBase, NamesIn } from './CRUDBase';
import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions, InteractiveCLI } from './types';

export interface ExecCLIOptions<ResourceOptions extends BaseResourceOptions> {
  readonly name: string;
  readonly cli: InteractiveCLI;
  readonly options: ResourceOptions;
}

export interface GetCLIAutocompleteOptions {
  readonly cli: InteractiveCLI;
}

export interface CRUDResourceOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly name: string;
  readonly names?: NamesIn;
  readonly resourceType: ResourceType<Resource, ResourceOptions>;
  readonly help: string;
  readonly aliases?: readonly string[];
  readonly extraArgs?: readonly string[];
  readonly options?: readonly CLIOption[];
  readonly autocomplete?: readonly string[];
  readonly hidden?: boolean;
}

export interface GetCLINameOptions<ResourceOptions extends BaseResourceOptions> {
  readonly baseName: string;
  readonly cli: InteractiveCLI;
  readonly options: ResourceOptions;
}

export class CRUDResourceBase<
  Resource extends BaseResource = BaseResource,
  ResourceOptions extends BaseResourceOptions = BaseResourceOptions
> extends CRUDBase<Resource, ResourceOptions> {
  public constructor({
    name,
    names,
    resourceType,
    help,
    aliases,
    extraArgs,
    options,
    autocomplete,
    hidden,
  }: CRUDResourceOptions<Resource, ResourceOptions>) {
    const commandBase = `${name} ${resourceType.name} <name>`;
    const command = extraArgs === undefined ? commandBase : `${commandBase} ${extraArgs.join(' ')}`;

    super({
      name,
      names,
      command,
      resourceType,
      help,
      aliases,
      options,
      autocomplete,
      hidden,
    });
  }

  public async getCLIName({ baseName }: GetCLINameOptions<ResourceOptions>): Promise<string> {
    return Promise.resolve(baseName);
  }

  public async getCLIAutocomplete(options: GetCLIAutocompleteOptions): Promise<readonly string[]> {
    const { cli } = options;
    try {
      const resourceOptions = await this.getCLIAutocompleteResourceOptions(options);

      const resources = await cli.client
        .getResources$({
          plugin: this.resourceType.plugin.name,
          resourceType: this.resourceType.name,
          options: resourceOptions,
        })
        .pipe(take(1))
        .toPromise()
        .then((results) => results.map((result) => result.baseName));

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
  public async getCLIAutocompleteResourceOptions({ cli }: GetCLIAutocompleteOptions): Promise<ResourceOptions> {
    return this.getCLIResourceOptions({ cli, args: {}, options: {} });
  }

  // Function to execute before the command. Useful if you want to do things
  // like call other commands, e.g. `activate <name>` before activating another
  // name.
  public async preExecCLI(_options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }

  // Function to execute after the command is complete. Useful if you want to do
  // things like call other commands, e.g. `activate <name>` after starting
  // <name>
  public async postExecCLI(_options: ExecCLIOptions<ResourceOptions>): Promise<void> {
    return Promise.resolve();
  }
}
