/* @flow */
import { type ExecCLIOptions, StartCRUD } from '@neo-one/server-plugin';

import type NetworkResourceType, {
  Network,
  NetworkResourceOptions,
} from '../NetworkResourceType';

export default class StartNetworkCRUD extends StartCRUD<
  Network,
  NetworkResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: NetworkResourceType |}) {
    super({
      resourceType,
      aliases: ['start net'],
    });
  }

  async postExecCLI({
    name,
    cli,
  }: ExecCLIOptions<NetworkResourceOptions>): Promise<void> {
    await cli.exec(`activate network ${name}`);
  }
}
