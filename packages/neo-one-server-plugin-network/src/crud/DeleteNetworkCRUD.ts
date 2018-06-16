import { DeleteCRUD, ExecCLIOptions } from '@neo-one/server-plugin';
import { Network, NetworkResourceOptions, NetworkResourceType } from '../NetworkResourceType';

export class DeleteNetworkCRUD extends DeleteCRUD<Network, NetworkResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: NetworkResourceType }) {
    super({
      resourceType,
      aliases: ['delete net'],
    });
  }

  public async postExecCLI({ cli }: ExecCLIOptions<NetworkResourceOptions>): Promise<void> {
    await cli.exec(`deactivate network`);
  }
}
