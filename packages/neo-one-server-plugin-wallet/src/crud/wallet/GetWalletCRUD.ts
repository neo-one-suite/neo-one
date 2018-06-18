import { GetCLIResourceOptions, GetCRUD } from '@neo-one/server-plugin';
import { Wallet, WalletResourceOptions, WalletResourceType } from '../../WalletResourceType';
import { common } from './common';

export class GetWalletCRUD extends GetCRUD<Wallet, WalletResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: WalletResourceType }) {
    super({
      resourceType,
      options: common.options,
    });
  }

  public async getCLIResourceOptions(options: GetCLIResourceOptions): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
