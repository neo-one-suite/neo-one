/* @flow */
import { type ExecCLIOptions, DeleteCRUD } from '@neo-one/server-plugin';

import type NetworkResourceType, {
  Network,
  NetworkResourceOptions,
} from '../NetworkResourceType';

export default class DeleteNetworkCRUD extends DeleteCRUD<
  Network,
  NetworkResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: NetworkResourceType |}) {
    super({
      resourceType,
      aliases: ['delete net'],
    });
  }

  async postExecCLI({
    cli,
  }: ExecCLIOptions<NetworkResourceOptions>): Promise<void> {
    await cli.exec(`deactivate network`);
  }
}
