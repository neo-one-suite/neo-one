/* @flow */
import { type ExecCLIOptions, CreateCRUD } from '@neo-one/server';

import type NetworkResourceType, {
  Network,
  NetworkResourceOptions,
} from '../NetworkResourceType';

export default class CreateNetworkCRUD extends CreateCRUD<
  Network,
  NetworkResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: NetworkResourceType |}) {
    super({
      resourceType,
      help:
        'Creates a network called <name>. If <name> is "main" or ' +
        '"test", starts a node that syncs with the MainNet or TestNet ' +
        'respectively. Otherwise, starts a private node network called ' +
        '<name>.',
      aliases: ['create net'],
      autocomplete: ['main', 'test'],
    });
  }

  async postExecCLI({
    name,
    cli,
  }: ExecCLIOptions<NetworkResourceOptions>): Promise<void> {
    await cli.exec(`start network ${name}`);
  }
}
