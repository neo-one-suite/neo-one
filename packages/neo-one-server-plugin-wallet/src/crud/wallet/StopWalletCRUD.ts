import { ExecCLIOptions, GetCLINameOptions, GetCLIResourceOptions, StopCRUD } from '@neo-one/server-plugin';
import { Wallet, WalletResourceOptions, WalletResourceType } from '../../WalletResourceType';
import { common } from './common';

export class StopWalletCRUD extends StopCRUD<Wallet, WalletResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: WalletResourceType }) {
    super({
      name: 'close',
      resourceType,
      help:
        'Closes the wallet called <name>. Only applies to MainNet ' +
        'wallets. Closing the wallet locks it and removes unencrypted ' +
        'private key.',
      options: common.options,
    });
  }

  public async getCLIName(options: GetCLINameOptions<WalletResourceOptions>): Promise<string> {
    return common.getCLIName(options);
  }

  public async getCLIResourceOptions(options: GetCLIResourceOptions): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }

  public async postExecCLI({ cli }: ExecCLIOptions<WalletResourceOptions>): Promise<void> {
    await cli.exec(`deactivate wallet`);
  }
}
