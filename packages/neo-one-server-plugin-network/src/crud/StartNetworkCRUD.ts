import { ExecCLIOptions, StartCRUD } from '@neo-one/server-plugin';
import { Network, NetworkResourceOptions, NetworkResourceType } from '../NetworkResourceType';

export class StartNetworkCRUD extends StartCRUD<Network, NetworkResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: NetworkResourceType }) {
    super({
      resourceType,
      aliases: ['start net'],
    });
  }

  public async postExecCLI({ name, cli }: ExecCLIOptions<NetworkResourceOptions>): Promise<void> {
    await cli.exec(`activate network ${name}`);
  }
}
