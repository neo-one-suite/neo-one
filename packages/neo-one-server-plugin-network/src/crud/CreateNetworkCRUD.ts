import { CreateCRUD, ExecCLIOptions } from '@neo-one/server-plugin';
import { Network, NetworkResourceOptions, NetworkResourceType } from '../NetworkResourceType';

export class CreateNetworkCRUD extends CreateCRUD<Network, NetworkResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: NetworkResourceType }) {
    super({
      resourceType,
      help:
        'Creates a network called <name>. If <name> is "main" or ' +
        '"test", starts a node that syncs with the MainNet or TestNet ' +
        'respectively. Otherwise, starts a private node network called ' +
        '<name>.',
      aliases: ['create net'],
      autocomplete: ['main', 'test'],
      startOnCreate: true,
    });
  }

  public async postExecCLI({ name, cli }: ExecCLIOptions<NetworkResourceOptions>): Promise<void> {
    await cli.exec(`activate network ${name}`);
  }
}
