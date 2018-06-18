import { DescribeCRUD, GetCLINameOptions, GetCLIResourceOptions } from '@neo-one/server-plugin';
import { Wallet, WalletResourceOptions, WalletResourceType } from '../../WalletResourceType';
import { common } from './common';

export class DescribeWalletCRUD extends DescribeCRUD<Wallet, WalletResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: WalletResourceType }) {
    super({
      resourceType,
      options: common.options,
    });
  }

  public async getCLIName(options: GetCLINameOptions<WalletResourceOptions>): Promise<string> {
    return common.getCLIName(options);
  }

  public async getCLIResourceOptions(options: GetCLIResourceOptions): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
