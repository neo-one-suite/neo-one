/* @flow */
import { type GetCLIResourceOptions, GetCRUD } from '@neo-one/server-plugin';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../../WalletResourceType';

import common from './common';

export default class GetWalletCRUD extends GetCRUD<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: WalletResourceType |}) {
    super({
      resourceType,
      options: common.options,
    });
  }

  getCLIResourceOptions(
    options: GetCLIResourceOptions,
  ): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
