/* @flow */
import type {
  BaseResource,
  BaseResourceOptions,
  InteractiveCLI,
} from './types';
import type ResourceType from './ResourceType';

export type CLIOption = {|
  option: string,
  description: string,
|};

export type NamesIn = {|
  // Customize 'ing' verb - e.g. opening instead of starting
  ing: string,
  ingUpper: string,
  // Customize 'ed' verb - e.g. opened instead of started
  ed: string,
  edUpper: string,
|};

export type Names = {|
  ...NamesIn,
  lower: string,
  upper: string,
|};

export type CRUDBaseOptions<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {|
  // CRUD name
  name: string,
  names?: NamesIn,
  // CLI command
  command: string,
  resourceType: ResourceType<Resource, ResourceOptions>,
  // Customize the help message for the command.
  help: string,
  // Add a custom alias for the command.
  aliases?: Array<string>,
  // Additional command options
  options?: Array<CLIOption>,
  // Add a static list of autocomplete names. Useful if there are special or
  // reserved names.
  autocomplete?: Array<string>,
|};

export type GetCLIResourceOptions = {|
  cli: InteractiveCLI,
  args: Object,
  options: Object,
|};

export default class CRUDBase<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> {
  name: string;
  names: Names;
  command: string;
  resourceType: ResourceType<Resource, ResourceOptions>;
  help: string;
  aliases: Array<string>;
  options: Array<CLIOption>;
  autocomplete: Array<string>;

  constructor({
    name: nameIn,
    names: namesIn,
    command,
    resourceType,
    help,
    aliases,
    options,
    autocomplete,
  }: CRUDBaseOptions<Resource, ResourceOptions>) {
    this.name = nameIn;
    const name = nameIn.endsWith('e') ? nameIn.slice(0, -1) : nameIn;
    const nameUpper = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const names = namesIn || {
      ing: `${name}ing`,
      ingUpper: `${nameUpper}ing`,
      ed: `${name}ed`,
      edUpper: `${nameUpper}ed`,
    };
    this.names = {
      lower: nameIn,
      upper: `${nameIn.charAt(0).toUpperCase()}${nameIn.slice(1)}`,
      ing: names.ing,
      ingUpper: names.ingUpper,
      ed: names.ed,
      edUpper: names.edUpper,
    };
    this.command = command;
    this.resourceType = resourceType;
    this.help = help;
    this.aliases = aliases || [];
    this.options = options || [];
    this.autocomplete = autocomplete || [];
  }

  getCLIResourceOptions({
    options,
  }: GetCLIResourceOptions): Promise<ResourceOptions> {
    return Promise.resolve((options: $FlowFixMe));
  }
}
