/* @flow */
import type { BaseResource, InteractiveCLI } from '@neo-one/server-common';

import type ResourceType from './ResourceType';

export type CLIOption = {|
  option: string,
  description: string,
|};

export type Names = {|
  // Customize 'ing' verb - e.g. opening instead of starting
  ing: string,
  ingUpper: string,
  // Customize 'ed' verb - e.g. opened instead of started
  ed: string,
  edUpper: string,
|};

export type CRUDBaseOptions<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
> = {|
  // CRUD name
  name: string,
  names?: Names,
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

export default class CRUDBase<
  Resource: BaseResource,
  // flowlint-next-line unclear-type:off
  ResourceOptions: Object,
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
    names,
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
    this.names = names || {
      ing: `${name}ing`,
      ingUpper: `${nameUpper}ing`,
      ed: `${name}ed`,
      edUpper: `${nameUpper}ed`,
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
  }: {|
    cli: InteractiveCLI,
    // flowlint-next-line unclear-type:off
    options: Object,
  |}): Promise<ResourceOptions> {
    return Promise.resolve((options: $FlowFixMe));
  }
}
