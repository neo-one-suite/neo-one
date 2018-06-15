import { ResourceType } from './ResourceType';
import { BaseResource, BaseResourceOptions, InteractiveCLI } from './types';

export interface CLIOption {
  readonly option: string;
  readonly description: string;
}

export interface NamesIn {
  readonly ing: string;
  readonly ingUpper: string;

  readonly ed: string;
  readonly edUpper: string;
}

export interface Names extends NamesIn {
  readonly lower: string;
  readonly upper: string;
}

export interface CRUDBaseOptions<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  readonly name: string;
  readonly names?: NamesIn;

  readonly command: string;
  readonly resourceType: ResourceType<Resource, ResourceOptions>;

  readonly help: string;

  readonly aliases?: ReadonlyArray<string>;

  readonly options?: ReadonlyArray<CLIOption>;

  readonly autocomplete?: ReadonlyArray<string>;
}

export interface GetCLIResourceOptions {
  readonly cli: InteractiveCLI;
  readonly args: object;
  readonly options: object;
}

export class CRUDBase<Resource extends BaseResource, ResourceOptions extends BaseResourceOptions> {
  public readonly name: string;
  public readonly names: Names;
  public readonly command: string;
  public readonly resourceType: ResourceType<Resource, ResourceOptions>;
  public readonly help: string;
  public readonly aliases: ReadonlyArray<string>;
  public readonly options: ReadonlyArray<CLIOption>;
  public readonly autocomplete: ReadonlyArray<string>;

  public constructor({
    name: nameIn,
    names: namesIn,
    command,
    resourceType,
    help,
    aliases = [],
    options = [],
    autocomplete = [],
  }: CRUDBaseOptions<Resource, ResourceOptions>) {
    this.name = nameIn;
    const name = nameIn.endsWith('e') ? nameIn.slice(0, -1) : nameIn;
    const nameUpper = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const names =
      namesIn === undefined
        ? {
            ing: `${name}ing`,
            ingUpper: `${nameUpper}ing`,
            ed: `${name}ed`,
            edUpper: `${nameUpper}ed`,
          }
        : namesIn;

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
    this.aliases = aliases;
    this.options = options;
    this.autocomplete = autocomplete;
  }

  public async getCLIResourceOptions({ options }: GetCLIResourceOptions): Promise<ResourceOptions> {
    // tslint:disable-next-line no-any
    return Promise.resolve(options as any);
  }
}
