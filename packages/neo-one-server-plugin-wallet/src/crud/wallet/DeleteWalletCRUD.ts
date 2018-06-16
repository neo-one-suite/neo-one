import { DeleteCRUD, ExecCLIOptions, GetCLINameOptions, GetCLIResourceOptions } from '@neo-one/server-plugin';
import { Wallet, WalletResourceOptions, WalletResourceType } from '../../WalletResourceType';
import { common } from './common';

export class DeleteWalletCRUD extends DeleteCRUD<Wallet, WalletResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: WalletResourceType }) {
    super({
      resourceType,
      help:
        'Deletes the wallet called <name>. This permanently deletes ' +
        'the wallet from NEO•ONE, there is no way to recover it.',
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
