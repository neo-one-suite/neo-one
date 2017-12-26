/* @flow */
import {
  type GetCLINameOptions,
  type GetCLIResourceOptions,
  DescribeCRUD,
} from '@neo-one/server-plugin';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../../WalletResourceType';

import common from './common';

export default class DescribeWalletCRUD extends DescribeCRUD<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: WalletResourceType |}) {
    super({
      resourceType,
      options: common.options,
    });
  }

  getCLIName(
    options: GetCLINameOptions<WalletResourceOptions>,
  ): Promise<string> {
    return common.getCLIName(options);
  }

  getCLIResourceOptions(
    options: GetCLIResourceOptions,
  ): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
